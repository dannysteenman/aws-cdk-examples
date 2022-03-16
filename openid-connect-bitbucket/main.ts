import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface BitbucketStackProps extends cdk.StackProps {
  /**
    * Name of the deploy role to assume in Bitbucket pipelines.
    *
    * @default - 'exampleBitbucketDeployRole'
    */
  readonly deployRole: string;
  /**
   * The audience is the client ID issued by the Identity provider for your app.
   * You can find this value in the OpenID Connect tab of the bitbucket repository settings.
   *
   * Example:
   * ari:cloud:bitbucket::workspace/680cb3e455d4-f8b9b8d8f8d9-ddbb-4e19-baf1
   *
   * @see https://support.atlassian.com/bitbucket-cloud/docs/deploy-on-aws-using-bitbucket-pipelines-openid-connect/
   */
  readonly bitbucketAudience: string;
  /**
   * The Provider URL is the secure OpenID Connect URL used for authentication requests
   * You can find this value in the OpenID Connect tab of the bitbucket repository settings.
   * Note: remove https:// from the URL.
   *
   * Example:
   * api.bitbucket.org/2.0/workspaces/<WORKSPACE>/pipelines-config/identity/oidc
   *
   * @see https://support.atlassian.com/bitbucket-cloud/docs/deploy-on-aws-using-bitbucket-pipelines-openid-connect/
   */
  readonly bitbucketDomain: string;
}

export class BitbucketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BitbucketStackProps) {
    super(scope, id, props);

    const bitbucketProvider = new iam.OpenIdConnectProvider(this, 'bitbucketProvider', {
      url: `https://${props.bitbucketDomain}`,
      clientIds: [props.bitbucketAudience],
    });

    // grant only requests coming from a specific Bitbucket workspace.
    const conditions: iam.Conditions = {
      StringEquals: {
        [`${props.bitbucketDomain}:aud`]: props.bitbucketAudience,
      },
    };

    new iam.Role(this, 'exampleBitbucketDeployRole', {
      assumedBy: new iam.WebIdentityPrincipal(bitbucketProvider.openIdConnectProviderArn, conditions),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
      roleName: props.deployRole,
      description: 'This role is used via Bitbucket pipelines to deploy with AWS CDK or Terraform on the customers AWS account',
      maxSessionDuration: cdk.Duration.hours(2),
    });
  }
}

const app = new cdk.App();
new BitbucketStack(app, 'BitbucketOpenIDConnect', {
  deployRole: 'exampleBitbucketDeployRole',
  //replace <WORKSPACE> with your own unique workspace name
  bitbucketDomain: 'api.bitbucket.org/2.0/workspaces/<WORKSPACE>/pipelines-config/identity/oidc',
  //replace audience with your audience identifier from the OpenID Connect tab of the bitbucket repository settings
  bitbucketAudience: 'ari:cloud:bitbucket::workspace/680cb3e455d4-f8b9b8d8f8d9-ddbb-4e19-baf1',
});
app.synth();
