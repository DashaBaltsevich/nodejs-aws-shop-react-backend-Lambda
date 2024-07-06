import { aws_lambda as _lambda, Stack, StackProps } from "aws-cdk-lib"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import * as sqs from "aws-cdk-lib/aws-sqs"
import * as sns from "aws-cdk-lib/aws-sns"
import * as subs from "aws-cdk-lib/aws-sns-subscriptions"
import { Construct } from "constructs"
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources"
import path = require("path")

export class CatalogItemsQueue extends Stack {
	public readonly catalogItemsQueueHandler: _lambda.Function
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const catalogItemsQueue = sqs.Queue.fromQueueArn(
			this,
			"catalogItemsQueue",
			"arn:aws:sqs:eu-central-1:590183751057:catalogItemsQueue"
		)

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

		const createProductTopic = new sns.Topic(this, "createProductTopic")
		createProductTopic.addSubscription(
			new subs.EmailSubscription("dasha.baltsevich111@gmail.com", {
				filterPolicy: {
					price: sns.SubscriptionFilter.numericFilter({
						greaterThan: 20,
					}),
				},
			})
		)

		createProductTopic.addSubscription(
			new subs.EmailSubscription("daryabaltsevich@gmail.com", {
				filterPolicy: {
					price: sns.SubscriptionFilter.numericFilter({
						lessThanOrEqualTo: 20,
					}),
				},
			})
		)

		this.catalogItemsQueueHandler = new _lambda.Function(
			this,
			"CatalogItemsQueueHandler",
			{
				runtime: _lambda.Runtime.NODEJS_20_X,
				code: _lambda.Code.fromAsset(path.join(__dirname, "lambda_func/")),
				handler: "catalog_batch_process.catalogBatchProcessHandler",
				environment: {
					PRODUCTS_TABLE: existingProductsTable.tableName,
					STOCKS_TABLE: existingStocksTable.tableName,
					SQS_URL: catalogItemsQueue.queueUrl,
					SNS_ARN: createProductTopic.topicArn,
				},
			}
		)

		const eventSource = new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
			batchSize: 5,
		})
		this.catalogItemsQueueHandler.addEventSource(eventSource)
		catalogItemsQueue.grantConsumeMessages(this.catalogItemsQueueHandler)
		createProductTopic.grantPublish(this.catalogItemsQueueHandler)
	}
}
