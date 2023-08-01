import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class CustomRoleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new iam.Role(this, 'MyCustomRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const myFunction = new lambda.Function(this, 'MyLambdaFunction', {
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('event: ', event)
        };
      `),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      role,
    });

    myFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:*:*:*'],
    }));
  }
}

const app = new cdk.App();
new CustomRoleStack(app, 'CustomRoleStack');
app.synth();
