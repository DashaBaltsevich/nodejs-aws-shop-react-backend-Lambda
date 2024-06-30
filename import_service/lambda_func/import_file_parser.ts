import * as csvParser from "csv-parser"
import { BUCKET_NAME } from "./constants"
import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { Readable } from "stream"

export const importFileParserHandler = async (event: any) => {
	console.log("Incoming importFileParser request:", event)

	const headers = {
		Accept: "text/csv",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "*",
		"content-type": "text/csv",
	}

	const record = event.Records[0]
	const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))

	if (!objectKey.split("/").at(-1)) {
		return {
			statusCode: 400,
			headers: headers,
			body: JSON.stringify({ message: "Missing file name" }),
		}
	}

	try {
		const message = await importFileParserService(objectKey)
		return { statusCode: 200, body: message, headers: headers }
	} catch (error) {
		console.error("Error reading CSV from S3:", error)
		return {
			statusCode: 500,
			headers: headers,
			body: JSON.stringify({ message: "Internal server error" }),
		}
	}
}

const importFileParserService = async (key: string) => {
	try {
		console.log(key)
		const client = new S3Client({})

		const fileName = key.split("/").at(-1)

		if (!fileName) {
			throw new Error("Missing file name")
		}

		const srcParams = {
			Bucket: BUCKET_NAME,
			Key: key,
			ContentType: "text/csv",
		}

		const destParams = {
			...srcParams,
			Key: `parsed/${fileName}`,
			CopySource: `${BUCKET_NAME}/${key}`,
		}

		const getCommand = new GetObjectCommand(srcParams)
		const copyCommand = new CopyObjectCommand(destParams)
		const deleteCommand = new DeleteObjectCommand(srcParams)

		const { Body: stream } = await client.send(getCommand)

		if (!stream) {
			throw new Error("Stream error")
		}

		return new Promise<string>((resolve, reject) => {
			;(stream as Readable)
				.pipe(csvParser())
				.on("data", (chunk) => {
					console.log("CSV chunk:", chunk)
				})
				.on("end", async () => {
					const message = "CSV file was parsed successfully!"
					console.log(message)

					try {
						await client.send(copyCommand)
						console.log("The file was copied to parsed folder")
						await client.send(deleteCommand)
						console.log("The file was deleted from uploaded folder")

						return resolve(message)
					} catch (e) {
						reject(e)
					}
				})
				.on("error", (err: any) => {
					console.error(err)
					reject(err)
				})
		}).then((msg) => msg)
	} catch (err: any) {
		throw new Error(err)
	}
}
