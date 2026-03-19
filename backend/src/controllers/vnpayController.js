const vnpayService = require('../services/vnpayService');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

/**
 * VNPay Controller
 * Xử lý các endpoint liên quan đến thanh toán VNPay
 */

/**
 * @route   POST /api/vnpay/create-payment-url
 * @desc    Tạo URL thanh toán VNPay cho đơn hàng
 * @access  Private (cần đăng nhập)
 */
exports.createPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, orderDescription } = req.body;

    // Validate dữ liệu đầu vào
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đơn hàng (orderId, amount)'
      });
    }

    // Kiểm tra đơn hàng tồn tại trong database
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Lấy IP của khách hàng
    // x-forwarded-for: IP thật khi đằng sau reverse proxy (nginx, etc.)
    // req.socket.remoteAddress: IP trực tiếp
    let ipAddr = req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    // Lấy IP đầu tiên nếu có nhiều IP (x-forwarded-for có thể trả về danh sách)
    if (ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0].trim();
    }
    // Chuyển IPv6 loopback sang IPv4
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }

    // Dùng orderNumber làm vnp_TxnRef (ngắn gọn, dễ đọc, unique)
    // VNPay yêu cầu vnp_TxnRef là mã duy nhất cho mỗi giao dịch
    const txnRef = order.orderNumber;

    // Tạo mô tả thanh toán (không dấu, ASCII để tránh lỗi encode)
    const orderInfo = orderDescription || 'Thanh toan don hang ' + order.orderNumber;

    // Gọi service tạo URL thanh toán VNPay
    const paymentUrl = vnpayService.createPaymentUrl(
      txnRef,       // Mã tham chiếu (orderNumber)
      amount,       // Số tiền (VND)
      orderInfo,    // Mô tả
      ipAddr        // IP khách hàng
    );

    // Cập nhật payment record (đã được tạo bởi orderService)
    const payment = await Payment.findOne({ order: orderId });
    if (payment) {
      payment.method = 'VNPay';
      payment.status = 'pending';
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Tạo URL thanh toán thành công',
      data: {
        paymentUrl // URL để redirect người dùng sang VNPay
      }
    });
  } catch (error) {
    console.error('Create VNPay Payment URL Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo URL thanh toán VNPay'
    });
  }
};

/**
 * @route   POST /api/vnpay/retry-payment
 * @desc    Thanh toán lại cho đơn hàng VNPay bị thất bại hoặc chưa thanh toán
 * @access  Private (cần đăng nhập)
 *
 * Cho phép user thử thanh toán lại khi:
 * - Thanh toán trước đó bị thất bại (paymentStatus = 'failed')
 * - Chưa thanh toán (paymentStatus = 'pending')
 * - Phương thức thanh toán là VNPay
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

    // Tìm đơn hàng và kiểm tra quyền sở hữu
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

    // Chỉ cho phép thanh toán lại khi chưa thanh toán hoặc thất bại
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Chỉ cho phép đơn hàng VNPay
    if (order.paymentMethod !== 'VNPay') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ hỗ trợ thanh toán lại cho đơn hàng VNPay'
      });
    }

    // Chỉ cho phép khi đơn chưa bị hủy
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã bị hủy, không thể thanh toán lại'
      });
    }

    // Lấy IP
    let ipAddr = req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    if (ipAddr.includes(',')) ipAddr = ipAddr.split(',')[0].trim();
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';

    // Tạo URL thanh toán mới
    const paymentUrl = vnpayService.createPaymentUrl(
      order.orderNumber,
      order.totalAmount,
      'Thanh toan lai don hang ' + order.orderNumber,
      ipAddr
    );

    // Reset payment status về pending
    order.paymentStatus = 'pending';
    await order.save();

    // Cập nhật Payment record
    const payment = await Payment.findOne({ order: orderId });
    if (payment) {
      payment.status = 'pending';
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Tạo URL thanh toán lại thành công',
      data: { paymentUrl }
    });
  } catch (error) {
    console.error('Retry VNPay Payment Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo thanh toán lại'
    });
  }
};

/**
 * @route   GET /api/vnpay/vnpay-return
 * @desc    Return URL - VNPay redirect người dùng về đây sau khi thanh toán
 * @access  Public (VNPay redirect)
 *
 * Flow:
 * 1. VNPay redirect user → backend Return URL (endpoint này)
 * 2. Backend verify chữ ký → cập nhật trạng thái đơn hàng
 * 3. Backend redirect user → frontend hiển thị kết quả
 */
