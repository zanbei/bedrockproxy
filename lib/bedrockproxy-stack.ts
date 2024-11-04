import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'; // Add this import
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Effect } from 'aws-cdk-lib/aws-iam';

export class BedrockproxyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Lambda@Edge function
    const headerRemoverFunction = new lambda.Function(this, 'Bedrockproxy', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 128,
      timeout: cdk.Duration.seconds(3),
      architecture: lambda.Architecture.X86_64,
    });

    // Add Lambda@Edge permissions
    const edgeRole = new iam.Role(this, 'EdgeRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('edgelambda.amazonaws.com')
      ),
    });

    // Add required policies
    edgeRole.addToPolicy(new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['arn:aws:logs:*:*:*'],
    }));

    edgeRole.addToPolicy(new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'lambda:GetFunction',
        'lambda:EnableReplication*',
      ],
      resources: [`${headerRemoverFunction.functionArn}:*`],
    }));

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'BedrockProxy', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('bedrock-runtime.us-west-2.amazonaws.com'), // Use origins.HttpOrigin
        edgeLambdas: [
          {
            functionVersion: headerRemoverFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          },
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Output the distribution domain name
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });
  }
}

