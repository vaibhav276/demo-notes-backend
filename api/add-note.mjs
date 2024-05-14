import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

import { getResponseHeaders, getUserId, getUserName } from "./utils.mjs";

const client = new DynamoDBClient();
const tableName = process.env.NOTES_TABLE;

/**
 * Route: POST /note
 */
export const handler = async (event) => {

	try {
		let item = JSON.parse(event.body).Item;
		item.userId = getUserId(event.headers);
		item.userName = getUserName(event.headers);
		item.timestamp = dayjs().unix()
		item.noteId = item.userId + ":" + uuidv4();
		item.expires = dayjs().add(90, "day").unix();

		const input = {
			TableName: tableName,
			Item: {
				user_id: {
					S: item.userId
				},
				timestamp: {
					N: `${item.timestamp}`
				},
				note_id: {
					S: item.noteId
				},
				user_name: {
					S: item.userName
				},
				expires: {
					N: `${item.expires}`
				},
				title: {
					S: item.title
				},
				content: {
					S: item.content
				},
				cat: {
					S: item.cat
				}
			}
		}

		// console.log("input", input);

		const command = new PutItemCommand(input);
		const response = await client.send(command);

		// console.log("response", response);

		return {
			statusCode: 200,
			headers: getResponseHeaders(),
			body: JSON.stringify(item)
		}
	} catch (err) {
		console.error("err", err);
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
