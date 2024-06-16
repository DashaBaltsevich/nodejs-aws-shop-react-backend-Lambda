import { products } from "./mocks"

export const getProductsListHandler = async (event: any) => {
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "GET",
		"content-type": "application/json",
	}

	if (!products.length) {
		return {
			statusCode: 404,
			headers: headers,
			body: JSON.stringify({ message: "Products not found" }),
		}
	}

	return {
		statusCode: 200,
		headers: headers,
		body: JSON.stringify(products),
	}
}
