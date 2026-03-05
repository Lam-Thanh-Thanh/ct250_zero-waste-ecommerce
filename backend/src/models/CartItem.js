/**
 * CartItem Schema
 * Cart items được nhúng trực tiếp trong Cart model (embedded sub-document)
 * File này export lại Cart model để giữ tính nhất quán với cấu trúc dự án
 */
const Cart = require('./Cart');

module.exports = Cart;
