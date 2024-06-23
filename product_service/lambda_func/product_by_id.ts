import { getProductByIdWithStockFromDB } from "./dynamodbService"

export const getProductByIdHandler = async (event: any) => {
	console.log("Incoming getProductById request:", event)
	const productId = event.pathParameters.productId
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "GET",
		"content-type": "application/json",
	}

	try {
		const product = await getProductByIdWithStockFromDB(productId)
		if (!product) {
			return {
				statusCode: 404,
				headers,
				body: JSON.stringify({ message: "Product not found" }),
			}
		}

		return {
			statusCode: 200,
			headers: headers,
			body: JSON.stringify(product),
		}
	} catch (error) {
		console.error("Error fetching product by id with stocks:", error)
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ message: `Internal Server Error ${error}` }),
		}
	}
}
