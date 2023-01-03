import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  aws_codebuild as codebuild,
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
   *The KMS key used to encrypt the logs.
   *
   * @type {kms.Key}
   * @memberof Archiver
   */
  logGroupKmsKey: kms.Key;

  /**
   *The S3 bucket used to store the git repositories archive.
   *
   * @type {s3.Bucket}
   * @memberof Archiver
   */
  bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ArchiverProperties) {
    super(scope, id);
    this.props = props;

    this.logGroupKmsKey = this.createLogGroupKey();
    this.logGroup = this.createLogGroup();
    const topic = new sns.Topic(this, 'notifications', {
      displayName: 'archiver-notifications',
    });

    this.bucket = this.createArchiveBucket();
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.SnsDestination(topic),
    );
    this.createProjects();

    new CfnOutput(this, 's3-bucket-arn', {
      description: 'ARN of the S3 bucket storing the repositories.',
      value: this.bucket.bucketArn,
    });

    new CfnOutput(this, 'log-group-arn', {
      description:
        'ARN of the Cloudwatch Log group storing the code build logs.',
      value: this.logGroup.logGroupArn,
    });

    new CfnOutput(this, 'log-group-key', {
      description: 'ARN of the KMS key used to encrypt the Cloudwatch logs.',
      value: this.logGroupKmsKey.keyArn,
    });

    new CfnOutput(this, 'sns-topic-arn', {
      description: 'ARN of the SNS topic.',
      value: topic.topicArn,
    });
  }

  private createLogGroup() {
    const loggroup = new logs.LogGroup(this, 'loggroup', {
      encryptionKey: this.logGroupKmsKey,
      retention: this.props.retentionDays
        ? this.props.retentionDays
        : logs.RetentionDays.ONE_MONTH,
    });
    loggroup.node.addDependency(this.logGroupKmsKey);
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

  private createLogGroupKey() {
    const key = new kms.Key(this, 'loggroupKey', {
      description: 'Repository Archiver',
      enableKeyRotation: true,
      pendingWindow: Duration.days(7),
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      alias: 'archiver-loggroup-key',
    });
    key.grantEncryptDecrypt(
      new iam.ServicePrincipal(`logs.${Stack.of(this).region}.amazonaws.com`),
    );
    return key;
  }

  /**
   * Creates for each backup configuration a separate CodeBuild project.
   *
   * @private
   * @memberof Archiver
   */
  private createProjects() {
    this.props.backupConfigurations.forEach((element) => {
      const project = this.createProject(element);
      project.enableBatchBuilds();
      this.bucket.grantReadWrite(project);
    });
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
          batch: {
            'fail-fast': false,
            'build-list': this.createBatchConfiguration(
              element.repositoryNames,
            ),
          },
          phases: {
            build: {
              commands: [
                'git clone --mirror "https://${TOKEN}@dev.azure.com/${ORGANIZATION}/${PROJECT}/_git/${REPOSITORY}"',
                'tar czf ${REPOSITORY}.tgz ./${REPOSITORY}.git',
                'aws s3 cp ./${REPOSITORY}.tgz ' +
                  this.bucket.s3UrlForObject() +
                  '/${ORGANIZATION}/${PROJECT}/${REPOSITORY}.tgz',
              ],
            },
          },
        }),
      },
    );
  }

  private createBatchConfiguration(repositoryNames: string[]) {
    const output: BatchListElement[] = [];
    repositoryNames.forEach((element) => {
      output.push({
        identifier: 'build_' + element.replace(/-/g, '_'),
        env: {
          variables: {
            REPOSITORY: element,
          },
        },
      });
    });
    return output;
  }
}

export interface BatchListElement {
  readonly identifier: string;
  readonly env: Object;
}
