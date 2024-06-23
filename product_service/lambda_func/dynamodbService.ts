import {
	DynamoDBClient,
	QueryCommand,
	ScanCommand,
	TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb"

const crypto = require("crypto")

interface Product {
	id: string
	title: string
	description: string
	price: number
}

interface Stock {
	product_id: string
	count: number
}

interface ProductWithStocks {
	id: string
	title: string
	description: string
	price: number
	count: number
}

const dynamoDbClient = new DynamoDBClient({ region: "eu-central-1" })
const PRODUCTS_TABLE = "Products"
const STOCKS_TABLE = "Stocks"

async function getProductsListFromDB(): Promise<Product[]> {
	try {
		const getProductsListCommand = new ScanCommand({
			TableName: PRODUCTS_TABLE,
		})

		const productsListResponse = await dynamoDbClient.send(getProductsListCommand)

		if (!productsListResponse.Items) {
			throw new Error("Products list is empty or undefined")
		}

		const products: Product[] = productsListResponse.Items.map((item) => ({
			id: item.id.S || "",
			title: item.title.S || "",
			description: item.description.S || "",
			price: Number(item.price.N) || 0,
		}))

		return products
	} catch (error) {
		console.error("Error fetching products list from DynamoDB:", error)
		throw error
	}
}

async function getProductByIdFromDB(id: string): Promise<Product | undefined> {
	const params = {
		TableName: PRODUCTS_TABLE,
		KeyConditionExpression: "id = :id",
		ExpressionAttributeValues: {
			":id": { S: id },
		},
	}

	try {
		const command = new QueryCommand(params)
		const productResponse = await dynamoDbClient.send(command)

		if (!productResponse.Items || productResponse.Items.length === 0) {
			console.log(`Product with id ${id} not found.`)
			return undefined
		}

		const product: Product = {
			id: productResponse.Items[0].id.S || "",
			title: productResponse.Items[0].title.S || "",
			description: productResponse.Items[0].description.S || "",
			price: Number(productResponse.Items[0].price.N),
		}

		return product
	} catch (error) {
		console.error("Error fetching product from DynamoDB:", error)
		throw error
	}
}

async function getStockByProductIdFromDB(productId: string): Promise<Stock | undefined> {
	const params = {
		TableName: STOCKS_TABLE,
		KeyConditionExpression: "product_id = :pid",
		ExpressionAttributeValues: {
			":pid": { S: productId },
		},
	}

	try {
		const command = new QueryCommand(params)
		const stockResponse = await dynamoDbClient.send(command)

		if (!stockResponse.Items || stockResponse.Items.length === 0) {
			console.log(`Stock for product with id ${productId} not found.`)
			return undefined
		}

		const stockItem: Stock = {
			product_id: stockResponse.Items[0].product_id.S || "",
			count: Number(stockResponse.Items[0].count.N),
		}

		return stockItem
	} catch (error) {
		console.error("Error fetching stock from DynamoDB:", error)
		throw error
	}
}

export async function getProductsListWithStocksFromDB(): Promise<ProductWithStocks[]> {
	try {
		const products = await getProductsListFromDB()

		if (!products) {
			throw new Error("Products list is undefined")
		}

		const productsWithStocks: ProductWithStocks[] = []

		for (const product of products) {
			const stock = await getStockByProductIdFromDB(product.id)

			const productWithStocks: ProductWithStocks = {
				id: product.id,
				title: product.title,
				description: product.description,
				price: Number(product.price),
				count: Number(stock?.count),
			}

			productsWithStocks.push(productWithStocks)
		}

		return productsWithStocks
	} catch (error) {
		console.error("Error fetching products with stocks:", error)
		throw error
	}
}

export async function getProductByIdWithStockFromDB(
	id: string
): Promise<ProductWithStocks | undefined> {
	try {
		const product = await getProductByIdFromDB(id)

		if (!product) {
			console.log("Product by id is undefined")
			return undefined
		}

		const stock = await getStockByProductIdFromDB(product.id)

		if (!stock) {
			console.log("Product's stock by id is undefined")
			return undefined
		}

		const productWithStocks: ProductWithStocks = {
			id: product.id,
			title: product.title,
			description: product.description,
			price: Number(product.price),
			count: Number(stock?.count),
		}

		return productWithStocks
	} catch (error) {
		console.error("Error fetching product by id with stock:", error)
		throw error
	}
}

export async function createProductDB(
	title: string,
	description: string,
	price: number,
	count: number
): Promise<ProductWithStocks> {
	const newId = crypto.randomUUID()
	const productParams = {
		TableName: PRODUCTS_TABLE,
		Item: {
			id: { S: newId },
			title: { S: title },
			description: { S: description },
			price: { N: String(price) },
		},
	}

	const stockParams = {
		TableName: STOCKS_TABLE,
		Item: {
			product_id: { S: newId },
			count: { N: String(count) },
		},
	}

	const transactParams = {
		TransactItems: [
			{
				Put: {
					TableName: PRODUCTS_TABLE,
					Item: productParams.Item,
				},
			},
			{
				Put: {
					TableName: STOCKS_TABLE,
					Item: stockParams.Item,
				},
			},
		],
	}

	try {
		const command = new TransactWriteItemsCommand(transactParams)
		await dynamoDbClient.send(command)
		const response: ProductWithStocks = {
			id: newId,
			title,
			description,
			price,
			count,
		}
		return response
	} catch (error) {
		console.error("Error creating product:", error)
		throw error
	}
}
