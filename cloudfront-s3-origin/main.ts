import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class CloudfrontS3OriginStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'example.com'; // Replace with your domain name

    const publicHostedZone = new route53.PublicHostedZone(this, 'PublicHostedZone', {
      zoneName: domainName,
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: `Cloudfront Identity for ${domainName}`,
    });

    const webContentBucket = new s3.Bucket(this, 'WebsiteContentBucket', {
      bucketName: `${domainName}-${cdk.Stack.of(this).account}`, // Create Unique bucket name based on account id
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    webContentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [webContentBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      }),
    );

    const accessLogsBucket = new s3.Bucket(this, 'AccessLogBucket', {
      bucketName: `${domainName}-${cdk.Stack.of(this).account}-access-logs`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(publicHostedZone),
    });

    const cloudfrontDistribution = new cloudfront.Distribution(this, 'Distribution', {
      certificate: certificate,
      domainNames: [domainName],
      defaultRootObject: 'index.html',
      enableLogging: true,
      logBucket: accessLogsBucket,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: new origins.S3Origin(webContentBucket, { originAccessIdentity: cloudfrontOAI }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    new route53.ARecord(this, 'ARecordCloudFront', {
      zone: publicHostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudfrontDistribution)),
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsiteOnS3', {
      sources: [s3deploy.Source.asset(path.join(__dirname, 'assets'))],
      destinationBucket: webContentBucket,
    });
  }
}

const app = new cdk.App();
new CloudfrontS3OriginStack(app, 'CloudfrontS3OriginStack');
app.synth();
