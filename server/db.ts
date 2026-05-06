import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Create the connection
const connection = await mysql.createConnection(connectionString);

// Fix: Use (connection as any) and cast the whole db object to any
// This bypasses the type mismatch between Connection and Pool
export const db = drizzle(connection as any, { schema, mode: "default" }) as any;
