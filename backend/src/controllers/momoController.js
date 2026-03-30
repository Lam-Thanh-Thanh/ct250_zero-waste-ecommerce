const momoService = require('../services/momoService');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

/**
 * MoMo Controller
 * Xử lý các endpoint liên quan đến thanh toán MoMo
 */

/**
 * @route   POST /api/momo/create-payment-url
 * @desc    Tạo URL thanh toán MoMo cho đơn hàng
 * @access  Private
 */
exports.createPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, orderDescription } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin đơn hàng (orderId, amount)'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const orderInfo = orderDescription || `Thanh toan don hang ${order.orderNumber}`;

        // Sử dụng orderNumber làm orderId cho MoMo (unique)
        const momoOrderId = `${order.orderNumber}_${Date.now()}`;

        const result = await momoService.createPaymentUrl(
            momoOrderId,
            Math.round(amount),
            orderInfo
        );

        // Cập nhật Payment record
        const payment = await Payment.findOne({ order: orderId });
        if (payment) {
            payment.method = 'Momo';
            payment.status = 'pending';
            payment.transactionId = momoOrderId;
            await payment.save();
        }

        res.status(200).json({
            success: true,
            message: 'Tạo URL thanh toán MoMo thành công',
            data: {
                paymentUrl: result.payUrl,
                deeplink: result.deeplink,
                qrCodeUrl: result.qrCodeUrl
            }
        });
    } catch (error) {
        console.error('Create MoMo Payment URL Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo URL thanh toán MoMo'
        });
    }
};

/**
 * @route   POST /api/momo/retry-payment
 * @desc    Thanh toán lại cho đơn hàng MoMo thất bại
 * @access  Private
 */
exports.retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã đơn hàng'
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã được thanh toán'
            });
        }

        if (order.paymentMethod !== 'Momo') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ hỗ trợ thanh toán lại cho đơn hàng MoMo'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã bị hủy, không thể thanh toán lại'
            });
        }

        const momoOrderId = `${order.orderNumber}_${Date.now()}`;

        const result = await momoService.createPaymentUrl(
            momoOrderId,
            Math.round(order.totalAmount),
            `Thanh toan lai don hang ${order.orderNumber}`
        );

        // Reset payment status
        order.paymentStatus = 'pending';
        await order.save();

        const payment = await Payment.findOne({ order: orderId });
        if (payment) {
            payment.status = 'pending';
            payment.transactionId = momoOrderId;
            await payment.save();
        }

        res.status(200).json({
            success: true,
            message: 'Tạo URL thanh toán lại MoMo thành công',
            data: {
                paymentUrl: result.payUrl,
                deeplink: result.deeplink,
                qrCodeUrl: result.qrCodeUrl
            }
        });
    } catch (error) {
        console.error('Retry MoMo Payment Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo thanh toán lại MoMo'
        });
    }
};

/**
 * @route   GET /api/momo/momo-return
 * @desc    MoMo redirect người dùng về đây sau khi thanh toán
 * @access  Public
 */
exports.momoReturn = async (req, res) => {
    try {
        const params = { ...req.query };
        const { resultCode, orderId, amount, transId, message } = params;

        // Verify signature
        const isValid = momoService.verifySignature(params);

        if (!isValid) {
            return res.redirect(
                `${process.env.FRONTEND_URL}/payment/momo-return?success=false&message=Chu_ky_khong_hop_le`
            );
        }

        // Tìm order bằng orderNumber (MoMo orderId = orderNumber_timestamp)
        const orderNumber = orderId.split('_')[0];
        const order = await Order.findOne({ orderNumber: orderNumber });

        if (order && resultCode == 0 && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.paidAt = new Date();
            await order.save();

            const payment = await Payment.findOne({ order: order._id });
            if (payment) {
                payment.status = 'paid';
                payment.transactionId = `MOMO-${transId || ''}`;
                payment.paidAt = new Date();
                payment.gatewayResponse = {
                    provider: 'MoMo',
                    transactionNo: transId,
                    resultCode: resultCode,
                    message: message,
                    processedAt: new Date()
                };
                await payment.save();
            }
        }

        const redirectUrl = `${process.env.FRONTEND_URL}/payment/momo-return` +
            `?success=${resultCode == 0}` +
            `&orderId=${orderNumber}` +
            `&amount=${amount || 0}` +
            `&transId=${transId || ''}` +
            `&resultCode=${resultCode}` +
            `&message=${encodeURIComponent(message || '')}`;

        res.redirect(redirectUrl);
    } catch (error) {
        console.error('MoMo Return Error:', error);
        res.redirect(
            `${process.env.FRONTEND_URL}/payment/momo-return?success=false&message=Loi_xu_ly`
        );
    }
};

/**
 * @route   POST /api/momo/callback
 * @desc    MoMo IPN callback (webhook) để xác nhận giao dịch
 * @access  Public
 */
exports.momoCallback = async (req, res) => {
    try {
        const params = req.body;
        const { resultCode, orderId, transId, amount, message } = params;

        // Verify signature
        const isValid = momoService.verifySignature(params);

        if (!isValid) {
            return res.status(200).json({ resultCode: 97, message: 'Fail checksum' });
        }

        const orderNumber = orderId.split('_')[0];
        const order = await Order.findOne({ orderNumber: orderNumber });

        if (!order) {
            return res.status(200).json({ resultCode: 1, message: 'Order not found' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ resultCode: 2, message: 'Order already confirmed' });
        }

        if (resultCode == 0) {
            // Thanh toán thành công
            order.paymentStatus = 'paid';
            order.paidAt = new Date();
            await order.save();

            const payment = await Payment.findOne({ order: order._id });
            if (payment) {
                payment.status = 'paid';
                payment.transactionId = `MOMO-${transId}`;
                payment.paidAt = new Date();
                payment.gatewayResponse = {
                    provider: 'MoMo',
                    transactionNo: transId,
                    resultCode,
                    message,
                    processedAt: new Date()
                };
                await payment.save();
            }
        } else {
            // Thanh toán thất bại
            order.paymentStatus = 'failed';
            await order.save();

            const payment = await Payment.findOne({ order: order._id });
            if (payment) {
                payment.status = 'failed';
                payment.gatewayResponse = {
                    provider: 'MoMo',
                    transactionNo: transId,
                    resultCode,
                    message,
                    processedAt: new Date()
                };
                await payment.save();
            }
        }

        return res.status(200).json({ resultCode: 0, message: 'Confirm Success' });
    } catch (error) {
        console.error('MoMo Callback Error:', error);
        return res.status(200).json({ resultCode: 99, message: 'Unknown error' });
    }
};
