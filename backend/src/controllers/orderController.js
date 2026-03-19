const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');

/**
 * @route   GET /api/orders
 * @desc    Lấy danh sách đơn hàng (Admin - có filter đầy đủ)
 * @access  Private/Admin
 */
exports.getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            paymentStatus,
            paymentMethod,
            search,
            startDate,
            endDate,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by payment status
        if (paymentStatus && paymentStatus !== 'all') {
            query.paymentStatus = paymentStatus;
        }

        // Filter by payment method
        if (paymentMethod && paymentMethod !== 'all') {
            query.paymentMethod = paymentMethod;
        }

        // Search by order number, phone, customer name
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
                { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        // Execute queries
        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('user', 'username email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalOrders: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get All Orders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng'
        });
    }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Lấy chi tiết đơn hàng
 * @access  Private/Admin hoặc User (chỉ xem đơn của mình)
 */
exports.getOrderById = async (req, res) => {
    try {
        let order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Populate user
        await order.populate('user', 'username email phone ecoPoints');
        
        // Populate items.product with error handling
        try {
            await order.populate({
                path: 'items.product',
                select: 'name slug images'
            });
        } catch (populateError) {
            console.warn('Warning: Some products could not be populated:', populateError.message);
            // Continue anyway, items will have product IDs but not full data
        }

        // Populate promotion if exists
        if (order.promotion) {
            try {
                await order.populate('promotion', 'name code discountValue');
            } catch (e) {
                console.warn('Warning: Promotion could not be populated');
            }
        }

        // Populate status history
        try {
            await order.populate('statusHistory.updatedBy', 'username');
        } catch (e) {
            console.warn('Warning: Status history could not be populated');
        }

        // Kiểm tra quyền: Admin xem tất cả, User chỉ xem đơn của mình
        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem đơn hàng này'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get Order By ID Error:', error);
        console.error('Order ID:', req.params.id);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin đơn hàng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Cập nhật trạng thái đơn hàng
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['shipping', 'cancelled'],
            'shipping': ['delivered', 'cancelled'],
            'delivered': ['refunded'],
            'cancelled': [],
            'refunded': []
        };

        if (!validTransitions[order.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"`
            });
        }

        // Update status
        const oldStatus = order.status;
        order.status = status;

        // Add to status history
        order.statusHistory.push({
            status,
            note: note || `Đơn hàng chuyển từ ${oldStatus} sang ${status}`,
            updatedBy: req.user._id,
            updatedAt: new Date()
        });

        // Special handling for different statuses
        if (status === 'delivered') {
            order.deliveredAt = new Date();
            order.paymentStatus = 'paid';
            order.paidAt = new Date();

            // Cộng eco points cho user
            if (order.ecoPointsEarned > 0) {
                await User.findByIdAndUpdate(order.user, {
                    $inc: { ecoPoints: order.ecoPointsEarned }
                });
            }

            // Cập nhật số lượng đã bán cho sản phẩm
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: {
                        sold: item.quantity,
                        stock: -item.quantity
                    }
                });
            }
        }

        if (status === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancelledBy = req.user._id;
            order.cancelReason = note || 'Admin hủy đơn';

            // Hoàn lại stock
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }

            // Hoàn lại mã giảm giá nếu có sử dụng
            if (order.promotion) {
                await Promotion.findByIdAndUpdate(order.promotion, {
                    $inc: { usedCount: -1 },
                    $pull: { usedBy: order.user }
                });
            }
        }

        if (status === 'refunded') {
            order.paymentStatus = 'refunded';

            // Trừ eco points nếu đã cộng
            if (order.ecoPointsEarned > 0) {
                await User.findByIdAndUpdate(order.user, {
                    $inc: { ecoPoints: -order.ecoPointsEarned }
                });
            }

            // Trừ số lượng đã bán
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: {
                        sold: -item.quantity,
                        stock: item.quantity
                    }
                });
            }
        }

        if (status === 'confirmed') {
            // Có thể gửi email xác nhận đơn hàng
        }

        await order.save();

        // Populate lại để trả về đầy đủ thông tin
        await order.populate('statusHistory.updatedBy', 'username');

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
            data: order
        });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái đơn hàng'
        });
    }
};

/**
 * @route   PUT /api/orders/:id/payment-status
 * @desc    Cập nhật trạng thái thanh toán
 * @access  Private/Admin
 */
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        order.paymentStatus = paymentStatus;

        if (paymentStatus === 'paid') {
            order.paidAt = new Date();
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thanh toán thành công',
            data: order
        });
    } catch (error) {
        console.error('Update Payment Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái thanh toán'
        });
    }
};

/**
 * @route   GET /api/orders/stats/overview
 * @desc    Thống kê tổng quan đơn hàng
 * @access  Private/Admin
 */
