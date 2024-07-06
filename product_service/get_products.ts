import { aws_lambda as _lambda, Stack, StackProps } from "aws-cdk-lib"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"
import path = require("path")

export class GetProducts extends Stack {
	public readonly getProductsListHandler: _lambda.Function
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

		this.getProductsListHandler = new _lambda.Function(
			this,
			"GetProductsListHandler",
			{
				runtime: _lambda.Runtime.NODEJS_20_X,
				code: _lambda.Code.fromAsset(path.join(__dirname, "lambda_func/")),
				handler: "products_list.getProductsListHandler",
				environment: {
					PRODUCTS_TABLE: existingProductsTable.tableName,
					STOCKS_TABLE: existingStocksTable.tableName,
				},
			}
		)

		existingProductsTable.grantReadData(this.getProductsListHandler)
		existingStocksTable.grantReadData(this.getProductsListHandler)
	}
}
