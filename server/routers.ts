import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./db";
import { users, trades, wallets } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

const JWT_SECRET = process.env.JWT_SECRET || "STGlobalSecret2024#SuperSecure";

export const appRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2)
    }))
    .mutation(async ({ input }) => {
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      await db.insert(users).values({
        email: input.email,
        passwordHash: hashedPassword,
        name: input.name,
        role: "user"
      });

      const [newUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (newUser) {
        await db.insert(wallets).values({
          userId: newUser.id,
          currency: "USDT",
          balance: "10000.00"
        });
      }
      return { success: true };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      if (ctx.res) {
        (ctx.res as any).cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        } );
      }
      return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
    return user;
  }),

  getWallets: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(wallets).where(eq(wallets.userId, ctx.user.userId));
  }),

  getMarketData: publicProcedure.query(async () => {
    // marketData table မရှိသေးတဲ့အတွက် trades ထဲက နောက်ဆုံး data တွေကို ပြပါမယ်
    return await db.select().from(trades).orderBy(desc(trades.createdAt)).limit(20);
  }),

  getSettings: publicProcedure.query(async () => {
    return { siteName: "STGlobal", contractsEnabled: true };
  }),
});

export type AppRouter = typeof appRouter;
