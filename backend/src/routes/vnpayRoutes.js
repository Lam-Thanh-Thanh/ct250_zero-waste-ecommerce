const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpayController');
const { protect } = require('../middlewares/auth');

/**
 * VNPay Routes
 * Base URL: /api/vnpay
 */

/**
 * @route   POST /api/vnpay/create-payment-url
 * @desc    Tạo URL thanh toán VNPay (cần đăng nhập)
 * @access  Private
 */
router.post('/create-payment-url', protect, vnpayController.createPaymentUrl);

/**
 * @route   POST /api/vnpay/retry-payment
 * @desc    Thanh toán lại cho đơn hàng VNPay bị thất bại
 * @access  Private
 */
router.post('/retry-payment', protect, vnpayController.retryPayment);

/**
 * @route   GET /api/vnpay/vnpay-return
 * @desc    VNPay redirect người dùng về đây sau khi thanh toán
 * @access  Public (VNPay redirect)
 */
router.get('/vnpay-return', vnpayController.vnpayReturn);

/**
 * @route   GET /api/vnpay/vnpay-ipn
 * @desc    VNPay gọi ngầm (webhook) để xác nhận giao dịch
 * @access  Public (VNPay webhook)
 */
router.get('/vnpay-ipn', vnpayController.vnpayIPN);

module.exports = router;
