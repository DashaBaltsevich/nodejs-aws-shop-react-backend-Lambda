import { getProductByIdHandler } from "../lambda_func/product_by_id"

describe("getProductById", () => {
	it("should return the product with the given ID", async () => {
		const event = {
			pathParameters: { productId: "65be22c6-9bea-40cf-843e-061f4ac393f5" },
		}
		const response = await getProductByIdHandler(event)
		expect(response.statusCode).toBe(200)
		const responseProduct = JSON.parse(response.body)
		// expect(responseProduct).toEqual({ ...products[0], count: 3 })
		// expect(responseProduct.title).toBe("ProductOne")
	})

	it("should return 404 if the product is not found", async () => {
		const event = { pathParameters: { productId: "111" } }
		const response = await getProductByIdHandler(event)
		expect(response.statusCode).toBe(404)
		expect(JSON.parse(response.body)).toEqual({ message: "Product not found" })
	})
})
