import { COOKIE_NAME } from "../shared/const";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import crypto from "node:crypto";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const assets = z.enum(["USDT", "BTC", "ETH"]);

// Multi-asset symbol support: Crypto, Stocks, Futures, Indices
const tradeSymbols = z.enum([
  // Crypto
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT", "LTCUSDT", "BCHUSDT", "TRXUSDT", "AVAXUSDT",
  // Metals
  "XAUUSD", "XAGUSD",
  // Forex
  "EURUSD", "GBPUSD"
]);
// Expanded durations: 30s, 60s, 90s
const durations = z.union([
  z.literal(30), z.literal(60), z.literal(90), z.literal(120), z.literal(180),
  z.literal(240), z.literal(300), z.literal(360), z.literal(420), z.literal(480),
  z.literal(540), z.literal(600)
]);

function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored?: string | null) {
  if (!stored) return false;
  const [salt, original] = stored.split(":");
  if (!salt || !original) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(original));
}

async function issueJwt(payload: { id: number; email?: string | null; role: string }) {
  const secret = new TextEncoder().encode(ENV.cookieSecret || "stglobal-development-secret");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function getBinancePrice(symbol = "BTCUSDT") {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  if (!response.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: "Unable to fetch live price" });
  const payload = (await response.json()) as { symbol: string; price: string };
  return payload;
}

async function getStooqQuote(symbol: string, displaySymbol: string) {
  const response = await fetch(`https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`, { headers: { "User-Agent": "STGLOBAL/1.0" } });
  if (!response.ok) throw new Error("Quote service unavailable");
  const csv = await response.text();
  const line = csv.trim().split("\n")[1];
  const parts = line?.split(",") ?? [];
  const close = parts[6] && parts[6] !== "N/D" ? parts[6] : parts[3];
  if (!close || close === "N/D") throw new Error(`No quote for ${displaySymbol}`);
  const open = Number(parts[3] ?? close);
  const last = Number(close);
  const change = Number.isFinite(open) && open > 0 ? `${(((last - open) / open) * 100).toFixed(2)}%` : "Live";
  return { symbol: displaySymbol, price: close, change };
}

