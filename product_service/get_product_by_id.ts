import { aws_lambda as _lambda, Stack, StackProps } from "aws-cdk-lib"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"
import path = require("path")

export class GetProductById extends Stack {
	public readonly getProductByIdHandler: _lambda.Function
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

		this.getProductByIdHandler = new _lambda.Function(this, "GetProductByIdHandler", {
			runtime: _lambda.Runtime.NODEJS_20_X,
			code: _lambda.Code.fromAsset(path.join(__dirname, "lambda_func/")),
			handler: "product_by_id.getProductByIdHandler",
			environment: {
				PRODUCTS_TABLE: existingProductsTable.tableName,
				STOCKS_TABLE: existingStocksTable.tableName,
			},
		})

		existingProductsTable.grantReadData(this.getProductByIdHandler)
		existingStocksTable.grantReadData(this.getProductByIdHandler)
	}
}
