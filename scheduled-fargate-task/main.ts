import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecspatterns from '@aws-cdk/aws-ecs-patterns';
import * as logs from '@aws-cdk/aws-logs';
import * as events from '@aws-cdk/aws-events';

export class ECSCronTaskStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC with 9x subnets divided over 3 AZ's
    const vpc = new ec2.Vpc(this, 'SkeletonVpc', {
      cidr: '172.31.0.0/16',
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
    const cluster = new ecs.Cluster(this, 'scheduled-task-cluster', {
      clusterName: 'scheduled-task-cluster',
      containerInsights: true,
      vpc: vpc,
    });

    // Create a Fargate container image
    const image = ecs.ContainerImage.fromRegistry('amazonlinux:2');

    // Create higher level construct containing a scheduled fargate task
    new ecspatterns.ScheduledFargateTask(this, 'amazon-linux-sleep-task', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '13',
        day: '*',
        month: '*',
      }),
      cluster: cluster,
      platformVersion: ecs.FargatePlatformVersion.LATEST,
      scheduledFargateTaskImageOptions: {
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: id,
          logRetention: logs.RetentionDays.ONE_YEAR,
        }),
        image: image,
        command: ['sh', '-c', 'sleep 5'],
        environment: {
          APP_NAME: id,
        },
        memoryLimitMiB: 1024,
        cpu: 256,
      },
    });
  }
}

const app = new cdk.App();
new ECSCronTaskStack(app, 'ECSCronTaskStack');
app.synth();
