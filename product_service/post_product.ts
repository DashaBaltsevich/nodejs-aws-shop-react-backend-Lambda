import { aws_lambda as _lambda, Stack, StackProps } from "aws-cdk-lib"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"
import path = require("path")

export class PostProduct extends Stack {
	public readonly postProductHandler: _lambda.Function
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const existingProductsTable = dynamodb.Table.fromTableName(
			this,
			"ExistingProductsTable",
			"Products"
		)
		const existingStocksTable = dynamodb.Table.fromTableName(
			this,
			"ExistingStocksTable",
			"Stocks"
		)

		this.postProductHandler = new _lambda.Function(this, "PostProductHandler", {
			runtime: _lambda.Runtime.NODEJS_20_X,
			code: _lambda.Code.fromAsset(path.join(__dirname, "lambda_func/")),
			handler: "create_product.createProductHandler",
			environment: {
				PRODUCTS_TABLE: existingProductsTable.tableName,
				STOCKS_TABLE: existingStocksTable.tableName,
			},
		})

		existingProductsTable.grantWriteData(this.postProductHandler)
		existingStocksTable.grantWriteData(this.postProductHandler)
	}
}
