import {
  aws_logs as logs,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { BackupConfiguration } from './backupConfiguration';


export interface ArchiverProperties {
  /**
   * The number of days to keep the Cloudwatch logs.
   * @default RetentionDays.ONE_MONTH
   *
   * @type {RetentionDays}
   * @memberof ArchiverProperties
   */
  readonly retentionDays?: logs.RetentionDays;

  /**
   * S3 events that will trigger a message to the SNS topic. For example
   * "EventType.LIFECYCLE_EXPIRATION" or "EventType.OBJECT_CREATED".
   *
   *
   * @type {s3.EventType[]}
   * @memberof ArchiverProperties
   */
  readonly notificationEvents?: s3.EventType[];
  /**
   * Contains details on the git repositories to be backed up.
   *
   * @type {BackupConfiguration[]}
   * @memberof ArchiverProperties
   */
  readonly backupConfigurations: BackupConfiguration[] ;

}