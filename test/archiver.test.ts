import * as cdk from 'aws-cdk-lib/';
import * as assertions from 'aws-cdk-lib/assertions';
import { CfnKey } from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { CfnBucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Archiver } from '../src/archiver';

describe('S3 Bucket settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});
  new Archiver(stack, 'archiver', {
    backupConfigurations: [],
  });
  const template = assertions.Template.fromStack(stack);

  test('Exactly one S3 bucket is created', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('S3 bucket is not public accessible', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('S3 bucket has encryption enabled', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });

  test('S3 bucket has versioning enabled', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });
});

describe('S3 events', () => {
  test('Zero configured S3 events', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', {});

    new Archiver(stack, 'archiver', {
      backupConfigurations: [],
    });
    const template = assertions.Template.fromStack(stack);
    template.resourceCountIs('Custom::S3BucketNotifications', 0);
  });

  test('One configured S3 events', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', {});

    const archiver = new Archiver(stack, 'archiver', {
      backupConfigurations: [],
      notificationEvents: [EventType.LIFECYCLE_EXPIRATION],
    });
    const template = assertions.Template.fromStack(stack);
    const logicalBucketId = stack.getLogicalId(
      archiver.bucket.node.defaultChild as CfnBucket,
    );
    const logicalTopicId = stack.getLogicalId(
      archiver.topic.node.defaultChild as CfnBucket,
    );

    template.resourceCountIs('Custom::S3BucketNotifications', 1);
    template.hasResourceProperties('Custom::S3BucketNotifications', {
      BucketName: { Ref: logicalBucketId },
      NotificationConfiguration: {
        TopicConfigurations: [
          {
            TopicArn: { Ref: logicalTopicId },
            Events: ['s3:LifecycleExpiration:*'],
          },
        ],
      },
    });
  });

  test('Multiple configured S3 events', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', {});

    const archiver = new Archiver(stack, 'archiver', {
      backupConfigurations: [],
      notificationEvents: [EventType.LIFECYCLE_EXPIRATION, EventType.OBJECT_CREATED],
    });
    const template = assertions.Template.fromStack(stack);

    const logicalBucketId = stack.getLogicalId(
      archiver.bucket.node.defaultChild as CfnBucket,
    );
    const logicalTopicId = stack.getLogicalId(
      archiver.topic.node.defaultChild as CfnBucket,
    );

    template.resourceCountIs('Custom::S3BucketNotifications', 1);
    template.hasResourceProperties('Custom::S3BucketNotifications', {
      BucketName: { Ref: logicalBucketId },
      NotificationConfiguration: {
        TopicConfigurations: [
          {
            TopicArn: { Ref: logicalTopicId },
            Events: ['s3:LifecycleExpiration:*'],
          },
          {
            TopicArn: { Ref: logicalTopicId },
            Events: ['s3:ObjectCreated:*'],
          },
        ],
      },
    });
  });
});

describe('SNS settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});
  const archiver = new Archiver(stack, 'archiver', {
    backupConfigurations: [],
  });
  const template = assertions.Template.fromStack(stack);

  test('SNS topic count', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('SNS Topic display name', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'archiver-notifications',
    });
  });

  test('SNS Topic encryption', () => {
    const logicalId = stack.getLogicalId(
      archiver.kmsKey.node.defaultChild as CfnKey,
    );

    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'archiver-notifications',
      KmsMasterKeyId: { 'Fn::GetAtt': [logicalId, 'Arn'] },
    });
  });
});

describe('CodeBuild settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});
  new Archiver(stack, 'archiver', {
    backupConfigurations: [
      {
        organizationName: 'organization-a',
        projectName: 'project-b',
        repositoryNames: ['repository-c'],
        secretArn: 'secret-arn',
      },
      {
        organizationName: 'organization-a',
        projectName: 'project-d',
        repositoryNames: ['repository-c'],
        secretArn: 'secret-arn',
      },
    ],
  });

  const template = assertions.Template.fromStack(stack);

  test('Exact number of CodeBuild projects are setup ', () => {
    template.resourceCountIs('AWS::CodeBuild::Project', 2);
  });

  test('Default CodeBuild configuration as expected ', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        Image: 'aws/codebuild/standard:6.0',
      },
      TimeoutInMinutes: 300,
    });
  });
});

describe('Default Logging settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});
  new Archiver(stack, 'archiver', {
    retentionDays: logs.RetentionDays.ONE_MONTH,
    backupConfigurations: [
      {
        organizationName: 'organization-a',
        projectName: 'project-b',
        repositoryNames: ['repository-c'],
        secretArn: 'secret-arn',
      },
      {
        organizationName: 'organization-a',
        projectName: 'project-d',
        repositoryNames: ['repository-c'],
        secretArn: 'secret-arn',
      },
    ],
  });
  const template = assertions.Template.fromStack(stack);

  test('Exactly one Log Group is created', () => {
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
  });

  test('Default Log Group retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 30,
    });
  });
});
describe('Logging settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});

  test('Custom retention period.', () => {
    new Archiver(stack, 'archiver', {
      retentionDays: logs.RetentionDays.ONE_WEEK,
      backupConfigurations: [
        {
          organizationName: 'organization-a',
          projectName: 'project-b',
          repositoryNames: ['repository-c'],
          secretArn: 'secret-arn',
        },
        {
          organizationName: 'organization-a',
          projectName: 'project-d',
          repositoryNames: ['repository-c'],
          secretArn: 'secret-arn',
        },
      ],
    });
    const template = assertions.Template.fromStack(stack);

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });
});

describe('Cloudwatch rules', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});
  const backupConfigurations = [
    {
      organizationName: 'organization-a',
      projectName: 'project-b',
      repositoryNames: ['repository-c'],
      secretArn: 'secret-arn',
    },
    {
      organizationName: 'organization-a',
      projectName: 'project-d',
      repositoryNames: ['repository-c'],
      secretArn: 'secret-arn',
    },
  ];
  new Archiver(stack, 'archiver', {
    retentionDays: logs.RetentionDays.ONE_WEEK,
    backupConfigurations,
  });

  test('Expected number of rules created', () => {
    const template = assertions.Template.fromStack(stack);
    template.resourceCountIs('AWS::Events::Rule', 2);
  });
  test('Description of rules', () => {
    const template = assertions.Template.fromStack(stack);
    backupConfigurations.forEach((configuration) => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description:
          'Trigger for backing up Azure DevOps git repositories of organization ' +
          configuration.organizationName +
          ' and project ' +
          configuration.projectName +
          '.',
      });
    });
  });
});
