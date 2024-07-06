import csvParser from "csv-parser"
import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"
import { Readable } from "stream"
import { BUCKET_NAME } from "./constants"

export const importFileParserHandler = async (event: any) => {
	console.log("Incoming importFileParser request:", event)
	console.log("Object key:", JSON.stringify(event.Records[0]))

	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "*",
		ContentType: "text/csv",
	}

	const record = event.Records[0]
	const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))

	console.log("Bucket:", BUCKET_NAME)
	console.log("Object key:", objectKey)

	if (!objectKey.split("/").at(-1)) {
		return {
			statusCode: 400,
			headers: headers,
			body: JSON.stringify({ message: "Missing file name" }),
		}
	}

	try {
		await importFileParserService(objectKey)
		return {
			statusCode: 200,
			body: "CSV file was parsed successfully!",
			headers: headers,
		}
	} catch (error) {
		console.error(
			`Error retrieving object ${objectKey} from bucket ${BUCKET_NAME}:`,
			error
		)
		return {
			statusCode: 500,
			headers: headers,
			body: JSON.stringify({ message: "Internal server error" }),
		}
	}
}

export const importFileParserService = async (key: string) => {
	const client = new S3Client({})
	const sqsClient = new SQSClient()

	const fileName = key.split("/").at(-1)

	if (!fileName) {
		throw new Error("Missing file name")
	}

	const srcParams = {
		Bucket: BUCKET_NAME,
		Key: key,
		ContentType: "text/csv",
	}

	console.log(`S3 source parameters: ${JSON.stringify(srcParams)}`)

	const destParams = {
		...srcParams,
		Key: `parsed/${fileName}`,
		CopySource: `${BUCKET_NAME}/${key}`,
	}

	console.log(`S3 destination parameters: ${JSON.stringify(destParams)}`)

	const getCommand = new GetObjectCommand(srcParams)

	const { Body: stream } = await client.send(getCommand)

	console.log(`Stream retrieved from S3: ${stream}`)

	if (!stream) {
		throw new Error("Stream error")
	}

	return new Promise<string>((resolve, reject) => {
		;(stream as Readable)
			.pipe(csvParser())
			.on("data", async (chunk: any) => {
				console.log("CSV chunk:", chunk)
				const messageParams = {
					QueueUrl: process.env.SQS_URL,
					MessageBody: JSON.stringify(chunk),
				}
				try {
					console.log("Message params", messageParams)
					await sqsClient.send(new SendMessageCommand(messageParams))
					console.log("Sent message to SQS:", chunk)
				} catch (error) {
					console.error("Error sending message to SQS:", error)
					reject(error)
				}
			})
			.on("end", async () => {
				try {
					const copyCommand = new CopyObjectCommand(destParams)
					const deleteCommand = new DeleteObjectCommand(srcParams)

					await client.send(copyCommand)
					console.log("The file was copied to parsed folder")
					await client.send(deleteCommand)
					console.log("The file was deleted from uploaded folder")

					resolve("CSV file was parsed successfully!")
				} catch (e) {
					console.error("Error parsing", e)
					reject(e)
				}
			})
			.on("error", (err: any) => {
				console.error(err)
				reject(err)
			})
	})
}
