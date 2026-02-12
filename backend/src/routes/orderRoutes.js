const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Order Routes
 * Base URL: /api/orders
 */

// Admin routes - Statistics
router.get(
    '/stats/overview',
    protect,
    authorize('admin'),
    orderController.getOrderStats
);

// Admin routes - Get all orders
router.get(
    '/',
    protect,
    authorize('admin'),
    orderController.getAllOrders
);

// Get order by ID (Admin or Owner)
router.get(
    '/:id',
    protect,
    orderController.getOrderById
);

// Update order status (Admin only)
router.put(
    '/:id/status',
    protect,
    authorize('admin'),
    orderController.updateOrderStatus
);

// Update payment status (Admin only)
router.put(
    '/:id/payment-status',
    protect,
    authorize('admin'),
    orderController.updatePaymentStatus
);

// Add admin note (Admin only)
router.put(
    '/:id/admin-note',
    protect,
    authorize('admin'),
    orderController.addAdminNote
);

// Get user's orders
router.get(
    '/user/:userId',
    protect,
    orderController.getUserOrders
);

module.exports = router;