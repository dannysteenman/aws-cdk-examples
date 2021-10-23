import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";

// extend the props of the stack by adding the vpc type from the SharedInfraStack
export interface RDSStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class RdsStack extends cdk.Stack {
  readonly postgreSQLinstance: rds.DatabaseInstance;
  private vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props: RDSStackProps) {
    super(scope, id, props);
    // make the vpc variable accessible
    const vpc = props.vpc;

    const cluster = new rds.DatabaseCluster(this, "Database", {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_08_1,
      }),
      credentials: rds.Credentials.fromGeneratedSecret("clusteradmin"), // Optional - will default to 'admin' username and generated password
      instanceProps: {
        // optional , defaults to t3.medium
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE2,
          ec2.InstanceSize.SMALL
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.ISOLATED,
        },
        // select the vpc we imported to define the subnets for the RDS
        vpc,
      },
    });
  }
}
