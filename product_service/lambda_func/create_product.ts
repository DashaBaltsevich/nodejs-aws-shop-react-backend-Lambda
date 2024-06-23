import { createProductDB } from "./dynamodbService"

export const createProductHandler = async (event: any) => {
	console.log("Incoming createProduct request:", event)
	const requestBody = JSON.parse(event.body)
	const { title, description, price, count } = requestBody

	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "POST",
		"Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
		"content-type": "application/json",
	}

	try {
		if (
			!title ||
			!description ||
			typeof price !== "number" ||
			price < 0 ||
			typeof count !== "number" ||
			count < 0
		) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ message: "Invalid product data" }),
			}
		}

		const newProduct = await createProductDB(title, description, price, count)

		return {
			statusCode: 200,
			headers: headers,
			body: JSON.stringify(newProduct),
		}
	} catch (error) {
		console.error("Error creating product with stocks:", error)
		return {
			statusCode: 500,
			headers: headers,
			body: JSON.stringify({ message: "Failed to create product" }),
		}
	}
}
