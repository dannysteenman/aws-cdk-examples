# AWS CDK Examples

A repository that contains AWS CDK code examples written in Typescript for my blog https://towardsthecloud.com

## Running Examples

To run a Typescript example, execute the following:

```
$ npm install -g aws-cdk
$ cd EXAMPLE_DIRECTORY
$ npm install
$ cdk synth
$ cdk deploy
```

Then, to dispose of the stack/s afterwards

```
$ cdk destroy
```

## Table of Contents

| AWS CDK Example                                                                                    | Description                                                      | Blogpost link                                                                                       |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [application-load-balanced-fargate-service](./application-load-balanced-fargate-service/README.md) | Creating an Application Load Balanced Fargate Service in AWS CDK | [Click here](https://towardsthecloud.com/aws-cdk-application-load-balanced-fargate-service-example) |
| [openid-connect-bitbucket](./openid-connect-bitbucket/README.md)                                   | Create a Bitbucket OpenID Connect (OIDC) provider in AWS CDK     | [Click here](https://towardsthecloud.com/aws-cdk-openid-connect-bitbucket-example)                  |
| [openid-connect-github](./openid-connect-github/README.md)                                         | Create a GitHub OpenID Connect (OIDC) provider in AWS CDK        | [Click here](https://towardsthecloud.com/aws-cdk-openid-connect-github-example)                     |
| [scheduled-fargate-task](./scheduled-fargate-task/README.md)                                       | Creating a Scheduled Fargate Task example in AWS CDK             | [Click here](https://towardsthecloud.com/aws-cdk-scheduled-fargate-task-example)                    |
| [share-resources-across-stacks](./share-resources-across-stacks/README.md)                         | Creating a stack where you share resources to another stack      | [Click here](https://towardsthecloud.com/share-resources-across-stacks-aws-cdk)                     |

---

## Author

**[Danny Steenman](https://towardsthecloud.com)**

<p align="left">
  <a href="https://twitter.com/dannysteenman"><img src="https://img.shields.io/twitter/follow/dannysteenman?label=%40dannysteenman&style=social"></a>
</p>

---

## Support my work

If you found these AWS CDK examples helpful, please consider showing your support by buying me a coffee.

<a href="https://www.buymeacoffee.com/dannysteenman" target="_blank"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=dannysteenman&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"></a>