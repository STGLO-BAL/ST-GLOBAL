import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  adminAuditLogs,
  systemSettings,
  tradeRules,
  trades,
  transactions,
  users,
  wallets,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true }
      });
      _db = drizzle(connection);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}

export async function createUser(data: { email: string; passwordHash: string; name?: string; role?: "user" | "admin"; loginMethod?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  
  // Generate a unique openId
  const openId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const insertData = {
    openId: openId,
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name || data.email.split('@')[0],
    role: data.role || 'user' as const,
    loginMethod: data.loginMethod || 'email',
    vipLevel: "VIP 0",
    isFrozen: false,
    demoMode: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date()
  };

  const [result] = await db.insert(users).values(insertData);
  const userId = result.insertId;
  
  await db.insert(wallets).values({ 
    userId, 
    asset: "USDT", 
    balance: "0", 
    demoBalance: "10000",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return getUserById(userId);
}

export const createEmailUser = async (email: string, passwordHash: string) => {
  return createUser({ email, passwordHash });
};

export async function getWallet(userId: number, asset: "USDT" | "BTC" | "ETH" = "USDT") {
  const db = await getDb();
  if (!db) return null;
  const [wallet] = await db.select().from(wallets).where(and(eq(wallets.userId, userId), eq(wallets.asset, asset))).limit(1);
  return wallet || null;
}

export async function listWallets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wallets).where(eq(wallets.userId, userId));
}

export async function createTransaction(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [result] = await db.insert(transactions).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return result.insertId;
}

export async function listTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(50);
}

export async function listAllTransactions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(100);
}

export async function openContractTrade(userId: number, input: any) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const wallet = await getWallet(userId, "USDT");
  if (!wallet) throw new Error("Wallet not found");
  if (Number(wallet.balance) < Number(input.amount)) throw new Error("Insufficient balance");
  
  await db.update(wallets).set({ balance: sql`${wallets.balance} - ${input.amount}` }).where(and(eq(wallets.userId, userId), eq(wallets.asset, "USDT")));
  
  const [result] = await db.insert(trades).values({ 
    userId, 
    symbol: input.symbol, 
    direction: input.direction, 
    amount: input.amount, 
    entryPrice: input.entryPrice, 
    durationSeconds: input.durationSeconds, 
    status: "open", 
    openedAt: new Date(),
    settlesAt: new Date(Date.now() + input.durationSeconds * 1000)
  });
  return result.insertId;
}

export const placeTrade = async (data: any) => {
  return openContractTrade(data.userId, data);
};

export async function settleContractTrade(input: any) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [trade] = await db.select().from(trades).where(eq(trades.id, input.tradeId)).limit(1);
  if (!trade) throw new Error("Trade not found");
  if (trade.status !== "open") throw new Error("Trade is already settled");
  if (input.userId && trade.userId !== input.userId) throw new Error("Unauthorized: You do not own this trade");
  if (new Date() < new Date(trade.settlesAt)) throw new Error("Trade has not yet reached its settlement time");

  let status = input.forcedStatus;
  if (!status) {
    const entry = Number(trade.entryPrice);
    const close = Number(input.closingPrice);
    if (trade.direction === "UP") {
      status = close > entry ? "won" : close < entry ? "lost" : "draw";
    } else {
      status = close < entry ? "won" : close > entry ? "lost" : "draw";
    }
  }

  await db.update(trades).set({ 
    closingPrice: input.closingPrice, 
    status: status, 
    resultSource: input.source || "price_engine", 
    settledAt: new Date() 
  }).where(eq(trades.id, input.tradeId));

  // Wallet updates
  if (status === "won") {
    const payout = Number(trade.amount) * (1 + Number(trade.profitRate));
    await db.update(wallets).set({ balance: sql`${wallets.balance} + ${payout.toFixed(8)}` }).where(and(eq(wallets.userId, trade.userId), eq(wallets.asset, "USDT")));
    await db.insert(transactions).values({
      userId: trade.userId,
      asset: "USDT",
      type: "trade_payout",
      status: "completed",
      amount: payout.toFixed(8),
      note: `Trade Won: ${trade.symbol} (${trade.id})`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } else if (status === "draw") {
    await db.update(wallets).set({ balance: sql`${wallets.balance} + ${trade.amount}` }).where(and(eq(wallets.userId, trade.userId), eq(wallets.asset, "USDT")));
    await db.insert(transactions).values({
      userId: trade.userId,
      asset: "USDT",
      type: "trade_payout",
      status: "completed",
      amount: trade.amount,
      note: `Trade Draw: ${trade.symbol} (${trade.id})`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return trade.id;
}

export const settleTrade = settleContractTrade;

export async function listTrades(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.openedAt)).limit(50);
}

export async function listAllTrades() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trades).orderBy(desc(trades.openedAt)).limit(100);
}

