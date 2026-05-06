import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const poolConnection = mysql.createPool(connectionString);
export const db = drizzle(poolConnection, { schema, mode: "default" }) as any;

export const getUserById = async (id: number) => {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
};

export const getUserByOpenId = async (openId: string) => {
  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return user;
};

export const upsertUser = async (userData: any) => {
  const existing = await getUserByOpenId(userData.openId);
  if (existing) {
    await db.update(users).set(userData).where(eq(users.openId, userData.openId));
  } else {
    await db.insert(users).values(userData);
  }
  return await getUserByOpenId(userData.openId);
};
