import mysql from 'mysql2/promise';
async function run() {
  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port: 4000,
    user: '2EWKws9XgmCuB9B.root',
    password: 'jw5HS6SlJ1GnSEEA',
    ssl: { rejectUnauthorized: true }
  });
  await connection.query('CREATE DATABASE IF NOT EXISTS stglobal');
  console.log('Database stglobal created or already exists');
  await connection.end();
}
run().catch(console.error);
