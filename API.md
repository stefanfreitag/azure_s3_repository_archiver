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
| <code><a href="#azure-devops-repository-archiver.Archiver.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.LogGroup</code> | Log group used by the CodeBuild projects. |
| <code><a href="#azure-devops-repository-archiver.Archiver.property.logGroupKmsKey">logGroupKmsKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | The KMS key used to encrypt the logs. |
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

##### `logGroup`<sup>Required</sup> <a name="logGroup" id="azure-devops-repository-archiver.Archiver.property.logGroup"></a>

```typescript
public readonly logGroup: LogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.LogGroup

Log group used by the CodeBuild projects.

---

##### `logGroupKmsKey`<sup>Required</sup> <a name="logGroupKmsKey" id="azure-devops-repository-archiver.Archiver.property.logGroupKmsKey"></a>

```typescript
public readonly logGroupKmsKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key

The KMS key used to encrypt the logs.

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
| <code><a href="#azure-devops-repository-archiver.ArchiverProperties.property.retentionDays">retentionDays</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Number of days to keep the Cloudwatch logs. |

---

##### `backupConfigurations`<sup>Required</sup> <a name="backupConfigurations" id="azure-devops-repository-archiver.ArchiverProperties.property.backupConfigurations"></a>

```typescript
public readonly backupConfigurations: BackupConfiguration[];
```

- *Type:* <a href="#azure-devops-repository-archiver.BackupConfiguration">BackupConfiguration</a>[]

Contains details on the git repositories to be backed up.

---

##### `retentionDays`<sup>Optional</sup> <a name="retentionDays" id="azure-devops-repository-archiver.ArchiverProperties.property.retentionDays"></a>

```typescript
public readonly retentionDays: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* RetentionDays.ONE_MONTH

Number of days to keep the Cloudwatch logs.

---

### BackupConfiguration <a name="BackupConfiguration" id="azure-devops-repository-archiver.BackupConfiguration"></a>

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



