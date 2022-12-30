import * as cdk from 'aws-cdk-lib/';
import * as assertions from 'aws-cdk-lib/assertions';
import { Archiver } from '../src/archiver';

describe('S3 Bucket settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});
  new Archiver(stack, 'archiver', {});
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

describe('SNS settings', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'stack', {});
  new Archiver(stack, 'archiver', {});
  const template = assertions.Template.fromStack(stack);

  test('SNS topic count', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('SNS Topic display name', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'archiver-notifications',
    });
  });
});