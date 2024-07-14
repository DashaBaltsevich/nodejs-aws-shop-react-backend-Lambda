import {
	APIGatewayAuthorizerResult,
	APIGatewayTokenAuthorizerEvent,
	Callback,
} from "aws-lambda"
import * as dotenv from "dotenv"
dotenv.config()

export const basicAuthorizerHandler = async (
	event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
	console.log("Incoming Auth request:", event)
	if (event.type !== "TOKEN") {
		throw new Error("Unauthorized")
	}

	try {
		const encodedCreds = event.authorizationToken.split(" ")[1]

		const buff = Buffer.from(encodedCreds, "base64")
		const [username, password] = buff.toString("utf-8").split(":")

		console.log(`username ${username}, password: ${password}`)

		const storedUserPassword = process.env[username]

		console.log(username, storedUserPassword, password)

		const effect =
			!storedUserPassword || storedUserPassword !== password ? "Deny" : "Allow"

		const policy = generatePolicy(encodedCreds, effect, event.methodArn)

		console.log(JSON.stringify(policy))

		return policy
	} catch (e: any) {
		console.error(`Unauthorized: ${e.message}`)
		const policy = generatePolicy("Unauthorized", "Deny", event.methodArn)
		return policy
	}
}

const generatePolicy = (
	principalId: string,
	effect: any,
	resource: string
): APIGatewayAuthorizerResult => {
	return {
		principalId: principalId,
		policyDocument: {
			Version: "2012-10-17",
			Statement: [
				{
					Action: "execute-api:Invoke",
					Effect: effect,
					Resource: resource,
				},
			],
		},
	}
}
