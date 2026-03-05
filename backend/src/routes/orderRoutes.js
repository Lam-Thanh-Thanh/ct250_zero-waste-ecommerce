const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Order Routes
 * Base URL: /api/orders
 */

// ===== USER Routes (phải đặt TRƯỚC /:id để tránh conflict) =====

// Tạo đơn hàng mới (Checkout)
router.post(
    '/',
    protect,
    orderController.createOrder
);

// Lấy đơn hàng của user hiện tại
router.get(
    '/my-orders',
    protect,
    orderController.getMyOrders
);

// Lấy chi tiết đơn hàng của user hiện tại
router.get(
    '/my-orders/:id',
    protect,
    orderController.getMyOrderDetail
);

// ===== ADMIN Routes =====

// Admin - Thống kê đơn hàng
router.get(
    '/stats/overview',
    protect,
    authorize('admin'),
    orderController.getOrderStats
);

// Admin - Lấy tất cả đơn hàng
router.get(
    '/',
    protect,
    authorize('admin'),
    orderController.getAllOrders
);

// Admin - Lấy đơn hàng theo user
router.get(
    '/user/:userId',
    protect,
    orderController.getUserOrders
);

// Lấy chi tiết đơn hàng (Admin hoặc Owner)
router.get(
    '/:id',
    protect,
    orderController.getOrderById
);

// User hủy đơn hàng
router.put(
    '/:id/cancel',
    protect,
    orderController.cancelMyOrder
);

// Admin - Cập nhật trạng thái đơn hàng
router.put(
    '/:id/status',
    protect,
    authorize('admin'),
    orderController.updateOrderStatus
);

// Admin - Cập nhật trạng thái thanh toán
router.put(
    '/:id/payment-status',
    protect,
    authorize('admin'),
    orderController.updatePaymentStatus
);

// Admin - Thêm ghi chú
router.put(
    '/:id/admin-note',
    protect,
    authorize('admin'),
    orderController.addAdminNote
);

module.exports = router;