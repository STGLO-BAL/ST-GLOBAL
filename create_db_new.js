import mysql from 'mysql2/promise';
async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  await connection.query('CREATE DATABASE IF NOT EXISTS stglobal');
  console.log('Database stglobal created');
  await connection.end();
}
run().catch(console.error);
