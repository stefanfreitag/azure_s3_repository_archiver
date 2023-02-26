import {
  AssertionsProvider,
  ExpectedResult,
  IntegTest,
} from '@aws-cdk/integ-tests-alpha';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Archiver } from '../src/';

class StackUnderTest extends Stack {
  archiver: Archiver;
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    this.archiver = new Archiver(this, 'archiver', {
      backupConfigurations: [],
    });
  }
}

// Beginning of the test suite
const app = new App();

const stack = new StackUnderTest(app, 'empty-backup-configuration', {});
const integ = new IntegTest(app, 'MyTestCase', {
  regions: ['eu-central-1'],
  testCases: [stack],
});

const output = integ.assertions.awsApiCall('S3', 'getBucketVersioning', {
  Bucket: stack.archiver.bucket.bucketName,
});

output.expect(
  ExpectedResult.objectLike({
    Status: 'Enabled',
  }),
);

const output2 = integ.assertions.awsApiCall('S3', 'getBucketEncryption', {
  Bucket: stack.archiver.bucket.bucketName,
});

const assertionProvider = output2.node.tryFindChild(
  'SdkProvider',
) as AssertionsProvider;
assertionProvider.addPolicyStatementFromSdkCall(
  's3',
  'GetEncryptionConfiguration',
  [stack.archiver.bucket.bucketArn],
);
console.log(output2);
output2.expect(
  ExpectedResult.objectLike({
    ServerSideEncryptionConfiguration: {
      Rules: [
        {
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
  }),
);

app.synth();
