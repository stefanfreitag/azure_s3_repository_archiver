import { aws_logs as logs } from 'aws-cdk-lib';
import { BackupConfiguration } from './backupConfiguration';
export interface ArchiverProperties {
  /**
   * Number of days to keep the Cloudwatch logs.
   * @default RetentionDays.ONE_MONTH
   *
   * @type {RetentionDays}
   * @memberof ArchiverProperties
   */
  readonly retentionDays?: logs.RetentionDays;
  /**
   * Contains details on the git repositories to be backed up.
   *
   * @type {BackupConfiguration[]}
   * @memberof ArchiverProperties
   */
  readonly backupConfigurations: BackupConfiguration[] ;

}