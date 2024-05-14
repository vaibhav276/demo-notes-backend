import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getResponseHeaders, getUserId } from "./utils.mjs";
import dayjs from "dayjs";
import _ from "underscore";

const client = new DynamoDBClient();
const tableName = process.env.NOTES_TABLE;

/**
 * Route: PATCH /note
 */
export const handler = async (event) => {
	try {
		const item = JSON.parse(event.body).Item;
		const userId = getUserId(event.headers);
		const newExpires = dayjs().add(90, "day").unix();

		let updateExpression = "SET ";
		let expressionAttributeNames = {};
		let expressionAttributeValues = {};
		let hasUpdates = false;
		if (!_.isEmpty(item.title)) {
			updateExpression += "#title = :title";
			expressionAttributeNames["#title"] = "title";
			expressionAttributeValues[":title"] = { S: item.title };
			hasUpdates = true;
		}
		if(!_.isEmpty(item.content)) {
			if (hasUpdates) updateExpression += ", "
			updateExpression += "#content = :content";
			expressionAttributeNames["#content"] = "content";
			expressionAttributeValues[":content"] = { S: item.content };
			hasUpdates = true;
		}
		if(!_.isEmpty(item.cat)) {
			if (hasUpdates) updateExpression += ", "
			updateExpression += "#cat = :cat";
			expressionAttributeNames["#cat"] = "cat";
			expressionAttributeValues[":cat"] = { S: item.cat };
			hasUpdates = true;
		}
		if (hasUpdates) {
			updateExpression += ", #expires = :expires";
			expressionAttributeNames["#expires"] = "expires";
			expressionAttributeValues[":expires"] = { N: `${newExpires}` };

			let input = {
				TableName: tableName,
				Key: {
					user_id: {
						S: userId
					},
					timestamp: {
						N: `${item.timestamp}`
					}
				},
				UpdateExpression: updateExpression,
				ExpressionAttributeNames: expressionAttributeNames,
				ExpressionAttributeValues: expressionAttributeValues,
			};

			// console.log("input", input);

			const command = new UpdateItemCommand(input);
			const response = await client.send(command);

			// console.log("response", response);

			return {
				statusCode: 200,
				headers: getResponseHeaders(),
				body: JSON.stringify(item)
			}
		} else {
			return {
				statusCode: 400,
				headers: getResponseHeaders(),
				body: JSON.stringify({
					"message": "Must provide one of title, content or cat to modify"
				})
			}
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
