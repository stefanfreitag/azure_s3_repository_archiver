const { awscdk } = require('projen');
const { Stability } = require('projen/lib/cdk');
const { UpgradeDependenciesSchedule } = require('projen/lib/javascript');

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Stefan Freitag',
  authorAddress: 'stefan.freitag@udo.edu',
  authorOrganization: false,
  cdkVersion: '2.58.1',
  defaultReleaseBranch: 'main',
  keywords: ['aws', 'azure-devops', 'cdk', 'backup', 's3'],
  name: 'azure_s3_repository_archiver',
  repositoryUrl: 'https://github.com/stefanfreitag/azure_s3_repository_archiver.git',
  stability: Stability.EXPERIMENTAL,
});

const common_exclude = ['.history/', '.venv', '.idea'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();