// ✅ FILE: db.js
const mysql = require('mysql2');

let pool;

function createPool() {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('✅ Tạo pool kết nối MySQL');
}

createPool();

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        // Nếu lỗi liên quan đến mất kết nối, tạo lại pool
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.message.includes('closed')) {
          console.error('🔁 Mất kết nối, tạo lại pool...');
          createPool();
        }
        return reject(err);
      }
      resolve(results);
    });
  });
}

module.exports = { query };
