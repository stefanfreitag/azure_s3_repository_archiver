const { awscdk, DevEnvironmentDockerImage } = require('projen');
const { Stability } = require('projen/lib/cdk');
const { UpgradeDependenciesSchedule } = require('projen/lib/javascript');

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Stefan Freitag',
  authorAddress: 'stefan.freitag@udo.edu',
  authorOrganization: false,
  catalog: {
    twitter: 'stefanfreitag',
    announce: false,
  },
  cdkVersion: '2.59.0',
  codeCov: true,
  defaultReleaseBranch: 'main',
  depsUpgradeOptions: {
    workflowOptions: {
      schedule: UpgradeDependenciesSchedule.WEEKLY,
    },
  },
  devContainer: true,
  keywords: ['aws', 'azure-devops', 'cdk', 'backup', 's3'],
  name: 'azure-devops-repository-archiver',
  repositoryUrl: 'https://github.com/stefanfreitag/azure_s3_repository_archiver.git',
  stability: Stability.EXPERIMENTAL,
  publishToMaven: {
    javaPackage: 'io.github.stefanfreitag.cdk.azures3repositoryarchiver',
    mavenArtifactId: 'azureS3RepositoryArchiver',
    mavenGroupId: 'io.github.stefanfreitag',
  },
  publishToPypi: {
    module: 'azure_devops_repository_archiver',
    distName: 'azure-devops-repository-archiver',
  },
});

project.devContainer.name='cdk-dev-environment';
project.devContainer.addDockerImage(DevEnvironmentDockerImage.fromFile('.gitpod.Dockerfile'));
project.devContainer.addVscodeExtensions('esbenp.prettier-vscode', 'dbaeumer.vscode-eslint');

const common_exclude = ['.history/', '.venv', '.idea'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();