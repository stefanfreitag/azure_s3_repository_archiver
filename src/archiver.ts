import * as cdk from 'aws-cdk-lib/';
import { RemovalPolicy } from 'aws-cdk-lib/';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as snsNotifications from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

import { ArchiverProperties } from './archiverProperties';

export class Archiver extends Construct {

  props: ArchiverProperties;
  constructor(scope: Construct, id: string, props: ArchiverProperties) {
    super(scope, id);
    this.props = props;

    const topic = new sns.Topic(this, 'notifications', {
      displayName: 'archiver-notifications',

    });


    const bucket = this.createArchiveBucket();
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new snsNotifications.SnsDestination(topic),
    );

  }

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

}