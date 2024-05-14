import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { getResponseHeaders, getUserId } from "./utils.mjs";
import _ from "underscore";

const client = new DynamoDBClient();
const tableName = process.env.NOTES_TABLE;

/**
 * Route: GET /notes
 */
export const handler = async (event) => {
	try {
		const userId = getUserId(event.headers);
		const query = event.queryStringParameters;
		const limit = query && query.limit ? parseInt(query.limit) : 5;
		const startTimestamp = query && query.start ? parseInt(query.start) : 0;

		let input = {
			TableName: tableName,
			KeyConditionExpression: "user_id = :u",
			ExpressionAttributeValues: {
				":u": {
					S: userId
				}
			},
			Limit: limit,
			ScanIndexForward: false
		};

		if (startTimestamp > 0) {
			input.ExclusiveStartKey = {
				user_id: {
					S: userId
				},
				timestamp: {
					N: `${startTimestamp}`
				}
			}
		}

		// console.log("input", input);

		const command = new QueryCommand(input);
		const response = await client.send(command);

		console.log("response", response);

		let items = _.map(response.Items, (item) => {
			return {
				user_id: item.user_id.S,
				user_name: item.user_name.S,
				note_id: item.note_id.S,
				timestamp: item.timestamp.N,
				expires: item.expires.N,
				title: item.title.S,
				content: item.content.S,
				cat: item.cat.S
			}
		});

		let ret = {
			Items: items,
			Count: response.Count,
			ScannedCount: response.ScannedCount
		}

		if (!_.isEmpty(response.LastEvaluatedKey)) {
			ret.LastEvaluatedKey = {
				user_id: response.LastEvaluatedKey.user_id.S,
				timestamp: response.LastEvaluatedKey.timestamp.N
			}
		}
		return {
			statusCode: 200,
			headers: getResponseHeaders(),
			body: JSON.stringify(ret)
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
