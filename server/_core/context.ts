import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticateJwt(authHeader?: string): Promise<User | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret || "stglobal-development-secret");
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.id);
    if (!Number.isInteger(id)) return null;
    const user = await getUserById(id);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  if (!user) {
    user = await authenticateJwt(opts.// @ts-ignore
    req.headers.authorization);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
