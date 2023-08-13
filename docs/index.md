# Introduction

![Maven Central](https://img.shields.io/maven-central/v/io.github.stefanfreitag/azureS3RepositoryArchiver?color=green&style=flat-square)
[![npm version](https://badge.fury.io/js/azure-devops-repository-archiver.svg)](https://badge.fury.io/js/azure-devops-repository-archiver)
[![NuGet version](https://badge.fury.io/nu/Io.Github.StefanFreitag.AzureS3RepositoryArchiver.svg)](https://badge.fury.io/nu/Io.Github.StefanFreitag.AzureS3RepositoryArchiver)
[![PyPI version](https://badge.fury.io/py/azure-devops-repository-archiver.svg)](https://badge.fury.io/py/azure-devops-repository-archiver)

![Release](https://github.com/stefanfreitag/azure_s3_repository_archiver/workflows/release/badge.svg)

Allows to backup regularly git repositories hosted in Azure DevOps to an S3 Bucket.  
In the S3 bucket the backups are placed in a "directory" structure like

```plain
|
|--- organization 1
|       |
|       |--- project 1 
|       |      |
|       |      |--- repository 1
|       |      |
|       |      |--- repository 2
|       |      |  ...
|       |
|       |--- project 2
|       |
|       |--- ... 
|
|
|--- organization 2
| ...
```


## Prerequisites

The connection to the Azure DevOps organization requires a [personal access
token](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate).
The PAT needs to have "Code read" permission and stored in a SecretsManager secret

```shell
aws secretsmanager create-secret --name repository_archiver --description "Secret for the repository archiver" --secret-string "{\"pat\":\"<your_pat>\"}"
```

## How to use

### Example

- Add the library to your dependencies, e.g to the `package.json` file

  ```javascript
  "dependencies": {
    [...],
    "azure-devops-repository-archiver": "1.4.0",
  },
  ```

- Per `BackupConfiguration` a secret containing the Azure DevOps PAT needs to be
  specified. It can e.g. be imported

  ```typescript
  const secret = Secret.fromSecretAttributes(this, 'azure-devops-pat', {
    secretCompleteArn:
      'arn:aws:secretsmanager:eu-central-1:<aws_account_id>:secret:<secret_name>',
  });
  ```

- When creating the construct the required `BackupConfiguration`s can be passed
  as below. The grouping is per organization and project.

  ```typescript
   const backupConfigurations: BackupConfiguration[] = [
    {
      organizationName: 'MyOrganization',
      projectName: 'project-1',
      repositoryNames: [
        'repository-1-a',
        'repository-1-b',
      ],
      secretArn: secret.secretArn,
    },
    {
      organizationName: 'MyOrganization',
      projectName: 'project-2',
      repositoryNames: [
        'repository-2-a',
        'repository-2-b',
      ],
      secretArn: secret.secretArn,
    },
  ]
  ```

- The archiver properties and the archiver can then be created as

  ```typescript
  const archiverProps: ArchiverProperties = {
    retention: RetentionDays.ONE_WEEK,
    backupConfigurations: backupConfigurations,
  };
  new Archiver(this, 'archiver', archiverProps);
  ```

### Restoring a repository

- Download the archive from S3 to your local machine.
- Extract the archive.
  
  ```shell
  tar xzf backup.tar
  ```  

- Create a new directory and run a `git clone` operation.
  
  ```shell
  mkdir backup-repo
  cd backup-repo
  git clone ../backup.git
  ```
