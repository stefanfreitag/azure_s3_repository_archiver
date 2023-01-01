import * as cdk from 'aws-cdk-lib/';
import { RemovalPolicy } from 'aws-cdk-lib/';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as snsNotifications from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
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
  logGroup: LogGroup;

  constructor(scope: Construct, id: string, props: ArchiverProperties) {
    super(scope, id);
    this.props = props;

    this.logGroup = this.createLogGroup();
    const topic = new sns.Topic(this, 'notifications', {
      displayName: 'archiver-notifications',
    });

    const bucket = this.createArchiveBucket();
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new snsNotifications.SnsDestination(topic),
    );
    this.createProjects(bucket);
  }

  private createLogGroup() {
    const key = this.createLogGroupKey();
    const loggroup = new logs.LogGroup(this, 'loggroup', {
      encryptionKey: key,
      retention: RetentionDays.ONE_WEEK,
    });
    loggroup.node.addDependency(key);
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
          expiration: cdk.Duration.days(360),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(180),
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
      pendingWindow: cdk.Duration.days(7),
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      alias: 'archiver-loggroup-key',
    });
    key.grantEncryptDecrypt(
      new iam.ServicePrincipal(
        `logs.${cdk.Stack.of(this).region}.amazonaws.com`,
      ),
    );
    return key;
  }

  /**
   * Creates for each backup configuration a separate CodeBuild project
   *
   * @private
   * @param {s3.Bucket} bucket
   * @memberof Archiver
   */
  private createProjects(bucket: s3.Bucket) {
    this.props.backupConfigurations.forEach((element) => {
      const project = this.createProject(element, bucket);
      project.enableBatchBuilds();
      bucket.grantReadWrite(project);
    });
  }

  /**
   * Create a CodeBuild project
   *
   * @private
   * @param {BackupConfiguration} element
   * @param {cdk.aws_s3.Bucket} bucket
   * @return {*}
   * @memberof Archiver
   */
  private createProject(
    element: BackupConfiguration,
    bucket: cdk.aws_s3.Bucket,
  ) {
    return new codebuild.Project(
      this,
      'archiver-' + element.organizationName + '-' + element.projectName,
      {
        timeout: cdk.Duration.hours(5),
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
                  bucket.s3UrlForObject() +
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
