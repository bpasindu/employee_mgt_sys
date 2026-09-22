const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });


const poolConfig = {
  host: process.env.DB_HOST || 'mysql-bd1ecd6-buddhimapw-8a8e.i.aivencloud.com',
  port: Number(process.env.DB_PORT) || 28005,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_SSL === 'true' || !process.env.DB_SSL || poolConfig.host.includes('aivencloud.com')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}


const pool = mysql.createPool(poolConfig);

module.exports = pool;