import { mockClient } from "aws-sdk-client-mock"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { importProductsFileHandler } from "../lambda_func/import_products_file"

const s3Mock = mockClient(S3Client)

jest.mock("@aws-sdk/client-s3")

jest.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: jest.fn(),
}))

describe("importProductsFileHandler", () => {
	beforeEach(() => {
		s3Mock.reset()
		jest.clearAllMocks()
	})

	it("should return signed URL for a valid file name", async () => {
		const mockUrl = "https://mock-signed-url.com"
		;(getSignedUrl as jest.MockedFunction<typeof getSignedUrl>).mockResolvedValue(
			mockUrl
		)

		s3Mock.on(PutObjectCommand).resolves({})

		const event = {
			queryStringParameters: {
				name: "test.csv",
			},
		}

		const result = await importProductsFileHandler(event)

		expect(result.statusCode).toBe(200)
		expect(result.headers["Access-Control-Allow-Origin"]).toBe("*")
		expect(result.body).toBe(JSON.stringify(mockUrl))
	})

	it("should return 400 if file name is missing", async () => {
		const event = {
			queryStringParameters: {},
		}

		const result = await importProductsFileHandler(event)

		expect(result.statusCode).toBe(400)
		expect(result.headers["Access-Control-Allow-Origin"]).toBe("*")
		expect(result.body).toBe(JSON.stringify({ message: "Missing file name" }))
	})

	it("should return 500 on internal server error", async () => {
		s3Mock.on(PutObjectCommand).rejects(new Error("Internal server error"))

		const event = {
			queryStringParameters: {
				name: "test.csv",
			},
		}

		const result = await importProductsFileHandler(event)

		expect(result.statusCode).toBe(500)
		expect(result.headers["Access-Control-Allow-Origin"]).toBe("*")
		expect(result.body).toBe(JSON.stringify({ message: "Internal server error" }))
	})
})
