import { BackupConfiguration } from './backupConfiguration';

export interface ArchiverProperties {
  /**
   * Contains details on the git repositories to be backed up.
   *
   * @type {BackupConfiguration[]}
   * @memberof ArchiverProperties
   */
  readonly backupConfigurations: BackupConfiguration[] ;

}