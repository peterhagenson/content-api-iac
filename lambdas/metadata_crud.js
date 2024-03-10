import {DynamoDBClient} from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";


const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = 'audio_data';

export const handler = async (event, context ) => {
let body;
let statusCode = 200;
const headers = {
  "Content-Type": "application/json",
};

console.log("event", event)
console.log(event.routeKey)
console.log(event.pathParameters)
try {
  switch (event.routeKey) {
    case "PUT /audio_data":
      const eventBody = JSON.parse(event.body)
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        UserId: eventBody.UserId,
        FileId: eventBody.FileId,
        Tags: eventBody.Tags,
        Description: eventBody.Description,
      }
    })
    )
    case "GET /audio_data":
      body = await dynamo.send(
        new ScanCommand({TableName: tableName}))
        break;
    case "DELETE /audio_data/{uid}/{fid}":
      await dynamo.send(
        new DeleteCommand({
          TableName: tableName,
            Key: {
              UserId: event.pathParameters.uid,
              FileId: event.pathParameters.fid,
            }
        })
        )
        body = `Deleted item ${event.pathParameters.uid}`
        break;
    case "GET /audio_data/{uid}/{fid}":
      body = await dynamo.send(
        new GetCommand({
          TableName: tableName,
            Key: {
              UserId: event.pathParameters.uid,
              FileId: event.pathParameters.fid
            }
        })
        )
    break;
    case "GET /audio_data/desc/{desc}":
      console.log("description", `${event.pathParameters.desc}`)
      body = await dynamo.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "Description-index",
          KeyConditionExpression: 'Description = :Description',
          ExpressionAttributeValues: {
            ':Description': event.pathParameters.desc
          }
        })
        )
        break;
  }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body)
  }
  
  return {
    statusCode,
    body,
    headers,
  }
};