exports.vnpayReturn = async (req, res) => {
  try {
    // Lấy tất cả query parameters VNPay gửi về
    const vnpParams = { ...req.query };

    // Xác thực chữ ký bảo mật
    const { isValid, responseCode } = vnpayService.verifyReturnUrl(vnpParams);

    // Lấy thông tin giao dịch từ VNPay params (đọc TRƯỚC khi verify xóa chúng)
    const txnRef = req.query['vnp_TxnRef'];            // orderNumber
    const vnpAmount = req.query['vnp_Amount'];          // Số tiền (đã × 100)
    const transactionNo = req.query['vnp_TransactionNo']; // Mã giao dịch VNPay
    const bankCode = req.query['vnp_BankCode'];          // Ngân hàng thanh toán

    if (!isValid) {
      // Chữ ký không hợp lệ → có thể bị giả mạo
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/vnpay-return?success=false&message=Chu_ky_khong_hop_le`
      );
    }

    // Tìm đơn hàng theo orderNumber (vnp_TxnRef = orderNumber)
    const order = await Order.findOne({ orderNumber: txnRef });

    if (order && responseCode === '00' && order.paymentStatus !== 'paid') {
      // Giao dịch thành công → cập nhật trạng thái
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();

      // Cập nhật Payment record
      const payment = await Payment.findOne({ order: order._id });
      if (payment) {
        payment.status = 'paid';
        payment.transactionId = 'VNPAY-' + (transactionNo || '');
        payment.paidAt = new Date();
        payment.gatewayResponse = {
          provider: 'VNPay',
          transactionNo,
          responseCode,
          bankCode,
          processedAt: new Date()
        };
        await payment.save();
      }
    }

    // Redirect về frontend kèm theo kết quả
    const redirectUrl = `${process.env.FRONTEND_URL}/payment/vnpay-return` +
      `?success=${responseCode === '00'}` +
      `&orderId=${txnRef}` +
      `&amount=${vnpAmount ? Math.round(vnpAmount / 100) : 0}` +
      `&transactionNo=${transactionNo || ''}` +
      `&bankCode=${bankCode || ''}` +
      `&responseCode=${responseCode}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('VNPay Return Error:', error);
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/vnpay-return?success=false&message=Loi_xu_ly`
    );
  }
};

/**
 * @route   GET /api/vnpay/vnpay-ipn
 * @desc    IPN URL - VNPay gọi ngầm (webhook) để thông báo kết quả giao dịch
 * @access  Public (VNPay webhook)
 *
 * Mã RspCode trả về cho VNPay:
 * - '00': Xác nhận thành công
 * - '01': Đơn hàng không tồn tại
 * - '02': Đơn hàng đã xử lý rồi
 * - '04': Sai số tiền
 * - '97': Chữ ký không hợp lệ
 * - '99': Lỗi không xác định
 */
exports.vnpayIPN = async (req, res) => {
  try {
    // Lấy tất cả query parameters VNPay gửi về
    const vnpParams = { ...req.query };

    // Xác thực chữ ký bảo mật
    const { isValid, responseCode } = vnpayService.verifyReturnUrl(vnpParams);

    // Kiểm tra chữ ký
    if (!isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    }

    // Lấy thông tin giao dịch
    const txnRef = req.query['vnp_TxnRef'];              // orderNumber
    const rspCode = req.query['vnp_ResponseCode'];
    const vnpAmount = parseInt(req.query['vnp_Amount']) / 100;
    const transactionNo = req.query['vnp_TransactionNo'];

    // Tìm đơn hàng theo orderNumber
    const order = await Order.findOne({ orderNumber: txnRef });
    if (!order) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    // Kiểm tra đơn hàng đã được xử lý chưa (tránh xử lý trùng)
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    // Kiểm tra số tiền khớp
    if (vnpAmount !== order.totalAmount) {
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    // Cập nhật trạng thái đơn hàng dựa theo mã phản hồi
    if (rspCode === '00') {
      // Giao dịch thành công
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();

      // Cập nhật Payment record
      const payment = await Payment.findOne({ order: order._id });
      if (payment) {
        payment.status = 'paid';
        payment.transactionId = 'VNPAY-' + transactionNo;
        payment.paidAt = new Date();
        payment.gatewayResponse = {
          provider: 'VNPay', transactionNo, responseCode: rspCode,
          processedAt: new Date()
        };
        await payment.save();
      }
    } else {
      // Giao dịch thất bại
      order.paymentStatus = 'failed';
      await order.save();

      const payment = await Payment.findOne({ order: order._id });
      if (payment) {
        payment.status = 'failed';
        payment.gatewayResponse = {
          provider: 'VNPay', transactionNo, responseCode: rspCode,
          processedAt: new Date()
        };
        await payment.save();
      }
    }

    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    console.error('VNPay IPN Error:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};
