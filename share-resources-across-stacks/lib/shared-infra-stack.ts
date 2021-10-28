import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";

export class SharedInfraStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // assign a VPC to the class property SharedInfraStack
    this.vpc = new ec2.Vpc(this, 'SkeletonVpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          cidrMask: 20,
          name: 'data',
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    });
  }
}
