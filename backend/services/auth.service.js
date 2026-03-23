/**
 * File: services/auth.service.js
 * Mục đích: Authentication service - Xử lý logic đăng nhập, đăng ký
 */

const sql = require("mssql");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { getPool } = require("../config/db");
const { generateToken, generateRefreshToken } = require("../middleware/auth");

const SALT_ROUNDS = 10;

/**
 * Đăng ký tài khoản mới
 */
const register = async (userData) => {
  const pool = await getPool();

  const { username, email, password, hoTen, soDienThoai } = userData;

  // Kiểm tra tên đăng nhập đã tồn tại
  const checkUsername = await pool
    .request()
    .input("Username", sql.NVarChar, username)
    .query("SELECT UserId FROM Users WHERE Username = @Username");

  if (checkUsername.recordset.length > 0) {
    throw new Error("Tên đăng nhập đã được sử dụng");
  }

  // Kiểm tra email đã tồn tại
  const checkEmail = await pool
    .request()
    .input("Email", sql.NVarChar, email)
    .query("SELECT UserId FROM Users WHERE Email = @Email");

  if (checkEmail.recordset.length > 0) {
    throw new Error("Email đã được sử dụng");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user - Đơn giản hóa, không cần xác thực email
  const result = await pool
    .request()
    .input("Username", sql.NVarChar, username)
    .input("Email", sql.NVarChar, email)
    .input("Password", sql.NVarChar, hashedPassword)
    .input("FullName", sql.NVarChar, hoTen)
    .input("Phone", sql.NVarChar, soDienThoai || null).query(`
      INSERT INTO Users (Username, Email, Password, FullName, Phone, Role, Status, EmailVerified)
      OUTPUT INSERTED.UserId, INSERTED.Username, INSERTED.Email, INSERTED.FullName, INSERTED.Role
      VALUES (@Username, @Email, @Password, @FullName, @Phone, 'CUSTOMER', 1, 1)
    `);

  const user = result.recordset[0];

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save session
  await pool
    .request()
    .input("UserId", sql.Int, user.UserId)
    .input("Token", sql.NVarChar, token)
    .input("RefreshToken", sql.NVarChar, refreshToken)
    .input(
      "ExpiresAt",
      sql.DateTime,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ).query(`
      INSERT INTO Sessions (UserId, Token, RefreshToken, ExpiresAt)
      VALUES (@UserId, @Token, @RefreshToken, @ExpiresAt)
    `);

  return {
    user: {
      id: user.UserId,
      Username: user.Username,
      Email: user.Email,
      HoTen: user.FullName,
      VaiTro: user.Role,
    },
    token,
    refreshToken,
  };
};

/**
 * Đăng nhập
 */
const login = async (username, password) => {
  const pool = await getPool();

  // Tìm user theo tên đăng nhập
  const result = await pool.request().input("Username", sql.NVarChar, username)
    .query(`
      SELECT UserId, Username, Email, Password, FullName, Phone, Role, Status, EmailVerified
      FROM Users
      WHERE Username = @Username
    `);

  if (result.recordset.length === 0) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
  }

  const user = result.recordset[0];

  // Kiểm tra trạng thái tài khoản
  if (user.Status === false || user.Status === 0) {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.Password);

  if (!isValidPassword) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
  }

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save session
  await pool
    .request()
    .input("UserId", sql.Int, user.UserId)
    .input("Token", sql.NVarChar, token)
    .input("RefreshToken", sql.NVarChar, refreshToken)
    .input(
      "ExpiresAt",
      sql.DateTime,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ).query(`
      INSERT INTO Sessions (UserId, Token, RefreshToken, ExpiresAt)
      VALUES (@UserId, @Token, @RefreshToken, @ExpiresAt)
    `);

  // Update last login
  await pool
    .request()
    .input("UserId", sql.Int, user.UserId)
    .query("UPDATE Users SET LastLoginAt = GETDATE() WHERE UserId = @UserId");

  return {
    user: {
      id: user.UserId,
      Username: user.Username,
      Email: user.Email,
      HoTen: user.FullName,
      SoDienThoai: user.Phone,
      VaiTro: user.Role,
      EmailVerified: user.EmailVerified,
    },
    token,
    refreshToken,
  };
};

/**
 * Đăng xuất
 */
const logout = async (token) => {
  const pool = await getPool();

  await pool.request().input("Token", sql.NVarChar, token).query(`
      UPDATE Sessions 
      SET Status = 'REVOKED'
      WHERE Token = @Token
    `);

  return true;
};

/**
 * Lấy thông tin user từ token
 */
const getUserByToken = async (userId) => {
  const pool = await getPool();

  const result = await pool.request().input("UserId", sql.Int, userId).query(`
      SELECT UserId, Email, FullName, Phone, Address, Role, Status, EmailVerified, CreatedAt
      FROM Users
      WHERE UserId = @UserId
    `);

  if (result.recordset.length === 0) {
    throw new Error("Không tìm thấy người dùng");
  }

  return result.recordset[0];
};

/**
 * Đổi mật khẩu
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const pool = await getPool();

  // Lấy mật khẩu hiện tại
  const result = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query("SELECT Password FROM Users WHERE UserId = @UserId");

  if (result.recordset.length === 0) {
    throw new Error("Không tìm thấy người dùng");
  }

  const user = result.recordset[0];

  // Verify old password
  const isValidPassword = await bcrypt.compare(oldPassword, user.Password);

  if (!isValidPassword) {
    throw new Error("Mật khẩu cũ không đúng");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await pool
    .request()
    .input("UserId", sql.Int, userId)
    .input("Password", sql.NVarChar, hashedPassword).query(`
      UPDATE Users 
      SET Password = @Password, UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);

  // Revoke all sessions
  await pool.request().input("UserId", sql.Int, userId).query(`
      UPDATE Sessions 
      SET Status = 'REVOKED'
      WHERE UserId = @UserId AND Status = 'ACTIVE'
    `);

  return true;
};

module.exports = {
  register,
  login,
  logout,
  getUserByToken,
  changePassword,
};
