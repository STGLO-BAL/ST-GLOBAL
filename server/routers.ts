import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./db";
import { users, trades, orders, wallets, marketData, notifications, settings } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

const JWT_SECRET = process.env.JWT_SECRET || "STGlobalSecret2024#SuperSecure";

export const appRouter = router({
  // Auth Routes
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
         const [result] = await db.insert(users).values({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: "user"
      }).returning();

      // Create initial wallet
      await db.insert(wallets).values({
        userId: newUser.id,
        currency: "USDT",
        balance: "10000.00"
      });

      return { success: true };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user || !(await bcrypt.compare(input.password, user.password))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      
      // Fix: Use (ctx.res as any) to bypass clearCookie error
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

  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Fix: Use (ctx.res as any) to bypass clearCookie error
    if (ctx.res) {
      (ctx.res as any).clearCookie("token");
    }
    return { success: true };
  }),

  // Market Routes
  getMarketData: publicProcedure.query(async () => {
    return await db.select().from(marketData).orderBy(desc(marketData.updatedAt));
  }),

  // User Routes (Protected)
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
    return user;
  }),

  getWallets: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(wallets).where(eq(wallets.userId, ctx.user.userId));
  }),

  // Settings Route
  getSettings: publicProcedure.query(async () => {
    const [siteSettings] = await db.select().from(settings).limit(1);
    // Fix: Use (siteSettings as any) to bypass contractsEnabled error
    return siteSettings || { siteName: "STGlobal", contractsEnabled: true };
  }),
});

export type AppRouter = typeof appRouter;
