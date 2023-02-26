import * as cdk from 'aws-cdk-lib/';
import * as assertions from 'aws-cdk-lib/assertions';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { CfnKey } from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { CfnBucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Archiver } from '../src/archiver';

describe('S3 Bucket settings', () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
    new Archiver(stack, 'archiver', {
      backupConfigurations: [],
    });
  });

  test('Exactly one S3 bucket is created', () => {
    assertions.Template.fromStack(stack).resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('S3 bucket is not public accessible', () => {
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('S3 bucket has encryption enabled', () => {
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
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
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('S3 bucket lifecycle policy for objects', () => {
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            ExpirationInDays: 360,
            Status: 'Enabled',
            Transitions: [
              {
                StorageClass: 'STANDARD_IA',
                TransitionInDays: 30,
              },
              {
                StorageClass: 'GLACIER',
                TransitionInDays: 90,
              },
              {
                StorageClass: 'DEEP_ARCHIVE',
                TransitionInDays: 180,
              },
            ],
          },
        ],
      },
    });
  });
  test('S3 bucket lifecycle policy for non-current objects', () => {
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Status: 'Enabled',
            NoncurrentVersionTransitions: [
              {
                StorageClass: 'STANDARD_IA',
                TransitionInDays: 30,
              },
              {
                StorageClass: 'GLACIER',
                TransitionInDays: 90,
              },
              {
                StorageClass: 'DEEP_ARCHIVE',
                TransitionInDays: 180,
              },
            ],
          },
        ],
      },
    });
  });
});

describe('S3 events', () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
  });

  test('Zero configured S3 events', () => {
    new Archiver(stack, 'archiver', {
      backupConfigurations: [],
    });
    assertions.Template.fromStack(stack).resourceCountIs('Custom::S3BucketNotifications', 0);
  });

  test('One configured S3 events', () => {
    const archiver = new Archiver(stack, 'archiver', {
      backupConfigurations: [],
      notificationEvents: [EventType.LIFECYCLE_EXPIRATION],
    });

    const logicalBucketId = stack.getLogicalId(
      archiver.bucket.node.defaultChild as CfnBucket,
    );
    const logicalTopicId = stack.getLogicalId(
      archiver.topic.node.defaultChild as CfnBucket,
    );

    assertions.Template.fromStack(stack).resourceCountIs('Custom::S3BucketNotifications', 1);
    assertions.Template.fromStack(stack).hasResourceProperties('Custom::S3BucketNotifications', {
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

    const archiver = new Archiver(stack, 'archiver', {
      backupConfigurations: [],
      notificationEvents: [EventType.LIFECYCLE_EXPIRATION, EventType.OBJECT_CREATED],
    });

    const logicalBucketId = stack.getLogicalId(
      archiver.bucket.node.defaultChild as CfnBucket,
    );
    const logicalTopicId = stack.getLogicalId(
      archiver.topic.node.defaultChild as CfnBucket,
    );

    assertions.Template.fromStack(stack).resourceCountIs('Custom::S3BucketNotifications', 1);
    assertions.Template.fromStack(stack).hasResourceProperties('Custom::S3BucketNotifications', {
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
  let stack: cdk.Stack;
  let archiver: Archiver;
  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
    archiver = new Archiver(stack, 'archiver', {
      backupConfigurations: [],
    });
  });

  test('SNS topic count', () => {
    assertions.Template.fromStack(stack).resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('SNS Topic display name', () => {
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'archiver-notifications',
    });
  });

  test('SNS Topic encryption', () => {
    const logicalId = stack.getLogicalId(
      archiver.kmsKey.node.defaultChild as CfnKey,
    );

    assertions.Template.fromStack(stack).hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'archiver-notifications',
      KmsMasterKeyId: { 'Fn::GetAtt': [logicalId, 'Arn'] },
    });
  });
});

describe('CodeBuild settings', () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
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
  });

  test('Exact number of CodeBuild projects are setup ', () => {
    assertions.Template.fromStack(stack).resourceCountIs('AWS::CodeBuild::Project', 2);
  });

  test('Default CodeBuild configuration as expected ', () => {
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        Image: 'aws/codebuild/standard:6.0',
      },
      TimeoutInMinutes: 300,
    });
  });
});

describe('Default Logging settings', () => {

  let stack: cdk.Stack;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
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
  });

  test('Exactly one Log Group is created', () => {
    assertions.Template.fromStack(stack).resourceCountIs('AWS::Logs::LogGroup', 1);
  });

  test('Default Log Group retention', () => {
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 30,
    });
  });
});

describe('Logging settings', () => {

  let stack: cdk.Stack;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
  });


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
    assertions.Template.fromStack(stack).hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });
});

describe('Default Cloudwatch rule setup', () => {


  let stack: cdk.Stack;
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

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
    new Archiver(stack, 'archiver', {
      retentionDays: logs.RetentionDays.ONE_WEEK,
      backupConfigurations,
    });
  });


  test('Expected number of rules created', () => {
    assertions.Template.fromStack(stack).resourceCountIs('AWS::Events::Rule', 2);
  });

  test('Default schedule', () => {
    backupConfigurations.forEach(() => {
      assertions.Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 0 ? * 1 *)',
      });
    });
  });

  test('Description of rules', () => {
    backupConfigurations.forEach((configuration) => {
      assertions.Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
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

describe('Custom Cloudwatch rule setup', () => {


  let stack: cdk.Stack;
  const backupConfigurations = [
    {
      organizationName: 'organization-a',
      projectName: 'project-b',
      repositoryNames: ['repository-c'],
      schedule: Schedule.expression('cron(0 0 ? * 2 *)'),
      secretArn: 'secret-arn',
    },
    {
      organizationName: 'organization-a',
      projectName: 'project-d',
      repositoryNames: ['repository-c'],
      schedule: Schedule.expression('cron(0 0 ? * 2 *)'),
      secretArn: 'secret-arn',
    },
  ];

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'stack', {});
    new Archiver(stack, 'archiver', {
      retentionDays: logs.RetentionDays.ONE_WEEK,
      backupConfigurations,
    });
  });

  test('Cusstom schedule', () => {
    backupConfigurations.forEach(() => {
      assertions.Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 0 ? * 2 *)',
      });
    });
  });

});
