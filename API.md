# Azure DevOps Git Repository Archiver

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

## Features

The S3 bucket is configured as below

- enabled versioning of objects
- enabled encryption using an S3 managed Key
- disallowing public access
- A lifecycle configuration for the archived repositories. They and their
  versions transistion through different storage classes
  - Infrequent Access after 30 days
  - Glacier after 90 days
  - Deep Archive 180 days
  - Expiry after 365 days
- configurable notifications to SNS about uploaded/ expired objects

The CodeBuild projects are configured as below

- Logging to CloudWatch
  - Configurable retention period. Default is one month.
  - Encryption using customer-managed KMS key
- Schedule based execution.
  - The default schedule is one week and can be overriden as part of the backup
    configuration.

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

## Links

- [projen](https://github.com/projen/projen)
- [cdk](https://github.com/aws/aws-cdk)
- [AWS CodeBuild Specification](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)

# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### Archiver <a name="Archiver" id="azure-devops-repository-archiver.Archiver"></a>

#### Initializers <a name="Initializers" id="azure-devops-repository-archiver.Archiver.Initializer"></a>

```typescript
import { Archiver } from 'azure-devops-repository-archiver'

new Archiver(scope: Construct, id: string, props: ArchiverProperties)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#azure-devops-repository-archiver.Archiver.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#azure-devops-repository-archiver.Archiver.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#azure-devops-repository-archiver.Archiver.Initializer.parameter.props">props</a></code> | <code><a href="#azure-devops-repository-archiver.ArchiverProperties">ArchiverProperties</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="azure-devops-repository-archiver.Archiver.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="azure-devops-repository-archiver.Archiver.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="azure-devops-repository-archiver.Archiver.Initializer.parameter.props"></a>

- *Type:* <a href="#azure-devops-repository-archiver.ArchiverProperties">ArchiverProperties</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#azure-devops-repository-archiver.Archiver.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="azure-devops-repository-archiver.Archiver.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#azure-devops-repository-archiver.Archiver.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="azure-devops-repository-archiver.Archiver.isConstruct"></a>

```typescript
import { Archiver } from 'azure-devops-repository-archiver'

Archiver.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="azure-devops-repository-archiver.Archiver.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#azure-devops-repository-archiver.Archiver.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#azure-devops-repository-archiver.Archiver.property.bucket">bucket</a></code> | <code>aws-cdk-lib.aws_s3.Bucket</code> | The S3 bucket used to store the git repositories archive. |
| <code><a href="#azure-devops-repository-archiver.Archiver.property.kmsKey">kmsKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | The KMS key used to encrypt the logs and the SNS topic. |
| <code><a href="#azure-devops-repository-archiver.Archiver.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.LogGroup</code> | Log group used by the CodeBuild projects. |
| <code><a href="#azure-devops-repository-archiver.Archiver.property.props">props</a></code> | <code><a href="#azure-devops-repository-archiver.ArchiverProperties">ArchiverProperties</a></code> | *No description.* |
| <code><a href="#azure-devops-repository-archiver.Archiver.property.topic">topic</a></code> | <code>aws-cdk-lib.aws_sns.Topic</code> | SNS topic to send configured bucket events to. |

---

##### `node`<sup>Required</sup> <a name="node" id="azure-devops-repository-archiver.Archiver.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `bucket`<sup>Required</sup> <a name="bucket" id="azure-devops-repository-archiver.Archiver.property.bucket"></a>

```typescript
public readonly bucket: Bucket;
```

- *Type:* aws-cdk-lib.aws_s3.Bucket

The S3 bucket used to store the git repositories archive.

---

##### `kmsKey`<sup>Required</sup> <a name="kmsKey" id="azure-devops-repository-archiver.Archiver.property.kmsKey"></a>

```typescript
public readonly kmsKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key

The KMS key used to encrypt the logs and the SNS topic.

---

##### `logGroup`<sup>Required</sup> <a name="logGroup" id="azure-devops-repository-archiver.Archiver.property.logGroup"></a>

```typescript
public readonly logGroup: LogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.LogGroup

Log group used by the CodeBuild projects.

---

##### `props`<sup>Required</sup> <a name="props" id="azure-devops-repository-archiver.Archiver.property.props"></a>

```typescript
public readonly props: ArchiverProperties;
```

- *Type:* <a href="#azure-devops-repository-archiver.ArchiverProperties">ArchiverProperties</a>

---

##### `topic`<sup>Required</sup> <a name="topic" id="azure-devops-repository-archiver.Archiver.property.topic"></a>

```typescript
public readonly topic: Topic;
```

- *Type:* aws-cdk-lib.aws_sns.Topic

SNS topic to send configured bucket events to.

---


## Structs <a name="Structs" id="Structs"></a>

### ArchiverProperties <a name="ArchiverProperties" id="azure-devops-repository-archiver.ArchiverProperties"></a>

#### Initializer <a name="Initializer" id="azure-devops-repository-archiver.ArchiverProperties.Initializer"></a>

```typescript
import { ArchiverProperties } from 'azure-devops-repository-archiver'

const archiverProperties: ArchiverProperties = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#azure-devops-repository-archiver.ArchiverProperties.property.backupConfigurations">backupConfigurations</a></code> | <code><a href="#azure-devops-repository-archiver.BackupConfiguration">BackupConfiguration</a>[]</code> | Contains details on the git repositories to be backed up. |
| <code><a href="#azure-devops-repository-archiver.ArchiverProperties.property.notificationEvents">notificationEvents</a></code> | <code>aws-cdk-lib.aws_s3.EventType[]</code> | S3 events that will trigger a message to the SNS topic. |
| <code><a href="#azure-devops-repository-archiver.ArchiverProperties.property.retentionDays">retentionDays</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | The number of days to keep the Cloudwatch logs. |

---

##### `backupConfigurations`<sup>Required</sup> <a name="backupConfigurations" id="azure-devops-repository-archiver.ArchiverProperties.property.backupConfigurations"></a>

```typescript
public readonly backupConfigurations: BackupConfiguration[];
```

- *Type:* <a href="#azure-devops-repository-archiver.BackupConfiguration">BackupConfiguration</a>[]

Contains details on the git repositories to be backed up.

---

##### `notificationEvents`<sup>Optional</sup> <a name="notificationEvents" id="azure-devops-repository-archiver.ArchiverProperties.property.notificationEvents"></a>

```typescript
public readonly notificationEvents: EventType[];
```

- *Type:* aws-cdk-lib.aws_s3.EventType[]

S3 events that will trigger a message to the SNS topic.

For example
"EventType.LIFECYCLE_EXPIRATION" or "EventType.OBJECT_CREATED".

---

##### `retentionDays`<sup>Optional</sup> <a name="retentionDays" id="azure-devops-repository-archiver.ArchiverProperties.property.retentionDays"></a>

```typescript
public readonly retentionDays: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* RetentionDays.ONE_MONTH

The number of days to keep the Cloudwatch logs.

---

### BackupConfiguration <a name="BackupConfiguration" id="azure-devops-repository-archiver.BackupConfiguration"></a>

A backup configuration defining - the repositories to backup, and   - the backup interval All repositories that are part of a backup configuration are belonging to the same Azure DevOps organization and project.

#### Initializer <a name="Initializer" id="azure-devops-repository-archiver.BackupConfiguration.Initializer"></a>

```typescript
import { BackupConfiguration } from 'azure-devops-repository-archiver'

const backupConfiguration: BackupConfiguration = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#azure-devops-repository-archiver.BackupConfiguration.property.organizationName">organizationName</a></code> | <code>string</code> | The name of the Azure DevOps organization. |
| <code><a href="#azure-devops-repository-archiver.BackupConfiguration.property.projectName">projectName</a></code> | <code>string</code> | The name of the Azure DevOps project. |
| <code><a href="#azure-devops-repository-archiver.BackupConfiguration.property.repositoryNames">repositoryNames</a></code> | <code>string[]</code> | The names of the git repositories to backup. |
| <code><a href="#azure-devops-repository-archiver.BackupConfiguration.property.secretArn">secretArn</a></code> | <code>string</code> | ARN of the secret containing the token for accessing the git repositories of the Azure DevOps organization. |
| <code><a href="#azure-devops-repository-archiver.BackupConfiguration.property.schedule">schedule</a></code> | <code>aws-cdk-lib.aws_events.Schedule</code> | The schedule allows to define the frequency of backups. |

---

##### `organizationName`<sup>Required</sup> <a name="organizationName" id="azure-devops-repository-archiver.BackupConfiguration.property.organizationName"></a>

```typescript
public readonly organizationName: string;
```

- *Type:* string

The name of the Azure DevOps organization.

---

##### `projectName`<sup>Required</sup> <a name="projectName" id="azure-devops-repository-archiver.BackupConfiguration.property.projectName"></a>

```typescript
public readonly projectName: string;
```

- *Type:* string

The name of the Azure DevOps project.

---

##### `repositoryNames`<sup>Required</sup> <a name="repositoryNames" id="azure-devops-repository-archiver.BackupConfiguration.property.repositoryNames"></a>

```typescript
public readonly repositoryNames: string[];
```

- *Type:* string[]

The names of the git repositories to backup.

---

##### `secretArn`<sup>Required</sup> <a name="secretArn" id="azure-devops-repository-archiver.BackupConfiguration.property.secretArn"></a>

```typescript
public readonly secretArn: string;
```

- *Type:* string

ARN of the secret containing the token for accessing the git repositories of the Azure DevOps organization.

---

##### `schedule`<sup>Optional</sup> <a name="schedule" id="azure-devops-repository-archiver.BackupConfiguration.property.schedule"></a>

```typescript
public readonly schedule: Schedule;
```

- *Type:* aws-cdk-lib.aws_events.Schedule
- *Default:* Schedule.expression('cron(0 0 ? * 1 *)')

The schedule allows to define the frequency of backups.

If not defined, a weekly backup is configured.

---



