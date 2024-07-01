import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as path from "path"
import { Construct } from "constructs"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { BUCKET_NAME } from "./lambda_func/constants"

export class ImportProductsFileStack extends cdk.Stack {
	public readonly importProductsFileLambda: lambda.Function
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)

		this.importProductsFileLambda = new lambda.Function(
			this,
			"ImportProductsFileLambda",
			{
				runtime: lambda.Runtime.NODEJS_LATEST,
				handler: "import_products_file.importProductsFileHandler",
				code: lambda.Code.fromAsset(path.join(__dirname, "lambda_func/")),
				environment: {
					BUCKET_NAME: BUCKET_NAME,
				},
			}
		)

		const bucket = Bucket.fromBucketName(
			this,
			"ImportProductsFileBucket",
			BUCKET_NAME
		)

		bucket.grantPut(this.importProductsFileLambda)
		bucket.grantReadWrite(this.importProductsFileLambda)
	}
}
