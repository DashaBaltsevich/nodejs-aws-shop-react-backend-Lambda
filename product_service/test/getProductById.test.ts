import { getProductByIdHandler } from "../product_service/lambda_func/product_by_id"
import { products } from "../product_service/mocks"

describe("getProductById", () => {
	it("should return the product with the given ID", async () => {
		const event = {
			pathParameters: { productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa" },
		}
		const response = await getProductByIdHandler(event)
		expect(response.statusCode).toBe(200)
		const responseProduct = JSON.parse(response.body)
		expect(responseProduct).toEqual({ ...products[0], count: 3 })
		expect(responseProduct.title).toBe("ProductOne")
	})

	it("should return 404 if the product is not found", async () => {
		const event = { pathParameters: { productId: "111" } }
		const response = await getProductByIdHandler(event)
		expect(response.statusCode).toBe(404)
		expect(JSON.parse(response.body)).toEqual({ message: "Product not found" })
	})
})
