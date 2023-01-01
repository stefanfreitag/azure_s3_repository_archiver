# Azure DevOps Git Repository Archiver

[![npm version](https://badge.fury.io/js/azure-devops-repository-archiver.svg)](https://badge.fury.io/js/azure-devops-repository-archiver)
[![PyPI version](https://badge.fury.io/py/azure-devops-repository-archiver.svg)](https://badge.fury.io/py/azure-devops-repository-archiver)
![Release](https://github.com/stefanfreitag/azure_s3_repository_archiver/workflows/release/badge.svg)

Allows to backup regularly git repositories hosted in Azure DevOps to an S3 Bucket.

## Features

The S3 bucket is configured as below

- enabled versioning of objects
- enabled encryption using an S3 managed Key
- disallowing publich access
- A lifecycle configuration for the archived repositories. They transistion
  through different storage classes
  - Infrequent Access after 30 days
  - Glacier after 90 days
  - Deep Archive 180 days
  - Expiry after 365 days

The CodeBuild projects are configured as below

- Logging to CloudWatch
  - Encryption using customer-managed KMS key

## Planned Features

- Notifications to SNS about uploaded objects
- Tagging of created AWS resources

## Prerequisites

The connection to the Azure DevOps organization requires a [personal access
token](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate).
The PAT needs to have "Code read" permission and stored in a SecretsManager secret

```shell
aws secretsmanager create-secret --name rwest_archiver_rwest_platform --description "RWEST Archiver for RWEST-Platform organization" --secret-string "{\"pat\":\"<your_pat>\"}"
```

## Links

- [projen](https://github.com/projen/projen)
- [cdk](https://github.com/aws/aws-cdk)
