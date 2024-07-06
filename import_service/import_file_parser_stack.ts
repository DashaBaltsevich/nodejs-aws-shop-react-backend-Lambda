import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import * as path from "path"
import { BUCKET_NAME, PREFIX } from "./lambda_func/constants"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as s3n from "aws-cdk-lib/aws-s3-notifications"
import * as sqs from "aws-cdk-lib/aws-sqs"

export class ImportFileParserStack extends cdk.Stack {
	public readonly importFileParserLambda: lambda.Function
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)

		const bucket = Bucket.fromBucketName(this, "ImportFileParserBucket", BUCKET_NAME)

		const catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue", {
			queueName: "catalogItemsQueue",
		})

		this.importFileParserLambda = new lambda.Function(
			this,
			"ImportFileParserLambda",
			{
				runtime: lambda.Runtime.NODEJS_LATEST,
				handler: "import_file_parser.importFileParserHandler",
				code: lambda.Code.fromAsset(path.join(__dirname, "lambda_func/")),
				environment: {
					BUCKET_NAME: BUCKET_NAME,
					SQS_URL: catalogItemsQueue.queueUrl,
				},
			}
		)

		catalogItemsQueue.grantSendMessages(this.importFileParserLambda)

		bucket.grantReadWrite(this.importFileParserLambda)
		bucket.grantReadWrite(this.importFileParserLambda)
		bucket.grantDelete(this.importFileParserLambda)

		bucket.addEventNotification(
			s3.EventType.OBJECT_CREATED,
			new s3n.LambdaDestination(this.importFileParserLambda),
			{ prefix: PREFIX }
		)
	}
}
