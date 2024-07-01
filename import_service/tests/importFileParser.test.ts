import { mockClient } from "aws-sdk-client-mock"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { importFileParserHandler } from "../lambda_func/import_file_parser"
import { Readable } from "stream"

jest.mock("@aws-sdk/client-s3")

describe("importFileParserHandler", () => {
	let consoleErrorSpy: jest.SpyInstance
	beforeEach(() => {
		jest.clearAllMocks()
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
	})

	const data = "id;name;price\n1;Product A;10\n2;Product B;5\n"

	it("should handle a valid S3 event", async () => {
		const mockEvent = {
			Records: [
				{
					s3: {
						object: {
							key: "uploaded/test.csv",
						},
					},
				},
			],
		}
		const mockStream = new Readable()
		mockStream._read = () => {}
		mockStream.push(data)
		mockStream.push(null)

		const s3Mock = mockClient(S3Client)
		s3Mock.on(GetObjectCommand).resolves({
			Body: mockStream as any,
		})

		const result = await importFileParserHandler(mockEvent)

		expect(result.statusCode).toBe(200)
		expect(result.headers["Access-Control-Allow-Origin"]).toBe("*")
		expect(result.body).toBe("CSV file was parsed successfully!")
		expect(consoleErrorSpy).not.toHaveBeenCalled()
	})

	it("should handle missing file name in event", async () => {
		const mockEvent = {
			Records: [
				{
					s3: {
						object: {
							key: "",
						},
					},
				},
			],
		}

		const result = await importFileParserHandler(mockEvent)

		expect(result.statusCode).toBe(400)
		expect(result.headers["Access-Control-Allow-Origin"]).toBe("*")
		expect(result.body).toBe(JSON.stringify({ message: "Missing file name" }))
	})

	it("should handle internal server error", async () => {
		const mockEvent = {
			Records: [
				{
					s3: {
						object: {
							key: "uploaded/test.csv",
						},
					},
				},
			],
		}

		const s3Mock = mockClient(S3Client)
		s3Mock.on(GetObjectCommand).rejects(new Error("Internal server error"))

		const result = await importFileParserHandler(mockEvent)

		expect(result.statusCode).toBe(500)
		expect(result.headers["Access-Control-Allow-Origin"]).toBe("*")
		expect(result.body).toBe(JSON.stringify({ message: "Internal server error" }))
	})
})
