import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { BUCKET_NAME, PREFIX } from "./constants"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

export const importProductsFileHandler = async (event: any) => {
	console.log("Incoming importProducts request:", event)

	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "*",
		"content-type": "text/csv",
	}

	const fileName = event.queryStringParameters?.name

	if (!fileName) {
		return {
			statusCode: 400,
			headers: headers,
			body: JSON.stringify({ message: "Missing file name" }),
		}
	}

	try {
		const signedUrl = await importProductsFileService(fileName)
		console.log("signedUrl", signedUrl)

		return {
			statusCode: 200,
			headers: headers,
			body: JSON.stringify({ signedUrl }),
		}
	} catch (error) {
		console.error("Error generating Signed URL:", error)
		return {
			statusCode: 500,
			headers: headers,
			body: JSON.stringify({ message: "Internal server error" }),
		}
	}
}

const importProductsFileService = async (fileName: string) => {
	const key = `${PREFIX}${fileName}`

	const params = {
		Bucket: BUCKET_NAME,
		Key: key,
		ContentType: "text/csv",
	}

	const client = new S3Client({})

	const command = new PutObjectCommand(params)

	return client
		.send(command)
		.then((_output) => {
			return getSignedUrl(client, command)
				.then((url) => url)
				.catch((err) => {
					throw new Error(err)
				})
		})
		.catch((err) => {
			throw new Error(err)
		})
}
