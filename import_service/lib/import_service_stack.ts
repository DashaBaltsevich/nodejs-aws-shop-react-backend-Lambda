import { CfnOutput, Stack, StackProps } from "aws-cdk-lib"
import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { Construct } from "constructs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { ImportProductsFileStack } from "../import_products_file_stack"
import { ImportFileParserStack } from "../import_file_parser_stack"

export class ImportServiceStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const importProductsFileStack = new ImportProductsFileStack(
			this,
			"ImportProductsFileStack"
		)

		new ImportFileParserStack(this, "ImportFileParserStack")

		const importProductsFileHandler = importProductsFileStack.importProductsFileLambda

		const authorizerLambdaArn = cdk.Fn.importValue("AuthorizerLambdaARN")
		const authorizerLambda = lambda.Function.fromFunctionArn(
			this,
			"basicAuthorizerLambda",
			authorizerLambdaArn
		)

		const authorizer = new apigateway.TokenAuthorizer(this, "Authorizer", {
			handler: authorizerLambda,
			identitySource: apigateway.IdentitySource.header("Authorization"),
		})

		const api = new apigateway.RestApi(this, "ImportServiceApi", {
			restApiName: "Import Service",
			description: "API for importing products file",
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowHeaders: [
					"Content-Type",
					"X-Amz-Date",
					"Authorization",
					"X-Api-Key",
					"X-Amz-Security-Token",
				],
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
		})

		const importEndpoint = api.root.addResource("import")

		const integration = new apigateway.LambdaIntegration(importProductsFileHandler)
		importEndpoint.addMethod("GET", integration, {
			authorizer,
			authorizationType: apigateway.AuthorizationType.CUSTOM,
			requestParameters: {
				"method.request.querystring.name": true,
			},
		})

		api.addGatewayResponse("GWResponseUnauthorized", {
			type: apigateway.ResponseType.UNAUTHORIZED,
			statusCode: "401",
			responseHeaders: {
				"Access-Control-Allow-Origin": "'*'",
				"Access-Control-Allow-Methods": "'*'",
				"Access-Control-Allow-Headers":
					"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
			},
		})

		api.addGatewayResponse("GWResponseAccessDenied", {
			type: apigateway.ResponseType.ACCESS_DENIED,
			statusCode: "403",
			responseHeaders: {
				"Access-Control-Allow-Origin": "'*'",
				"Access-Control-Allow-Methods": "'*'",
				"Access-Control-Allow-Headers":
					"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
			},
		})

		new cdk.CfnOutput(this, "ImportProductsFileFunctionArn", {
			value: importProductsFileHandler.functionArn,
			exportName: "ImportProductsFileFunctionArn",
		})

		new cdk.CfnOutput(this, "ImportProductsFileFunctionArnRole", {
			value: importProductsFileHandler.role!.roleArn,
			exportName: "ImportProductsFileFunctionArnRole",
		})
	}
}
