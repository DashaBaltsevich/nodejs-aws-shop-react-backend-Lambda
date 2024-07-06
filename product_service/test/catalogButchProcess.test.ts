import { PublishCommand, SNSClient } from "@aws-sdk/client-sns"
import { createProductDB } from "../lambda_func/dynamodbService"
import { catalogBatchProcessHandler } from "../lambda_func/catalog_batch_process"

jest.mock("../lambda_func/dynamodbService")
jest.mock("@aws-sdk/client-sns")

const mockedCreateProductDB = createProductDB as jest.Mock
const mockedSNSClientSend = jest.fn()
SNSClient.prototype.send = mockedSNSClientSend

describe("catalogBatchProcessHandler", () => {
	const snsArn = "arn:aws:sns:us-east-1:123456789012:MyTopic"
	process.env.SNS_ARN = snsArn

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it("should create products and send SNS messages", async () => {
		const event = {
			Records: [
				{
					body: JSON.stringify({
						title: "Product A",
						description: "Desc A",
						price: "24",
						count: "2",
					}),
				},
			],
		}

		const newProduct = {
			id: "1",
			title: "Product A",
			description: "Desc A",
			price: 24,
			count: 2,
		}
		mockedCreateProductDB.mockResolvedValue(newProduct)

		await catalogBatchProcessHandler(event)

		expect(mockedCreateProductDB).toHaveBeenCalledWith(
			"Product A",
			"Desc A",
			"24",
			"2"
		)
		expect(mockedSNSClientSend).toHaveBeenCalledWith(expect.any(PublishCommand))
		expect(mockedSNSClientSend).toHaveBeenCalledTimes(1)
	})

	it("should log error for invalid product data", async () => {
		const event = {
			Records: [
				{
					body: JSON.stringify({
						title: "",
						description: "Desc A",
						price: "24",
						count: "2",
					}),
				},
			],
		}

		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

		await catalogBatchProcessHandler(event)

		expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid product data")
		expect(mockedCreateProductDB).not.toHaveBeenCalled()
		expect(mockedSNSClientSend).not.toHaveBeenCalled()

		consoleErrorSpy.mockRestore()
	})

	it("should log error when createProductDB throws an error", async () => {
		const event = {
			Records: [
				{
					body: JSON.stringify({
						title: "Product A",
						description: "Desc A",
						price: "24",
						count: "2",
					}),
				},
			],
		}

		const errorMessage = "DB error"
		mockedCreateProductDB.mockRejectedValue(new Error(errorMessage))
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

		await catalogBatchProcessHandler(event)

		expect(mockedCreateProductDB).toHaveBeenCalledWith(
			"Product A",
			"Desc A",
			"24",
			"2"
		)
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to create product",
			expect.any(Error)
		)
		expect(mockedSNSClientSend).not.toHaveBeenCalled()

		consoleErrorSpy.mockRestore()
	})
})
