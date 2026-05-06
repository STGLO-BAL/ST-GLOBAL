import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow and STGLOBAL account state.
 * The scaffold uses MySQL/TiDB-compatible Drizzle primitives in this environment.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  vipLevel: varchar("vipLevel", { length: 24 }).default("VIP 0").notNull(),
  isFrozen: boolean("isFrozen").default(false).notNull(),
  demoMode: boolean("demoMode").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: mysqlEnum("asset", ["USDT", "BTC", "ETH"]).notNull(),
  balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(),
  demoBalance: decimal("demoBalance", { precision: 20, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: mysqlEnum("asset", ["USDT", "BTC", "ETH"]).notNull(),
  type: mysqlEnum("type", ["deposit", "withdraw", "transfer", "adjustment", "trade_payout", "trade_stake"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed"]).default("pending").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  note: text("note"),
  adminId: int("adminId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 24 }).default("BTCUSDT").notNull(),
  direction: mysqlEnum("direction", ["UP", "FALL"]).notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  profitRate: decimal("profitRate", { precision: 8, scale: 4 }).default("0.82").notNull(),
  entryPrice: decimal("entryPrice", { precision: 24, scale: 8 }).notNull(),
  closingPrice: decimal("closingPrice", { precision: 24, scale: 8 }),
  status: mysqlEnum("status", ["open", "won", "lost", "draw", "cancelled"]).default("open").notNull(),
  resultSource: mysqlEnum("resultSource", ["price_engine", "demo_override"]).default("price_engine").notNull(),
  isDemo: boolean("isDemo").default(false).notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  settlesAt: timestamp("settlesAt").notNull(),
  settledAt: timestamp("settledAt"),
});

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  profitRate: decimal("profitRate", { precision: 8, scale: 4 }).default("0.82").notNull(),
  durationsJson: json("durationsJson").notNull(),
  contractsEnabled: boolean("contractsEnabled").default(true).notNull(),
  depositsEnabled: boolean("depositsEnabled").default(true).notNull(),
  withdrawalsEnabled: boolean("withdrawalsEnabled").default(true).notNull(),
  simulationModeEnabled: boolean("simulationModeEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Per-duration trading rules table.
 * Each row defines the minimum trade amount and profit rate for a specific duration.
 * Default rules: 30s → 100 USDT / 10%, 60s → 5000 USDT / 15%, 90s → 30000 USDT / 20%
 */
export const tradeRules = mysqlTable("tradeRules", {
  id: int("id").autoincrement().primaryKey(),
  durationSeconds: int("durationSeconds").notNull().unique(),
  minAmount: decimal("minAmount", { precision: 20, scale: 2 }).default("100.00").notNull(),
  profitRate: decimal("profitRate", { precision: 8, scale: 4 }).default("0.1000").notNull(),
  label: varchar("label", { length: 64 }).default("").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const adminAuditLogs = mysqlTable("adminAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  targetUserId: int("targetUserId"),
  action: varchar("action", { length: 96 }).notNull(),
  detailsJson: json("detailsJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type TradeRule = typeof tradeRules.$inferSelect;
export type InsertTradeRule = typeof tradeRules.$inferInsert;
