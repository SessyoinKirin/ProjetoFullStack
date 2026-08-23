/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-18 21:51:43
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-19 22:05:29
 * @FilePath: \my-app\lib\mongodb.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { MongoClient } from "mongodb";
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
const uri = process.env.MONGODB_URI;
const options = {};
let client: MongoClient;
let clientPromise: Promise<MongoClient>;
if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}
client = new MongoClient(uri, options);
clientPromise = client.connect();
// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;