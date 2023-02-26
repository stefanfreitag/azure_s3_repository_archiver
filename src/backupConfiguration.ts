import { Schedule } from 'aws-cdk-lib/aws-events';

/**
 * A backup configuration defining
 * - the repositories to backup, and
 *  - the backup interval
 * All repositories that are part of a backup configuration are belonging to the
 * same Azure DevOps organization and project.
 * @export
 * @interface BackupConfiguration
 */
export interface BackupConfiguration {
  /**
   * The name of the Azure DevOps organization.
   *
   * @type {string}
   * @memberof BackupConfiguration
   */
  readonly organizationName: string;
  /**
   * The name of the Azure DevOps project.
   *
   * @type {string}
   * @memberof BackupConfiguration
   */
  readonly projectName: string;

  /**
   * The names of the git repositories to backup.
   *
   * @type {string[]}
   * @memberof BackupConfiguration
   */
  readonly repositoryNames: string[];

  /**
   * The schedule allows to define the frequency of backups.
   * If not defined, a weekly backup is configured.
   * @default Schedule.expression('cron(0 0 ? * 1 *)')
   * @type {Schedule}
   * @memberof BackupConfiguration
   */
  readonly schedule?: Schedule;

  /**
   * ARN of the secret containing the token for accessing the git repositories
   * of the Azure DevOps organization.
   *
   * @type {string}
   * @memberof BackupConfiguration
   */
  readonly secretArn: string;
}
