import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import { aws_apigateway as apigateway } from "aws-cdk-lib"
import { GetProducts } from "../product_service/get_products"
import { GetProductById } from "../product_service/get_product_by_id"
import { PostProduct } from "../product_service/post_product"

export class ProductServiceStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		// Instantiate the GetProducts stack
		const getProductsStack = new GetProducts(this, "GetProductsStack")

		// Instantiate the GetProductById stack
		const getProductByIdStack = new GetProductById(this, "GetProductByIdStack")

		const postProductStack = new PostProduct(this, "PostProductStack")

		// Access the exported Lambda functions
		const getProductsListHandler = getProductsStack.getProductsListHandler
		const getProductByIdHandler = getProductByIdStack.getProductByIdHandler
		const postProductHandler = postProductStack.postProductHandler

		// Define the API Gateway resource
		const api = new apigateway.RestApi(this, "ProductServiceApi", {
			restApiName: "Product Service",
			description: "This service serves product data.",
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
		})

		// Define the /products resource and method
		const productsResource = api.root.addResource("products")
		productsResource.addMethod(
			"GET",
			new apigateway.LambdaIntegration(getProductsListHandler)
		)

		// Define the /{productId} resource and method
		const productByIdResource = productsResource.addResource("{productId}")
		productByIdResource.addMethod(
			"GET",
			new apigateway.LambdaIntegration(getProductByIdHandler)
		)

		productsResource.addMethod(
			"POST",
			new apigateway.LambdaIntegration(postProductHandler)
		)
	}
}