async function getMarketSnapshot() {
  const cryptoSymbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT", "LTCUSDT", "BCHUSDT", "TRXUSDT", "AVAXUSDT"];
  const metalsSymbols = [
    { symbol: "xauusd", display: "XAUUSD" },
    { symbol: "xagusd", display: "XAGUSD" },
  ];
  const forexSymbols = [
    { symbol: "eurusd", display: "EURUSD" },
    { symbol: "gbpusd", display: "GBPUSD" },
  ];

  const [cryptoResult, metalsResult, forexResult] = await Promise.allSettled([
    Promise.allSettled(cryptoSymbols.map((symbol) => getBinancePrice(symbol))),
    Promise.allSettled(metalsSymbols.map((s) => getStooqQuote(s.symbol, s.display))),
    Promise.allSettled(forexSymbols.map((s) => getStooqQuote(s.symbol, s.display))),
  ]);

  const cryptoRows = cryptoResult.status === "fulfilled" ? cryptoResult.value.flatMap((item) => (item.status === "fulfilled" ? [item.value] : [])) : [];
  const metalsRows = metalsResult.status === "fulfilled" ? metalsResult.value.flatMap((item) => (item.status === "fulfilled" ? [item.value] : [])) : [];
  const forexRows = forexResult.status === "fulfilled" ? forexResult.value.flatMap((item) => (item.status === "fulfilled" ? [item.value] : [])) : [];

  return {
    hot: cryptoRows.slice(0, 5),
    crypto: cryptoRows,
    metals: metalsRows,
    forex: forexRows,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email.toLowerCase());
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email is already registered" });
        const user = await db.createEmailUser(input.email.toLowerCase(), hashPassword(input.password));
        const token = await issueJwt({ id: user.id, email: user.email, role: user.role });
        return { token, user: { id: user.id, email: user.email, role: user.role, vipLevel: user.vipLevel } };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email.toLowerCase());
        if (!user || !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        if (user.isFrozen) throw new TRPCError({ code: "FORBIDDEN", message: "This account is frozen" });
        const token = await issueJwt({ id: user.id, email: user.email, role: user.role });
        return { token, user: { id: user.id, email: user.email, role: user.role, vipLevel: user.vipLevel } };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      if (ctx.res) {
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      }
      return { success: true } as const;
    }),
  }),
  market: router({
    snapshot: publicProcedure.query(getMarketSnapshot),
    price: publicProcedure.input(z.object({ symbol: tradeSymbols.default("BTCUSDT") })).query(({ input }) => getBinancePrice(input.symbol)),
    klines: publicProcedure
      .input(z.object({ symbol: tradeSymbols.default("BTCUSDT"), interval: z.string().default("1m"), limit: z.number().int().min(10).max(500).default(60) }))
      .query(async ({ input }) => {
        const url = `https://api.binance.com/api/v3/klines?symbol=${input.symbol}&interval=${input.interval}&limit=${input.limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: "Unable to fetch kline data" });
        const data = (await response.json()) as Array<[number, string, string, string, string, string, number, string, number, string, string, string]>;
        return data.map((k) => ({
          time: k[0],
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close: Number(k[4]),
          volume: Number(k[5]),
        }));
      }),
  }),
  wallet: router({
    balances: protectedProcedure.query(({ ctx }) => db.listWallets(ctx.user.id)),
    transactions: protectedProcedure.query(({ ctx }) => db.listTransactions(ctx.user.id)),
    createDeposit: protectedProcedure.input(z.object({ asset: assets, amount: z.string().regex(/^\d+(\.\d{1,8})?$/) })).mutation(({ ctx, input }) => db.createTransaction({ userId: ctx.user.id, asset: input.asset, amount: input.amount, type: "deposit", status: "pending", note: "Customer deposit request" })),
    createWithdraw: protectedProcedure.input(z.object({ asset: assets, amount: z.string().regex(/^\d+(\.\d{1,8})?$/) })).mutation(({ ctx, input }) => db.createTransaction({ userId: ctx.user.id, asset: input.asset, amount: input.amount, type: "withdraw", status: "pending", note: "Customer withdraw request" })),
    transfer: protectedProcedure.input(z.object({ targetUserId: z.number().int().positive(), asset: assets, amount: z.string().regex(/^\d+(\.\d{1,8})?$/) })).mutation(({ ctx, input }) => db.transferToUser({ userId: ctx.user.id, ...input })),
  }),
  spot: router({
    execute: protectedProcedure
      .input(z.object({ baseAsset: z.enum(["BTC", "ETH"]), side: z.enum(["buy", "sell"]), amount: z.string().regex(/^\d+(\.\d{1,8})?$/), price: z.string().regex(/^\d+(\.\d{1,8})?$/) }))
      .mutation(({ ctx, input }) => db.executeSpotOrder({ userId: ctx.user.id, ...input })),
  }),
  trading: router({
    settings: publicProcedure.query(db.getSettings),
    rules: publicProcedure.query(db.listTradeRules),
    history: protectedProcedure.query(({ ctx }) => db.listTrades(ctx.user.id)),
    placeContract: protectedProcedure
      .input(z.object({ symbol: tradeSymbols.default("BTCUSDT"), direction: z.enum(["UP", "FALL"]), durationSeconds: durations, amount: z.string().regex(/^\d+(\.\d{1,8})?$/) }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.isFrozen) throw new TRPCError({ code: "FORBIDDEN", message: "This account is frozen" });
        const settings = await db.getSettings();
        if (!settings.contractsEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Contracts are currently disabled" });
        const price = await getBinancePrice(input.symbol);
        return db.placeTrade({ ...input, userId: ctx.user.id, entryPrice: price.price });
      }),
    settleContract: protectedProcedure.input(z.object({ tradeId: z.number().int().positive(), symbol: tradeSymbols.default("BTCUSDT") })).mutation(async ({ ctx, input }) => {
      const price = await getBinancePrice(input.symbol);
      return db.settleTrade({ tradeId: input.tradeId, closingPrice: price.price, userId: ctx.user.id });
    }),
  }),
  admin: router({
    dashboard: adminProcedure.query(db.adminDashboard),
    users: adminProcedure.query(db.listUsers),
    transactions: adminProcedure.query(db.listAllTransactions),
    trades: adminProcedure.query(db.listAllTrades),
    settings: adminProcedure.query(db.getSettings),
    updateSettings: adminProcedure
      .input(z.object({ profitRate: z.string().regex(/^0\.\d{1,4}|1\.0000$/), contractsEnabled: z.boolean(), depositsEnabled: z.boolean(), withdrawalsEnabled: z.boolean(), simulationModeEnabled: z.boolean() }))
      .mutation(({ input }) => db.updateSettings(input)),
    tradeRules: adminProcedure.query(db.listTradeRules),
    upsertTradeRule: adminProcedure
      .input(z.object({
        durationSeconds: z.number().int().positive(),
        minAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        profitRate: z.string().regex(/^0\.\d{1,4}$/),
        label: z.string().min(1).max(64),
      }))
      .mutation(({ input }) => db.upsertTradeRule(input)),
    freezeUser: adminProcedure.input(z.object({ userId: z.number().int().positive(), frozen: z.boolean() })).mutation(async ({ ctx, input }) => {
      const res = await db.setUserFrozen(input.userId, input.frozen, ctx.user.id);
      await db.createAdminAuditLog(ctx.user.id, input.userId, "freeze_user", { frozen: input.frozen });
      return res;
    }),
    resetPassword: adminProcedure.input(z.object({ userId: z.number().int().positive(), newPassword: z.string().min(8) })).mutation(async ({ ctx, input }) => {
      const res = await db.resetUserPassword(input.userId, hashPassword(input.newPassword), ctx.user.id);
      await db.createAdminAuditLog(ctx.user.id, input.userId, "reset_password", {});
      return res;
    }),
    adjustWallet: adminProcedure.input(z.object({ userId: z.number().int().positive(), asset: assets, amount: z.string().regex(/^-?\d+(\.\d{1,8})?$/), note: z.string().min(3) })).mutation(async ({ ctx, input }) => {
      const res = await db.adjustWallet(input.userId, input.asset, input.amount, input.note, ctx.user.id);
      await db.createAdminAuditLog(ctx.user.id, input.userId, "adjust_wallet", { asset: input.asset, amount: input.amount, note: input.note });
      return res;
    }),
    reviewTransaction: adminProcedure.input(z.object({ transactionId: z.number().int().positive(), status: z.enum(["approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      const res = await db.approveTransaction(input.transactionId, input.status, ctx.user.id);
      await db.createAdminAuditLog(ctx.user.id, null, "review_transaction", { transactionId: input.transactionId, status: input.status });
      return res;
    }),
    demoTradeOutcome: adminProcedure.input(z.object({ tradeId: z.number().int().positive(), closingPrice: z.string(), outcome: z.enum(["won", "lost", "draw"]) })).mutation(async ({ ctx, input }) => {
      const res = await db.settleTrade({ tradeId: input.tradeId, closingPrice: input.closingPrice, forcedStatus: input.outcome, source: "demo_override", adminId: ctx.user.id });
      await db.createAdminAuditLog(ctx.user.id, null, "demo_trade_outcome", { tradeId: input.tradeId, outcome: input.outcome });
      return res;
    }),
  }),
});

export type AppRouter = typeof appRouter;
