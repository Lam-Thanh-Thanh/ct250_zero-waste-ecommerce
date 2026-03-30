const express = require('express');
const router = express.Router();
const momoController = require('../controllers/momoController');
const { protect } = require('../middlewares/auth');

/**
 * MoMo Routes
 * Base URL: /api/momo
 */

/**
 * @route   POST /api/momo/create-payment-url
 * @desc    Tạo URL thanh toán MoMo
 * @access  Private
 */
router.post('/create-payment-url', protect, momoController.createPaymentUrl);

/**
 * @route   POST /api/momo/retry-payment
 * @desc    Thanh toán lại cho đơn hàng MoMo thất bại
 * @access  Private
 */
router.post('/retry-payment', protect, momoController.retryPayment);

/**
 * @route   GET /api/momo/momo-return
 * @desc    MoMo redirect người dùng về đây sau khi thanh toán
 * @access  Public
 */
router.get('/momo-return', momoController.momoReturn);

/**
 * @route   POST /api/momo/callback
 * @desc    MoMo IPN callback (webhook)
 * @access  Public
 */
router.post('/callback', momoController.momoCallback);

module.exports = router;
