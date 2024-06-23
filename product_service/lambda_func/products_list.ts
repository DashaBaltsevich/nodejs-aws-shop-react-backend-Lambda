import { getProductsListWithStocksFromDB } from "./dynamodbService"

export const getProductsListHandler = async (event: any) => {
	console.log("Incoming getProductsList request:", event)
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "GET",
		"content-type": "application/json",
	}

	try {
		const products = await getProductsListWithStocksFromDB()

		if (!products?.length) {
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
	} catch (error) {
		console.error("Error fetching products with stocks:", error)
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ message: "Internal Server Error" }),
		}
	}
}
