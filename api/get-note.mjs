import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import _ from "underscore";

import { getResponseHeaders } from "./utils.mjs";

const client = new DynamoDBClient();

/**
 * Route: GET /note/n/{note_id}
 */
export const handler = async (event) => {
	try {
		const tableName = process.env.NOTES_TABLE;

		const noteId = decodeURIComponent(event.pathParameters.note_id);

		const input = {
			TableName: tableName,
			IndexName: "note_id-index",
			KeyConditionExpression: "note_id = :n",
			ExpressionAttributeValues: {
				":n": {
					S: noteId
				}
			},
			Limit: 1
		};

		// console.log("input" , input);

		const command = new QueryCommand(input);
		const response = await client.send(command);

		// console.log("response", response);

		if (!_.isEmpty(response.Items)) {
			const item = response.Items[0];
			return {
				statusCode: 200,
				headers: getResponseHeaders(),
				body: JSON.stringify({
					user_id: item.user_id.S,
					user_name: item.user_name.S,
					note_id: item.note_id.S,
					timestamp: item.timestamp.N,
					expires: item.expires.N,
					title: item.title.S,
					content: item.content.S,
					cat: item.cat.S
				})
			}
		} else {
			return {
				statusCode: 404,
				headers: getResponseHeaders()
			}
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
