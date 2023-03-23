import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecspatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ECSServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC with 9x subnets divided over 3 AZ's
    const vpc = new ec2.Vpc(this, 'SkeletonVpc', {
      cidr: '172.31.0.0/16',
      natGateways: 1,
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
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          cidrMask: 20,
          name: 'data',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, 'service-cluster', {
      clusterName: 'service-cluster',
      containerInsights: true,
      vpc: vpc,
    });

    // Create a Fargate container image
    const image = ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample');

    // Create higher level construct containing the Fargate service with a load balancer
    new ecspatterns.ApplicationLoadBalancedFargateService(this, 'amazon-ecs-sample', {
      cluster,
      circuitBreaker: {
        rollback: true,
      },
      memoryLimitMiB: 512, // Supported configurations: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationMultipleTargetGroupsFargateService.html#memorylimitmib
      cpu: 256,
      desiredCount: 1,
      taskImageOptions: {
        image: image,
        containerPort: 80,
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: id,
          logRetention: logs.RetentionDays.ONE_YEAR,
        }),
      },
    });
  }
}

const app = new cdk.App();
new ECSServiceStack(app, 'ECSServiceStack');
app.synth();