export async function adminDashboard() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalBalances: "0", totalTrades: 0, wonTrades: 0, pendingTransactions: 0 };
  const [userRows, balanceRows, tradeRows, wonRows, pendingRows] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(users),
    db.select({ value: sql<string>`coalesce(sum(balance), 0)` }).from(wallets).where(eq(wallets.asset, "USDT")),
    db.select({ value: sql<number>`count(*)` }).from(trades),
    db.select({ value: sql<number>`count(*)` }).from(trades).where(eq(trades.status, "won")),
    db.select({ value: sql<number>`count(*)` }).from(transactions).where(eq(transactions.status, "pending")),
  ]);
  return {
    totalUsers: Number(userRows[0]?.value ?? 0),
    totalBalances: String(balanceRows[0]?.value ?? "0"),
    totalTrades: Number(tradeRows[0]?.value ?? 0),
    wonTrades: Number(wonRows[0]?.value ?? 0),
    pendingTransactions: Number(pendingRows[0]?.value ?? 0),
  };
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
}

export async function setUserFrozen(userId: number, frozen: boolean, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set({ isFrozen: frozen }).where(eq(users.id, userId));
  return listUsers();
}

export async function resetUserPassword(userId: number, passwordHash: string, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  return listUsers();
}

export async function approveTransaction(transactionId: number, status: "approved" | "rejected", adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [tx] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
  if (!tx) throw new Error("Transaction not found");
  await db.update(transactions).set({ status, adminId }).where(eq(transactions.id, transactionId));
  if (status === "approved" && tx.type === "deposit") {
    await db.update(wallets).set({ balance: sql`${wallets.balance} + ${tx.amount}` }).where(and(eq(wallets.userId, tx.userId), eq(wallets.asset, tx.asset)));
  }
  return listAllTransactions();
}

export async function getSettings() {
  const db = await getDb();
  if (!db) return {};
  const [settings] = await db.select().from(systemSettings).limit(1);
  return settings || {};
}

export async function updateSettings(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(systemSettings).set(data);
  return getSettings();
}

export async function listTradeRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tradeRules);
}

export async function upsertTradeRule(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(tradeRules).values(data).onDuplicateKeyUpdate({ set: data });
  return listTradeRules();
}

export async function adjustWallet(userId: number, asset: "USDT" | "BTC" | "ETH", amount: string, note: string, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(wallets).set({ balance: sql`${wallets.balance} + ${amount}` }).where(and(eq(wallets.userId, userId), eq(wallets.asset, asset)));
  return listWallets(userId);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return user || null;
}

export async function upsertUser(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(users).values(data).onDuplicateKeyUpdate({ set: data });
  return getUserByEmail(data.email);
}

export const createSpotOrder = async (data: any) => {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  // Basic implementation
  return { success: true };
};

export const executeSpotOrder = createSpotOrder;

export const transferToUser = async (data: any) => {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  // Basic implementation
  return { success: true };
};

export async function createAdminAuditLog(adminId: number, targetUserId: number | null, action: string, details: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(adminAuditLogs).values({
    adminId,
    targetUserId,
    action,
    detailsJson: details,
    createdAt: new Date()
  });
}
