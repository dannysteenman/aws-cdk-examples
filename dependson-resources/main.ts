import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MyVpc');

    const rdsInstance = new rds.DatabaseInstance(this, 'MyRdsInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_19,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      vpc,
    });

    const ec2Instance = new ec2.Instance(this, 'MyEc2Instance', {
      vpc,
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: new ec2.AmazonLinuxImage(),
    });

    // Add dependency.
    ec2Instance.node.addDependency(rdsInstance);
  }
}

const app = new cdk.App();
new MyStack(app, 'MyStack');
app.synth();
