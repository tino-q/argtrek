// implement a minimal dynamo db client to get and set string items

import { config } from "dotenv";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";

config({ path: ".env" });

const ddb = new DynamoDBClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"] as string,
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] as string,
  },
});

export const getItem = async (key: string) => {
  const command = new GetItemCommand({
    TableName: "ArgTripCache",
    Key: { key: { S: key } },
  });
  const response = await ddb.send(command);
  return response.Item?.["value"]?.S;
};

export const setItem = async (key: string, value: string, ttlHours = 1) => {
  const ttlTimestamp = Math.floor(Date.now() / 1000) + ttlHours * 3600;
  const command = new PutItemCommand({
    TableName: "ArgTripCache",
    Item: {
      key: { S: key },
      value: { S: value },
      ttl: { N: ttlTimestamp.toString() },
    },
  });
  await ddb.send(command);
};

export const deleteItem = async (key: string) => {
  const command = new DeleteItemCommand({
    TableName: "ArgTripCache",
    Key: { key: { S: key } },
  });
  await ddb.send(command);
};
