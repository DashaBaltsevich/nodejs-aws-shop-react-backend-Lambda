import { aws_lambda as _lambda, Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"

export class GetProducts extends Stack {
	public readonly getProductsListHandler: _lambda.Function
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		this.getProductsListHandler = new _lambda.Function(
			this,
			"GetProductsListHandler",
			{
				runtime: _lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
				code: _lambda.Code.fromAsset("product_service/lambda_func/"), // Points to the lambda directory
				handler: "products_list.getProductsListHandler", // Points to the 'hello' file in the lambda directory
				environment: {
					MOCKS_PATH: "./lambda_func/mocks",
				},
			}
		)
	}
}
