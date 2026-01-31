const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token
 * @param {Object} payload - Dữ liệu cần mã hóa (userId, role...)
 * @param {String} expiresIn - Thời gian hết hạn (ví dụ: '7d', '1h')
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn }
    );
  } catch (error) {
    throw new Error('Lỗi khi tạo token');
  }
};

/**
 * Verify JWT token
 * @param {String} token - JWT token cần verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token đã hết hạn');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token không hợp lệ');
    } else {
      throw new Error('Lỗi khi xác thực token');
    }
  }
};

/**
 * Decode token không verify (chỉ dùng để xem thông tin)
 * @param {String} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Lỗi khi decode token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};