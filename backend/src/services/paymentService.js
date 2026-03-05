const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { v4: uuidv4 } = require('uuid');

/**
 * Payment Service
 * Xử lý logic thanh toán
 * - COD: Thanh toán khi nhận hàng
 * - Online: Giả lập cổng thanh toán (Banking, Momo, ZaloPay, VNPay)
 */
class PaymentService {
    /**
     * Xử lý thanh toán cho đơn hàng
     */
    async processPayment(orderId, method) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Đơn hàng không tồn tại');
        }

        let payment = await Payment.findOne({ order: orderId });
        if (!payment) {
            payment = new Payment({
                order: orderId,
                method,
                amount: order.totalAmount,
                status: 'pending'
            });
        }

        switch (method) {
            case 'COD':
                // COD: Thanh toán khi nhận hàng → giữ trạng thái pending
                payment.status = 'pending';
                payment.transactionId = `COD-${uuidv4().slice(0, 8).toUpperCase()}`;
                await payment.save();
                return {
                    success: true,
                    message: 'Đơn hàng sẽ được thanh toán khi nhận hàng',
                    payment,
                    paymentUrl: null
                };

            case 'Banking':
            case 'Momo':
            case 'ZaloPay':
            case 'VNPay':
                // Online payment: Giả lập → tự động đánh dấu đã thanh toán
                const transactionId = `${method.toUpperCase()}-${uuidv4().slice(0, 8).toUpperCase()}`;
                payment.status = 'paid';
                payment.transactionId = transactionId;
                payment.paidAt = new Date();
                payment.gatewayResponse = {
                    provider: method,
                    transactionId,
                    status: 'success',
                    processedAt: new Date()
                };
                await payment.save();

                // Cập nhật trạng thái thanh toán trên order
                order.paymentStatus = 'paid';
                order.paidAt = new Date();
                await order.save();

                return {
                    success: true,
                    message: `Thanh toán qua ${method} thành công`,
                    payment,
                    paymentUrl: null // Trong thực tế sẽ là URL của cổng thanh toán
                };

            default:
                throw new Error('Phương thức thanh toán không hợp lệ');
        }
    }

    /**
     * Xử lý callback từ cổng thanh toán (giả lập)
     */
    async handlePaymentCallback(paymentData) {
        const { transactionId, status, orderId } = paymentData;

        const payment = await Payment.findOne({
            $or: [
                { transactionId },
                { order: orderId }
            ]
        });

        if (!payment) {
            throw new Error('Không tìm thấy thông tin thanh toán');
        }

        if (status === 'success') {
            payment.status = 'paid';
            payment.paidAt = new Date();
            payment.gatewayResponse = paymentData;
            await payment.save();

            // Cập nhật order
            const order = await Order.findById(payment.order);
            if (order) {
                order.paymentStatus = 'paid';
                order.paidAt = new Date();
                await order.save();
            }

            return { success: true, message: 'Thanh toán thành công' };
        } else {
            payment.status = 'failed';
            payment.gatewayResponse = paymentData;
            await payment.save();

            return { success: false, message: 'Thanh toán thất bại' };
        }
    }

    /**
     * Lấy thông tin thanh toán theo đơn hàng
     */
    async getPaymentByOrder(orderId) {
        const payment = await Payment.findOne({ order: orderId });
        return payment;
    }
}

module.exports = new PaymentService();
