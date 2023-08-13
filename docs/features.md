# Features

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
