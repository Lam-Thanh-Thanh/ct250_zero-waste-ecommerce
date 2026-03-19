const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');

/**
 * Auto-Cancel Scheduler
 * Tự động hủy đơn hàng VNPay chưa thanh toán sau 15 phút
 *
 * Chạy mỗi 2 phút để kiểm tra đơn hàng quá hạn
 */

// Thời gian hết hạn thanh toán (15 phút)
const PAYMENT_TIMEOUT_MINUTES = 15;

/**
 * Hủy đơn hàng VNPay quá hạn thanh toán
 * - Tìm đơn hàng VNPay có paymentStatus = 'pending' hoặc 'failed'
 * - Đã tạo quá 15 phút
 * - Tự động hủy và hoàn stock
 */
const cancelExpiredVNPayOrders = async () => {
  try {
    // Tính thời điểm hết hạn (15 phút trước)
    const expireTime = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

    // Tìm đơn hàng VNPay chưa thanh toán và đã quá hạn
    const expiredOrders = await Order.find({
      paymentMethod: 'VNPay',
      paymentStatus: { $in: ['pending', 'failed'] },
      status: { $in: ['pending', 'confirmed'] },  // Chưa bị hủy
      createdAt: { $lte: expireTime }              // Tạo trước thời điểm hết hạn
    });

    if (expiredOrders.length === 0) return;

    console.log(`[Auto-Cancel] Tìm thấy ${expiredOrders.length} đơn VNPay quá hạn thanh toán`);

    for (const order of expiredOrders) {
      try {
        // 1. Cập nhật trạng thái đơn hàng → cancelled
        order.status = 'cancelled';
        order.paymentStatus = 'failed';
        order.cancelReason = 'Hệ thống tự động hủy: quá thời hạn thanh toán VNPay (15 phút)';
        order.cancelledAt = new Date();

        // Thêm vào lịch sử trạng thái
        order.statusHistory.push({
          status: 'cancelled',
          note: 'Tự động hủy do quá hạn thanh toán VNPay (15 phút)',
          updatedBy: null, // System auto
          updatedAt: new Date()
        });

        await order.save();

        // 2. Hoàn lại stock cho từng sản phẩm
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            {
              $inc: { stock: item.quantity },
              $set: { inStock: true }
            }
          );
        }

        // 3. Cập nhật Payment record
        await Payment.findOneAndUpdate(
          { order: order._id },
          {
            status: 'failed',
            gatewayResponse: {
              provider: 'VNPay',
              responseCode: 'timeout',
              processedAt: new Date()
            }
          }
        );

        // 4. Hoàn lại mã giảm giá nếu có
        if (order.promotion) {
          await Promotion.findByIdAndUpdate(order.promotion, {
            $inc: { usedCount: -1 },
            $pull: { usedBy: order.user }
          });
        }

        console.log(`[Auto-Cancel] Đã hủy đơn hàng ${order.orderNumber}`);
      } catch (err) {
        console.error(`[Auto-Cancel] Lỗi khi hủy đơn ${order.orderNumber}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Auto-Cancel] Lỗi scheduler:', error.message);
  }
};

/**
 * Khởi chạy scheduler
 * Kiểm tra mỗi 2 phút (120,000ms)
 */
const startAutoCancelScheduler = () => {
  console.log('[Auto-Cancel] Scheduler đã khởi động - Kiểm tra mỗi 2 phút');

  // Chạy lần đầu sau 30 giây (đợi server khởi động xong)
  setTimeout(() => {
    cancelExpiredVNPayOrders();
  }, 30000);

  // Sau đó chạy mỗi 2 phút
  setInterval(cancelExpiredVNPayOrders, 2 * 60 * 1000);
};

module.exports = { startAutoCancelScheduler, cancelExpiredVNPayOrders };
