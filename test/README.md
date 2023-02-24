# Testing

## Integrations test

- Installing recent version of integ-runner locally
  
  ```shell
  sudo npm install  -g @aws-cdk/integ-runner@2.64.0
  ```

- Running integration tests
  
  ```shell
  integ-runner -v --language typescript --parallel-regions eu-central-1 --profiles default
  ```

  ```shell
  integ-runner -v --language typescript --parallel-regions eu-central-1 --profiles default --update-on-failed
  ```
