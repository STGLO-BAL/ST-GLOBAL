import mysql from "mysql2/promise";

const baseConfig = 'mysql://iwWzZG5zyJT1RCM.root:tvl1PiInr4e0jizf@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/?ssl={"rejectUnauthorized":true}';

async function setup() {
  console.log("Connecting to TiDB Cloud...");
  const connection = await mysql.createConnection(baseConfig);
  console.log("Connected!");

  console.log("Creating database 'stglobal'...");
  await connection.query("CREATE DATABASE IF NOT EXISTS stglobal");
  await connection.query("USE stglobal");
  console.log("Database 'stglobal' ready.");

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      currency VARCHAR(50) NOT NULL,
      balance DECIMAL(20, 8) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS market_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      symbol VARCHAR(50) NOT NULL,
      price DECIMAL(20, 8) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    console.log("Executing table creation query...");
    await connection.query(query);
  }

  console.log("SUCCESS: All tables created in 'stglobal' database!");
  await connection.end();
}

setup().catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
