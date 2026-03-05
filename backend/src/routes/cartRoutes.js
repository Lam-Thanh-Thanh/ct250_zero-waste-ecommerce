const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');

/**
 * Cart Routes
 * Base URL: /api/cart
 * Tất cả routes đều yêu cầu đăng nhập
 */

// Lấy giỏ hàng
router.get('/', protect, cartController.getCart);

// Thêm sản phẩm vào giỏ
router.post('/items', protect, cartController.addItem);

// Cập nhật số lượng sản phẩm
router.put('/items/:productId', protect, cartController.updateItemQuantity);

// Xóa sản phẩm khỏi giỏ
router.delete('/items/:productId', protect, cartController.removeItem);

// Xóa toàn bộ giỏ hàng
router.delete('/', protect, cartController.clearCart);

module.exports = router;
