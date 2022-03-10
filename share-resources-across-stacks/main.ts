// file: bin/index.ts
import * as cdk from 'aws-cdk-lib';
import { SharedInfraStack } from './lib/shared-infra-stack';
import { RdsStack } from './lib/rds-stack';

const app = new cdk.App();

// created the SharedInfraStack with the VPC resource that we're going to share by making a variable
const infra = new SharedInfraStack(app, 'SharedInfraStack');

// pass the vpc resource from the SharedInfraStack to the RdsStack
new RdsStack(app, 'RdsStack', {
  vpc: infra.vpc,
});
