import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import { aws_apigateway as apigateway } from "aws-cdk-lib"
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

		const api = new apigateway.RestApi(this, "ImportServiceApi", {
			restApiName: "Import Service",
			description: "API for importing products file",
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
		})

		const importEndpoint = api.root.addResource("import")

		const integration = new apigateway.LambdaIntegration(importProductsFileHandler)
		importEndpoint.addMethod("GET", integration)
	}
}
