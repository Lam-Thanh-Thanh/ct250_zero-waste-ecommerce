const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const User = require('../models/User');

/**
 * Order Service
 * Xử lý logic nghiệp vụ cho đơn hàng
 * 
 * Lưu ý: Không sử dụng MongoDB Transaction vì standalone MongoDB
 * không hỗ trợ transaction (chỉ replica set mới hỗ trợ).
 * Thay vào đó sử dụng xử lý tuần tự với rollback thủ công khi có lỗi.
 */
class OrderService {
    /**
     * Tạo đơn hàng mới (Checkout)
     * Xử lý tuần tự: validate → tạo order → trừ stock → tạo payment → xóa cart
     */
    async createOrder(userId, orderData) {
        const { shippingAddress, paymentMethod, customerNote } = orderData;

        // 1. Lấy giỏ hàng của user
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price discount finalPrice stock inStock images isActive'
            });

        if (!cart || cart.items.length === 0) {
            throw new Error('Giỏ hàng trống, không thể đặt hàng');
        }

        // 2. Validate từng sản phẩm trong giỏ & build order items
        const orderItems = [];
        let subtotal = 0;

        for (const cartItem of cart.items) {
            const product = cartItem.product;

            if (!product) {
                throw new Error('Một số sản phẩm không còn tồn tại');
            }
            if (!product.isActive) {
                throw new Error(`Sản phẩm "${product.name}" đã ngừng kinh doanh`);
            }
            if (!product.inStock || product.stock < cartItem.quantity) {
                throw new Error(
                    `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho`
                );
            }

            const price = product.price;
            const discount = product.discount || 0;
            const finalPrice = product.finalPrice || (price - (price * discount / 100));
            const itemSubtotal = finalPrice * cartItem.quantity;

            // Lấy ảnh chính
            const mainImage = product.images && product.images.length > 0
                ? (product.images.find(img => img.isMain) || product.images[0]).url
                : null;

            orderItems.push({
                product: product._id,
                productName: product.name,
                productImage: mainImage,
                quantity: cartItem.quantity,
                price: price,
                discount: discount,
                finalPrice: finalPrice,
                subtotal: itemSubtotal
            });

            subtotal += itemSubtotal;
        }

        // 3. Tính phí vận chuyển
        const shippingCost = this._calculateShippingCost(subtotal, shippingAddress);

        // 4. Tính tổng tiền
        const totalAmount = subtotal + shippingCost;

        // 5. Tính eco points (1 point / 100.000 VND)
        const ecoPointsEarned = Math.floor(totalAmount / 100000);

        // 6. Tạo đơn hàng
        const savedOrder = await Order.create({
            user: userId,
            items: orderItems,
            subtotal,
            shippingCost,
            discount: 0,
            totalAmount,
            shippingAddress: {
                fullName: shippingAddress.fullName,
                phone: shippingAddress.phone,
                address: shippingAddress.address,
                city: shippingAddress.city || '',
                district: shippingAddress.district || '',
                ward: shippingAddress.ward || '',
                note: shippingAddress.note || ''
            },
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: 'pending',
            status: 'pending',
            statusHistory: [{
                status: 'pending',
                note: 'Đơn hàng mới được tạo',
                updatedBy: userId,
                updatedAt: new Date()
            }],
            ecoPointsEarned,
            customerNote: customerNote || '',
            deliveryEstimate: this._calculateDeliveryEstimate()
        });

        // 7. Trừ stock cho từng sản phẩm
        for (const item of orderItems) {
            const updateResult = await Product.findOneAndUpdate(
                {
                    _id: item.product,
                    stock: { $gte: item.quantity } // Double-check stock
                },
                {
                    $inc: { stock: -item.quantity }
                },
                { new: true }
            );

            if (!updateResult) {
                // Rollback: xóa order vừa tạo nếu trừ stock thất bại
                await Order.findByIdAndDelete(savedOrder._id);
                throw new Error(`Sản phẩm "${item.productName}" hết hàng trong quá trình xử lý`);
            }

            // Cập nhật inStock nếu hết hàng
            if (updateResult.stock === 0) {
                updateResult.inStock = false;
                await updateResult.save();
            }
        }

        // 8. Tạo Payment record
        await Payment.create({
            order: savedOrder._id,
            method: paymentMethod || 'COD',
            amount: totalAmount,
            status: 'pending'
        });

        // 9. Xóa giỏ hàng
        cart.items = [];
        await cart.save();

        // 10. Cập nhật totalOrders cho user
        await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1 } });

        return savedOrder;
    }

    /**
     * Lấy danh sách đơn hàng của user
     */
    async getMyOrders(userId, filters = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'createdAt',
            order = 'desc'
        } = filters;

        const query = { user: userId };

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(query)
        ]);

        return {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalOrders: total,
                limit: parseInt(limit)
            }
        };
    }

    /**
     * Lấy chi tiết đơn hàng của user (kiểm tra ownership)
     */
    async getMyOrderDetail(userId, orderId) {
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        }).populate('user', 'username email phone');

        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        return order;
    }

    /**
     * User hủy đơn hàng (chỉ cho phép khi đang pending hoặc confirmed)
     * Xử lý tuần tự không dùng transaction
     */
    async cancelMyOrder(userId, orderId, reason) {
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        // Chỉ cho phép hủy khi đang pending hoặc confirmed
        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new Error(
                `Không thể hủy đơn hàng ở trạng thái "${order.status}". Chỉ có thể hủy khi đơn đang chờ xử lý hoặc đã xác nhận.`
            );
        }

        // Cập nhật trạng thái đơn hàng
        order.status = 'cancelled';
        order.cancelReason = reason || 'Khách hàng hủy đơn';
        order.cancelledBy = userId;
        order.cancelledAt = new Date();

        // Thêm vào lịch sử trạng thái
        order.statusHistory.push({
            status: 'cancelled',
            note: reason || 'Khách hàng hủy đơn',
            updatedBy: userId,
            updatedAt: new Date()
        });

        await order.save();

        // Hoàn lại stock cho từng sản phẩm
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: { stock: item.quantity },
                    $set: { inStock: true }
                }
            );
        }

        // Cập nhật Payment status
        await Payment.findOneAndUpdate(
            { order: orderId },
            { status: 'failed' }
        );

        return order;
    }

    /**
     * Tính phí vận chuyển
     */
    _calculateShippingCost(subtotal, shippingAddress) {
        // Miễn phí ship cho đơn hàng >= 500.000 VND
        if (subtotal >= 500000) {
            return 0;
        }

        // Phí ship cơ bản theo khu vực
        const city = (shippingAddress.city || '').toLowerCase();

        if (city.includes('hồ chí minh') || city.includes('hcm') || city.includes('tp.hcm')) {
            return 25000; // Nội thành HCM
        } else if (city.includes('hà nội') || city.includes('đà nẵng')) {
            return 30000; // HN, ĐN
        }

        return 35000; // Tỉnh thành khác
    }

    /**
     * Tính ngày giao hàng dự kiến (3-5 ngày)
     */
    _calculateDeliveryEstimate() {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 ngày
        return deliveryDate;
    }
}

module.exports = new OrderService();