exports.getOrderStats = async (req, res) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [
            totalOrders,
            totalRevenue,
            pendingOrders,
            processingOrders,
            shippingOrders,
            deliveredOrders,
            cancelledOrders,
            ordersThisMonth,
            revenueThisMonth,
            ordersLastMonth,
            ordersByStatus,
            ordersByPaymentMethod,
            recentOrders
        ] = await Promise.all([
            Order.countDocuments(),
            Order.aggregate([
                { $match: { status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'processing' }),
            Order.countDocuments({ status: 'shipping' }),
            Order.countDocuments({ status: 'delivered' }),
            Order.countDocuments({ status: 'cancelled' }),
            Order.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
            Order.aggregate([
                {
                    $match: {
                        status: 'delivered',
                        createdAt: { $gte: firstDayOfMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.countDocuments({
                createdAt: {
                    $gte: firstDayOfLastMonth,
                    $lte: lastDayOfLastMonth
                }
            }),
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        revenue: { $sum: '$totalAmount' }
                    }
                }
            ]),
            Order.aggregate([
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                        revenue: { $sum: '$totalAmount' }
                    }
                }
            ]),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'username')
                .select('orderNumber totalAmount status createdAt')
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalOrders,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0,
                    ordersThisMonth,
                    revenueThisMonth: revenueThisMonth[0]?.total || 0,
                    ordersLastMonth,
                    growthRate: ordersLastMonth > 0
                        ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth * 100).toFixed(2)
                        : 0
                },
                statusBreakdown: {
                    pending: pendingOrders,
                    processing: processingOrders,
                    shipping: shippingOrders,
                    delivered: deliveredOrders,
                    cancelled: cancelledOrders
                },
                ordersByStatus,
                ordersByPaymentMethod,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Get Order Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê đơn hàng'
        });
    }
};

/**
 * @route   GET /api/orders/user/:userId
 * @desc    Lấy đơn hàng của 1 user
 * @access  Private
 */
exports.getUserOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status
        } = req.query;

        // Build query
        const query = { user: req.params.userId };

        // Chỉ user hoặc admin mới xem được
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem đơn hàng này'
            });
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalOrders: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get User Orders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy đơn hàng'
        });
    }
};

/**
 * @route   PUT /api/orders/:id/admin-note
 * @desc    Thêm ghi chú admin
 * @access  Private/Admin
 */
exports.addAdminNote = async (req, res) => {
    try {
        const { adminNote } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { adminNote },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật ghi chú thành công',
            data: order
        });
    } catch (error) {
        console.error('Add Admin Note Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm ghi chú'
        });
    }
};

// ===================================================================
// USER-FACING METHODS (US-11, US-13, US-14)
// ===================================================================

/**
 * @route   POST /api/orders
 * @desc    Tạo đơn hàng mới (Checkout)
 * @access  Private
 */
exports.createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, customerNote, promotionCode } = req.body;

        // Validate shipping address
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng (họ tên, SĐT, địa chỉ)'
            });
        }

        // Tạo đơn hàng (sử dụng transaction trong orderService)
        const order = await orderService.createOrder(req.user._id, {
            shippingAddress,
            paymentMethod: paymentMethod || 'COD',
            customerNote,
            promotionCode
        });

        // Xử lý thanh toán
        const paymentResult = await paymentService.processPayment(
            order._id,
            paymentMethod || 'COD'
        );

        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công!',
            data: {
                order,
                payment: paymentResult
            }
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi tạo đơn hàng'
        });
    }
};

/**
 * @route   GET /api/orders/my-orders
 * @desc    Lấy danh sách đơn hàng của user hiện tại
 * @access  Private
 */
exports.getMyOrders = async (req, res) => {
    try {
        const result = await orderService.getMyOrders(req.user._id, req.query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get My Orders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng'
        });
    }
};

/**
 * @route   GET /api/orders/my-orders/:id
 * @desc    Lấy chi tiết đơn hàng của user hiện tại
 * @access  Private
 */
exports.getMyOrderDetail = async (req, res) => {
    try {
        const order = await orderService.getMyOrderDetail(req.user._id, req.params.id);

        // Lấy thông tin payment
        const payment = await paymentService.getPaymentByOrder(order._id);

        res.status(200).json({
            success: true,
            data: {
                order,
                payment
            }
        });
    } catch (error) {
        console.error('Get My Order Detail Error:', error);
        res.status(error.message === 'Không tìm thấy đơn hàng' ? 404 : 500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy chi tiết đơn hàng'
        });
    }
};

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    User hủy đơn hàng
 * @access  Private
 */
exports.cancelMyOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await orderService.cancelMyOrder(
            req.user._id,
            req.params.id,
            reason
        );

        res.status(200).json({
            success: true,
            message: 'Đã hủy đơn hàng thành công',
            data: order
        });
    } catch (error) {
        console.error('Cancel My Order Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi hủy đơn hàng'
        });
    }
};