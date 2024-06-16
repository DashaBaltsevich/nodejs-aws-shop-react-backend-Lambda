import { aws_lambda as _lambda, Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"

export class GetProductById extends Stack {
	public readonly getProductByIdHandler: _lambda.Function
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		this.getProductByIdHandler = new _lambda.Function(this, "GetProductByIdHandler", {
			runtime: _lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
			code: _lambda.Code.fromAsset("product_service/lambda_func/"), // Points to the lambda directory
			handler: "product_by_id.getProductByIdHandler", // Points to the 'hello' file in the lambda directory
			environment: {
				MOCKS_PATH: "./lambda_func/mocks",
			},
		})
	}
}
