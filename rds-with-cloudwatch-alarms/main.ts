import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';

export class RDSWithCWAlarmsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, 'CWAlertTopic', {
      topicName: 'cw-monitor-topic',
    });
    topic.grantPublish(new iam.ServicePrincipal('cloudwatch.amazonaws.com'));

    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 3,
    });

    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO); //t4g.micro
    const freeableMemoryAlertThreshold = 100; //t4g.micro has 1GB memory, set alert threshold to 100MB

    const rdsInstance = new rds.DatabaseInstance(this, 'rdsInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      vpc: vpc,
      allocatedStorage: 40,
      backupRetention: cdk.Duration.days(7),
      credentials: rds.Credentials.fromGeneratedSecret('rdsadmin'),
      instanceType: instanceType,
      maxAllocatedStorage: 100,
      monitoringInterval: cdk.Duration.seconds(60),
      multiAz: false,
      storageEncrypted: true,
    });

    const cpuCloudWatchAlarm = new cloudwatch.Alarm(this, 'cpuCloudWatchAlarm', {
      metric: rdsInstance.metric('CPUUtilization'),
      alarmDescription: `CPU over 75% for RDS instance: ${rdsInstance.instanceIdentifier}`,
      threshold: 75,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.IGNORE,
    });
    cpuCloudWatchAlarm.addAlarmAction(new cwactions.SnsAction(topic));

    const memCloudWatchAlarm = new cloudwatch.Alarm(this, 'memCloudWatchAlarm', {
      metric: rdsInstance.metric('FreeableMemory'),
      alarmDescription: `Less then ${freeableMemoryAlertThreshold}MB free memory left for RDS instance: ${rdsInstance.instanceIdentifier}`,
      threshold: freeableMemoryAlertThreshold,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.IGNORE,
    });
    memCloudWatchAlarm.addAlarmAction(new cwactions.SnsAction(topic));

    const storageCloudWatchAlarm = new cloudwatch.Alarm(this, 'storageCloudWatchAlarm', {
      metric: rdsInstance.metric('FreeStorageSpace'),
      alarmDescription: `Less then 10GB free storage left for RDS instance: ${rdsInstance.instanceIdentifier}`,
      threshold: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 3,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.IGNORE,
    });
    storageCloudWatchAlarm.addAlarmAction(new cwactions.SnsAction(topic));
  }
}

const app = new cdk.App();
new RDSWithCWAlarmsStack(app, 'RDSWithCWAlarmsStack');
app.synth();
