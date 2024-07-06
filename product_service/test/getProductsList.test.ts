import { getProductsListHandler } from "../lambda_func/products_list"

describe("getProductsList ", () => {
	it("should return all products", async () => {
		const event = {}
		const response = await getProductsListHandler(event)
		expect(response.statusCode).toBe(200)
		// const responseProducts = JSON.parse(response.body)
		// expect(responseProducts[0]).toEqual({ ...products[0], count: 3 })
		// expect(responseProducts[0].title).toBe("ProductOne")
		// expect(responseProducts[1].title).toBe("Product000")
	})
})
