import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  aws_codebuild as codebuild,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_iam as iam,
  aws_kms as kms,
  aws_logs as logs,
  aws_sns as sns,
  aws_s3_notifications as s3Notifications,
  aws_s3 as s3,
} from 'aws-cdk-lib';

import { Construct } from 'constructs';
import { ArchiverProperties } from './archiverProperties';
import { BackupConfiguration } from './backupConfiguration';

/**
 * Every week
 */
const DEFAULT_CRON_EXPRESSION = 'cron(0 0 ? * 1 *)';

export class Archiver extends Construct {
  props: ArchiverProperties;

  /**
   * Log group used by the CodeBuild projects.
   *
   * @type {LogGroup}
   * @memberof Archiver
   */
  logGroup: logs.LogGroup;

  /**
   *The KMS key used to encrypt the logs and the SNS topic.
   *
   * @type {kms.Key}
   * @memberof Archiver
   */
  kmsKey: kms.Key;

  /**
   *The S3 bucket used to store the git repositories archive.
   *
   * @type {s3.Bucket}
   * @memberof Archiver
   */
  bucket: s3.Bucket;

  /**
   * SNS topic to send configured bucket events to.
   *
   * @type {sns.Topic}
   * @memberof Archiver
   */
  topic: sns.Topic;

  constructor(scope: Construct, id: string, props: ArchiverProperties) {
    super(scope, id);
    this.props = props;
    this.kmsKey = this.createKey();
    this.logGroup = this.createLogGroup();
    this.topic = new sns.Topic(this, 'notifications', {
      displayName: 'archiver-notifications',
      masterKey: this.kmsKey,
    });

    this.bucket = this.createArchiveBucket();
    this.createS3Notifications();
    this.createProjects();
    this.createCfnOutputs();
  }

  /**
   * Set up the S3-related event notifcations.
   *
   * @private
   * @memberof Archiver
   */
  private createS3Notifications() {
    if (this.props.notificationEvents) {
      this.props.notificationEvents.forEach((event) => {
        this.bucket.addEventNotification(
          event,
          new s3Notifications.SnsDestination(this.topic),
        );
      });
    }
  }

  private createCfnOutputs() {
    new CfnOutput(this, 's3-bucket-arn', {
      description: 'ARN of the S3 bucket storing the repositories.',
      value: this.bucket.bucketArn,
    });

    new CfnOutput(this, 'log-group-arn', {
      description:
        'ARN of the Cloudwatch Log group storing the code build logs.',
      value: this.logGroup.logGroupArn,
    });

    new CfnOutput(this, 'kms-key', {
      description:
        'ARN of the KMS key used to encrypt the Cloudwatch logs and the SNS topic.',
      value: this.kmsKey.keyArn,
    });

    new CfnOutput(this, 'sns-topic-arn', {
      description: 'ARN of the SNS topic.',
      value: this.topic.topicArn,
    });
  }

  private createLogGroup() {
    const loggroup = new logs.LogGroup(this, 'loggroup', {
      encryptionKey: this.kmsKey,
      retention: this.props.retentionDays
        ? this.props.retentionDays
        : logs.RetentionDays.ONE_MONTH,
    });
    loggroup.node.addDependency(this.kmsKey);
    return loggroup;
  }

  /**
   *Create the S3 bucket that will later store the repositories.
   *
   * @private
   * @return {*}
   * @memberof Archiver
   */
  private createArchiveBucket() {
    return new s3.Bucket(this, 'destination', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          expiration: Duration.days(360),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: Duration.days(180),
            },
          ],
        },
      ],
      publicReadAccess: false,
      versioned: true,
    });
  }

  private createKey() {
    const key = new kms.Key(this, 'loggroupKey', {
      description: 'Azure DevOps git repository archiver',
      enableKeyRotation: true,
      pendingWindow: Duration.days(7),
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    });
    key.grantEncryptDecrypt(
      new iam.ServicePrincipal(`logs.${Stack.of(this).region}.amazonaws.com`),
    );
    if (this.props.notificationEvents) {
      key.grantEncryptDecrypt(new iam.ServicePrincipal('s3.amazonaws.com'));
    }

    return key;
  }

  /**
   * Creates for each backup configuration a separate CodeBuild project.
   *
   * @private
   * @memberof Archiver
   */
  private createProjects() {
    this.props.backupConfigurations.forEach((configuration) => {
      const project = this.createProject(configuration);
      this.bucket.grantReadWrite(project);
      this.createCloudwatchRule(project, configuration);
    });
  }

  private createCloudwatchRule(
    project: codebuild.Project,
    element: BackupConfiguration,
  ) {
    new events.Rule(
      this,
      'ScheduleRule-' + element.organizationName + '-' + element.projectName,
      {
        enabled: true,
        schedule: events.Schedule.expression(DEFAULT_CRON_EXPRESSION),
        targets: [new eventsTargets.CodeBuildProject(project)],
        description:
          'Trigger for backing up Azure DevOps git repositories of organization ' +
          element.organizationName +
          ' and project ' +
          element.projectName +
          '.',
      },
    );
  }

  /**
   * Create a CodeBuild project.
   *
   * @private
   * @param {BackupConfiguration} element
   * @return {*}
   * @memberof Archiver
   */
  private createProject(element: BackupConfiguration) {
    return new codebuild.Project(
      this,
      'archiver-' + element.organizationName + '-' + element.projectName,
      {
        timeout: Duration.hours(5),
        projectName:
          'AzureDevOpsGitBackup' +
          '-' +
          element.organizationName +
          '-' +
          element.projectName,
        description: 'Backup Azure DevOps git repositories to an S3 bucket.',
        checkSecretsInPlainTextEnvVariables: true,
        concurrentBuildLimit: 90,
        environment: {
          environmentVariables: {
            TOKEN: {
              value: element.secretArn + ':pat',
              type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER,
            },
            ORGANIZATION: { value: element.organizationName },
            PROJECT: { value: element.projectName },
          },
          buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
        },
        logging: {
          cloudWatch: {
            enabled: true,
            logGroup: this.logGroup,
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: 0.2,
          phases: {
            build: {
              commands: this.createCommands(element.repositoryNames),
            },
          },
        }),
      },
    );
  }

  private createCommands(repositoryNames: string[]) {
    const output: string[] = [];
    repositoryNames.forEach((element) => {
      output.push(
        'git clone --mirror "https://${TOKEN}@dev.azure.com/${ORGANIZATION}/${PROJECT}/_git/' + element+ '"',
        'tar czf '+ element +'.tgz ' + element+'.git',
        'aws s3 cp ./'+ element +'.tgz ' +
          this.bucket.s3UrlForObject() +
          '/${ORGANIZATION}/${PROJECT}/'+ element+'.tgz',
        'rm -f '+ element +'.tgz');
    });
    return output;
  }
}
