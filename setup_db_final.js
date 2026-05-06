import mysql from 'mysql2/promise';
async function run() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  await connection.query('CREATE DATABASE IF NOT EXISTS stglobal');
  console.log('Database stglobal verified');
  await connection.end();
}
run().catch(console.error);
