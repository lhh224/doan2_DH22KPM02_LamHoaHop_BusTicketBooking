/**
 * File: db.js
 * Mục đích: Quản lý kết nối đến SQL Server
 * Sử dụng thư viện mssql để tạo connection pool
 */

const sql = require("mssql");
const config = require("./env");

// Cấu hình kết nối SQL Server
const sqlConfig = {
  server: config.SQL_SERVER,
  database: config.SQL_DATABASE,
  user: config.SQL_USER,
  password: config.SQL_PASSWORD,
  options: {
    encrypt: config.SQL_ENCRYPT,
    trustServerCertificate: config.SQL_TRUST_SERVER_CERTIFICATE,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection pool toàn cục
let poolPromise;

/**
 * Hàm khởi tạo connection pool
 * @returns {Promise<sql.ConnectionPool>} Connection pool
 */
const getPool = async () => {
  if (!poolPromise) {
    try {
      poolPromise = new sql.ConnectionPool(sqlConfig)
        .connect()
        .then((pool) => {
          console.log("✅ Đã kết nối SQL Server thành công");
          return pool;
        })
        .catch((err) => {
          console.error("❌ Lỗi kết nối SQL Server:", err);
          poolPromise = null;
          throw err;
        });
    } catch (error) {
      console.error("❌ Lỗi khởi tạo pool:", error);
      throw error;
    }
  }
  return poolPromise;
};

/**
 * Hàm đóng connection pool (sử dụng khi shutdown server)
 */
const closePool = async () => {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
    console.log("🔒 Đã đóng connection pool SQL Server");
  }
};

module.exports = {
  sql,
  getPool,
  closePool,
};
