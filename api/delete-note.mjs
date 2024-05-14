import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

import { getResponseHeaders, getUserId } from "./utils.mjs";

const client = new DynamoDBClient();
/**
 * Route: DELETE /note/t/{timestamp}
 */
export const handler = async (event) => {
	try {
		const userId = getUserId(event.headers);
		const timestamp = parseInt(event.pathParameters.timestamp);

		const input = {
			TableName: process.env.NOTES_TABLE,
			Key: {
				user_id: {
					S: userId
				},
				timestamp: {
					N: `${timestamp}`
				}
			}
		};

		// console.log("input", input);

		const command = new DeleteItemCommand(input);
		const response = await client.send(command);

		// console.log("response", response);

		return {
			statusCode: 200,
			headers: getResponseHeaders(),
			body: JSON.stringify({})
		}
	} catch (err) {
		console.error(err);
		return {
			statusCode: err.statusCode ? err.statusCode : 500,
			headers: getResponseHeaders(),
			body: JSON.stringify({
				error: err.name ? err.name : "Exception",
				message: err.message ? err.message : "Unknown error"
			})
		}
	}
};