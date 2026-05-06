import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { systemSettings, tradeRules } from "./drizzle/schema.js";
import { sql } from "drizzle-orm";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    return;
  }

  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  const db = drizzle(connection);

  console.log("Seeding systemSettings...");
  const [existingSettings] = await db.select().from(systemSettings).limit(1);
  if (!existingSettings) {
    await db.insert(systemSettings).values({
      profitRate: "0.8200",
      durationsJson: [30, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540, 600],
      contractsEnabled: true,
      depositsEnabled: true,
      withdrawalsEnabled: true,
      simulationModeEnabled: true,
    });
    console.log("systemSettings seeded.");
  } else {
    console.log("systemSettings already exists.");
  }

  console.log("Seeding tradeRules...");
  const rules = [
    { duration: 30, profit: "0.1000", min: "1000" },
    { duration: 60, profit: "0.1500", min: "5000" },
    { duration: 90, profit: "0.2000", min: "30000" },
    { duration: 120, profit: "0.2500", min: "50000" },
    { duration: 180, profit: "0.3000", min: "100000" },
    { duration: 240, profit: "0.3500", min: "300000" },
    { duration: 300, profit: "0.4000", min: "500000" },
    { duration: 360, profit: "0.4500", min: "1000000" },
    { duration: 420, profit: "0.5000", min: "2000000" },
    { duration: 480, profit: "0.5500", min: "3000000" },
    { duration: 540, profit: "0.6000", min: "4000000" },
    { duration: 600, profit: "0.6500", min: "5000000" },
  ];

  for (const rule of rules) {
    const [existing] = await db.select().from(tradeRules).where(sql`durationSeconds = ${rule.duration}`).limit(1);
    if (!existing) {
      await db.insert(tradeRules).values({
        durationSeconds: rule.duration,
        profitRate: rule.profit,
        minAmount: rule.min,
        label: `${rule.duration}s`,
        isActive: true,
      });
      console.log(`tradeRule for ${rule.duration}s seeded.`);
    }
  }

  console.log("Seeding complete.");
  await connection.end();
}

seed().catch(console.error);
