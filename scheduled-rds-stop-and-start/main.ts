import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';

export class ScheduledRDSStopandStartStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 3,
    });

    const rdsInstance = new rds.DatabaseInstance(this, 'rdsInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      vpc: vpc,
      allocatedStorage: 40,
      backupRetention: cdk.Duration.days(7),
      credentials: rds.Credentials.fromGeneratedSecret('rdsadmin'),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
      maxAllocatedStorage: 100,
      monitoringInterval: cdk.Duration.seconds(60),
      multiAz: false,
      storageEncrypted: true,
    });
    // Add tags to the RDS instance so it will be stopped by the lambda function
    cdk.Tags.of(rdsInstance).add('dev', 'Auto-Shutdown');

    const rdsPermissionPolicy = new iam.PolicyStatement({
      actions: [
        'rds:DescribeDBClusterParameters',
        'rds:StartDBCluster',
        'rds:StopDBCluster',
        'rds:DescribeDBEngineVersions',
        'rds:DescribeGlobalClusters',
        'rds:DescribePendingMaintenanceActions',
        'rds:DescribeDBLogFiles',
        'rds:StopDBInstance',
        'rds:StartDBInstance',
        'rds:DescribeReservedDBInstancesOfferings',
        'rds:DescribeReservedDBInstances',
        'rds:ListTagsForResource',
        'rds:DescribeValidDBInstanceModifications',
        'rds:DescribeDBInstances',
        'rds:DescribeSourceRegions',
        'rds:DescribeDBClusterEndpoints',
        'rds:DescribeDBClusters',
        'rds:DescribeDBClusterParameterGroups',
        'rds:DescribeOptionGroups',
      ],
      resources: [rdsInstance.instanceArn],
    });

    // Create lambda function to start an RDS instance
    const StopRDSFunction = new lambda.Function(this, 'StopRDSFunction', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'assets/stop-rds')),
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.handler',
      environment: {
        KEY: 'dev', // If the tags match, then stop the instances by validating the current status.
        VALUE: 'Auto-Shutdown', // If the tags match, then stop the instances by validating the current status.
        REGION: cdk.Stack.of(this).region,
      },
    });

    // Create lambda function to stop an RDS instance
    const StartRDSFunction = new lambda.Function(this, 'StartRDSFunction', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'assets/start-rds')),
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.handler',
      environment: {
        KEY: 'dev', // If the tags match, then stop the instances by validating the current status.
        VALUE: 'Auto-Shutdown', // If the tags match, then stop the instances by validating the current status.
        REGION: cdk.Stack.of(this).region,
      },
    });

    StopRDSFunction.addToRolePolicy(rdsPermissionPolicy);
    StartRDSFunction.addToRolePolicy(rdsPermissionPolicy);

    // Create schduled event to stop RDS instance at 6:00 PM UTC from Monday to Friday
    new events.Rule(this, 'StopRDSScheduleRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '18',
        month: '*',
        weekDay: 'MON-FRI',
        year: '*',
      }),
      targets: [new targets.LambdaFunction(StopRDSFunction)],
    });

    //Create schduled event to start RDS instance at 6:00 AM UTC from Monday to Friday
    new events.Rule(this, 'StartRDSScheduleRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '6',
        month: '*',
        weekDay: 'MON-FRI',
        year: '*',
      }),
      targets: [new targets.LambdaFunction(StartRDSFunction)],
    });
  }
}

const app = new cdk.App();
new ScheduledRDSStopandStartStack(app, 'ScheduledRDSStopandStartStack');
app.synth();
