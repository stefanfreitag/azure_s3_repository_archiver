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
   * ARN of the secret containing the token for accessing the git repositories
   * of the Azure DevOps organization.
   *
   * @type {string}
   * @memberof BackupConfiguration
   */
  readonly secretArn: string;
}
