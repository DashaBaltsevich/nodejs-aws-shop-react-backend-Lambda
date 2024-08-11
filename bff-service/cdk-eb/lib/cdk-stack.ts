import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
require('dotenv').config();

export class BFFStackWithEB extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ebApi = process.env.EB_LINK;

    const api = new apigateway.RestApi(this, 'BFFApiWithEb', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowCredentials: true,
      },
    });

    const proxyResource = api.root.addProxy({
      anyMethod: false,
    });

    const ebIntegration = new apigateway.HttpIntegration(`${ebApi}/{proxy}`, {
      httpMethod: 'ANY',
      proxy: true,
      options: {
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
    });

    proxyResource.addMethod('ANY', ebIntegration, {
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });

    const deployment = new apigateway.Deployment(this, 'Deployment', {
      api,
    });

    const devStage = new apigateway.Stage(this, 'DevStage', {
      deployment,
      stageName: 'dev',
    });

    api.deploymentStage = devStage;
  }
}
