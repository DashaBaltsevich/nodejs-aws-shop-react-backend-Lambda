import { createProductDB } from "./dynamodbService"
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns"

export const catalogBatchProcessHandler = async (event: any) => {
	console.log("Incoming catalog batch process request:", event)
	console.log("products", event.Records)
	const snsClient = new SNSClient({})

	for (const record of event.Records) {
		const product = JSON.parse(record.body)
		const { title, description, price, count } = product

		if (
			!title ||
			!description ||
			typeof parseFloat(price) !== "number" ||
			parseFloat(price) < 0 ||
			typeof parseFloat(price) !== "number" ||
			parseFloat(price) < 0
		) {
			console.error("Invalid product data")
			continue
		}

		try {
			const newProduct = await createProductDB(title, description, price, count)
			console.log(`Successfully created product ${newProduct}`)

			const message = `Product - ${title} created with price: ${price}, description: ${description}, count: ${count}`
			const publishCommand = new PublishCommand({
				TopicArn: process.env.SNS_ARN,
				Message: message,
				MessageAttributes: {
					price: {
						DataType: "Number",
						StringValue: price.toString(),
					},
				},
			})

			await snsClient.send(publishCommand)
			console.log("products are in DB tables")
		} catch (error) {
			console.error(`Failed to create product`, error)
		}
	}
}
