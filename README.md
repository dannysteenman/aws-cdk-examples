# aws-cdk-examples

A repository that contains AWS CDK code examples written in Typescript for my blog https://towardsthecloud.com

## Running Examples

To run a Typescript example, execute the following:

```
$ npm install -g aws-cdk
$ cd typescript/EXAMPLE_DIRECTORY
$ npm install
$ cdk synth
$ cdk deploy
```

Then, to dispose of the stack/s afterwards

```
$ cdk destroy
```

## Table of Contents

| Example                                                                                                                            | Description                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [application-load-balanced-fargate-service](https://towardsthecloud.com/aws-cdk-application-load-balanced-fargate-service-example) | Creating an Application Load Balanced Fargate Service in AWS CDK |
| [scheduled-fargate-task](https://towardsthecloud.com/aws-cdk-scheduled-fargate-task-example)                                       | Creating a Scheduled Fargate Task example in AWS CDK             |
