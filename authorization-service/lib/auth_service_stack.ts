import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as path from "path"
import * as cdk from "aws-cdk-lib"
import * as iam from "aws-cdk-lib/aws-iam"

export class AuthServiceStack extends Stack {
	public readonly authServiceLambda: lambda.Function
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const userName = this.node.tryGetContext("userName")
		const password = this.node.tryGetContext("password")

		this.authServiceLambda = new lambda.Function(this, "AuthServiceLambda", {
			runtime: lambda.Runtime.NODEJS_LATEST,
			handler: "basicAuthorizer.basicAuthorizerHandler",
			code: lambda.Code.fromAsset(path.join(__dirname, "../lambda_func/")),
			environment: {
				[userName]: password,
			},
		})

		this.authServiceLambda.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ["logs:*"],
				resources: ["*"],
			})
		)

		this.authServiceLambda.grantInvoke(
			new iam.ServicePrincipal("apigateway.amazonaws.com")
		)

		new cdk.CfnOutput(this, "AuthorizerLambdaARNRole", {
			value: this.authServiceLambda.role!.roleArn,
			exportName: "AuthorizerLambdaARNRole",
		})

		new cdk.CfnOutput(this, "AuthorizerLambdaARN", {
			value: this.authServiceLambda.functionArn,
			exportName: "AuthorizerLambdaARN",
		})
	}
}
