import { products } from "./mocks"

export const getProductByIdHandler = async (event: any) => {
	const productId = event.pathParameters.productId
	const product = products.filter((p) => p.id === productId.toString())
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "GET",
		"content-type": "application/json",
	}

	if (!product.length) {
		return {
			statusCode: 404,
			headers: headers,
			body: JSON.stringify({ message: "Product not found" }),
		}
	}

	return {
		statusCode: 200,
		headers: headers,
		body: JSON.stringify(product[0]),
	}
}
