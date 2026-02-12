require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

/**
 * Script tạo dữ liệu giả cho đơn hàng
 * Chạy: node seed-orders.js
 */

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
        process.exit(1);
    }
};

// Danh sách tên khách hàng giả
const customerNames = [
    'Nguyễn Văn An',
    'Trần Thị Bình',
    'Lê Hoàng Cường',
    'Phạm Thu Duyên',
    'Hoàng Minh Đức',
    'Vũ Thị Hoa',
    'Đặng Quốc Khánh',
    'Bùi Thị Lan',
    'Ngô Văn Minh',
    'Đinh Thị Nga'
];

// Danh sách địa chỉ giả
const addresses = [
    { city: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Hàng Bạc', street: '123 Phố Hàng Bạc' },
    { city: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé', street: '456 Đường Nguyễn Huệ' },
    { city: 'Đà Nẵng', district: 'Hải Châu', ward: 'Thạch Thang', street: '789 Đường Trần Phú' },
    { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng', street: '321 Đường Cầu Giấy' },
    { city: 'Hồ Chí Minh', district: 'Quận 3', ward: 'Võ Thị Sáu', street: '654 Đường Võ Văn Tần' },
    { city: 'Cần Thơ', district: 'Ninh Kiều', ward: 'Tân An', street: '987 Đường 30/4' },
    { city: 'Hải Phòng', district: 'Hồng Bàng', ward: 'Hoàng Văn Thụ', street: '147 Đường Lạch Tray' },
    { city: 'Hà Nội', district: 'Đống Đa', ward: 'Láng Thượng', street: '258 Đường Láng' },
    { city: 'Hồ Chí Minh', district: 'Bình Thạnh', ward: 'Phường 1', street: '369 Đường Xô Viết Nghệ Tĩnh' },
    { city: 'Nha Trang', district: 'Nha Trang', ward: 'Vĩnh Hải', street: '741 Đường Trần Phú' }
];

// Tạo số điện thoại giả
const generatePhone = () => {
    return '09' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
};

// Trạng thái đơn hàng
const statuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const paymentMethods = ['COD', 'Banking', 'Momo', 'ZaloPay'];
const paymentStatuses = ['pending', 'paid', 'failed'];

// Tạo ghi chú khách hàng ngẫu nhiên
const customerNotes = [
    'Giao hàng giờ hành chính',
    'Gọi trước khi giao',
    'Để hàng ở bảo vệ',
    'Giao ngoài giờ hành chính',
    null,
    null,
    'Giao buổi sáng',
    'Giao buổi chiều',
    null,
    'Gọi điện trước 30 phút'
];

const seedOrders = async () => {
    try {
        console.log('🔄 Bắt đầu tạo dữ liệu giả cho đơn hàng...\n');

        // Lấy danh sách users và products
        const users = await User.find({ role: 'user' }).limit(10);
        const products = await Product.find({ isActive: true }).limit(20);

        if (users.length === 0) {
            console.log('⚠️  Không tìm thấy user nào. Vui lòng tạo user trước!');
            return;
        }

        if (products.length === 0) {
            console.log('⚠️  Không tìm thấy sản phẩm nào. Vui lòng tạo sản phẩm trước!');
            return;
        }

        console.log(`✅ Tìm thấy ${users.length} users và ${products.length} sản phẩm\n`);

        // Xóa tất cả đơn hàng cũ (nếu có)
        await Order.deleteMany({});
        console.log('🗑️  Đã xóa tất cả đơn hàng cũ\n');

        const orders = [];
        const numberOfOrders = 25; // Tạo 25 đơn hàng

        for (let i = 0; i < numberOfOrders; i++) {
            // Chọn ngẫu nhiên user hoặc tạo thông tin khách hàng mới
            const useExistingUser = users.length > 0 && Math.random() > 0.3;
            const user = useExistingUser ? users[Math.floor(Math.random() * users.length)] : users[0];
            
            // Chọn ngẫu nhiên địa chỉ
            const addressInfo = addresses[i % addresses.length];
            const customerName = customerNames[i % customerNames.length];

            // Chọn ngẫu nhiên 1-5 sản phẩm
            const numberOfItems = Math.floor(Math.random() * 5) + 1;
            const selectedProducts = [];
            const usedProductIds = new Set();

            for (let j = 0; j < numberOfItems; j++) {
                let product;
                do {
                    product = products[Math.floor(Math.random() * products.length)];
                } while (usedProductIds.has(product._id.toString()));
                
                usedProductIds.add(product._id.toString());
                selectedProducts.push(product);
            }

            // Tạo items cho đơn hàng
            const items = selectedProducts.map(product => {
                const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 sản phẩm
                const price = product.price;
                const discount = product.discount || 0;
                const finalPrice = product.finalPrice || price;
                const subtotal = finalPrice * quantity;

                return {
                    product: product._id,
                    productName: product.name,
                    productImage: product.images && product.images.length > 0 
                        ? product.images.find(img => img.isMain)?.url || product.images[0].url
                        : null,
                    quantity,
                    price,
                    discount,
                    finalPrice,
                    subtotal
                };
            });

            // Tính toán giá
            const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 50000) : 0;
            const promotionDiscount = Math.random() > 0.8 ? Math.floor(Math.random() * 30000) : 0;
            const shippingCost = Math.random() > 0.5 ? 30000 : 25000;
            const totalAmount = subtotal - discount - promotionDiscount + shippingCost;

            // Chọn trạng thái và phương thức thanh toán
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            
            let paymentStatus = 'pending';
            if (status === 'delivered') {
                paymentStatus = 'paid';
            } else if (status === 'cancelled') {
                paymentStatus = Math.random() > 0.5 ? 'failed' : 'pending';
            } else if (paymentMethod !== 'COD' && Math.random() > 0.3) {
                paymentStatus = 'paid';
            }

            // Tạo ngày đặt hàng trong 30 ngày qua
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

            // Tạo status history
            const statusHistory = [{
                status: 'pending',
                note: 'Đơn hàng được tạo',
                updatedAt: createdAt
            }];

            if (status !== 'pending') {
                const confirmedAt = new Date(createdAt);
                confirmedAt.setHours(confirmedAt.getHours() + Math.floor(Math.random() * 24));
                statusHistory.push({
                    status: 'confirmed',
                    note: 'Đơn hàng đã được xác nhận',
                    updatedAt: confirmedAt
                });
            }

            if (['processing', 'shipping', 'delivered'].includes(status)) {
                const processingAt = new Date(statusHistory[statusHistory.length - 1].updatedAt);
                processingAt.setHours(processingAt.getHours() + Math.floor(Math.random() * 12));
                statusHistory.push({
                    status: 'processing',
                    note: 'Đang chuẩn bị hàng',
                    updatedAt: processingAt
                });
            }

            if (['shipping', 'delivered'].includes(status)) {
                const shippingAt = new Date(statusHistory[statusHistory.length - 1].updatedAt);
                shippingAt.setHours(shippingAt.getHours() + Math.floor(Math.random() * 24));
                statusHistory.push({
                    status: 'shipping',
                    note: 'Đơn hàng đang được giao',
                    updatedAt: shippingAt
                });
            }

            if (status === 'delivered') {
                const deliveredAt = new Date(statusHistory[statusHistory.length - 1].updatedAt);
                deliveredAt.setHours(deliveredAt.getHours() + Math.floor(Math.random() * 48));
                statusHistory.push({
                    status: 'delivered',
                    note: 'Giao hàng thành công',
                    updatedAt: deliveredAt
                });
            }

            if (status === 'cancelled') {
                const cancelledAt = new Date(createdAt);
                cancelledAt.setHours(cancelledAt.getHours() + Math.floor(Math.random() * 12));
                statusHistory.push({
                    status: 'cancelled',
                    note: 'Khách hàng hủy đơn',
                    updatedAt: cancelledAt
                });
            }

            // Tạo đơn hàng
            const order = {
                user: user._id,
                items,
                subtotal,
                discount,
                promotionDiscount,
                shippingCost,
                totalAmount,
                shippingAddress: {
                    fullName: customerName,
                    phone: generatePhone(),
                    address: `${addressInfo.street}, ${addressInfo.ward}, ${addressInfo.district}, ${addressInfo.city}`,
                    city: addressInfo.city,
                    district: addressInfo.district,
                    ward: addressInfo.ward
                },
                paymentMethod,
                paymentStatus,
                paidAt: paymentStatus === 'paid' ? statusHistory[statusHistory.length - 1].updatedAt : null,
                status,
                statusHistory,
                customerNote: customerNotes[i % customerNotes.length],
                ecoPointsEarned: Math.floor(totalAmount / 10000),
                deliveredAt: status === 'delivered' ? statusHistory[statusHistory.length - 1].updatedAt : null,
                createdAt,
                updatedAt: statusHistory[statusHistory.length - 1].updatedAt
            };

            orders.push(order);
        }

        // Lưu tất cả đơn hàng
        const savedOrders = await Order.insertMany(orders);
        
        console.log(`✅ Đã tạo thành công ${savedOrders.length} đơn hàng!\n`);
        
        // Thống kê
        const stats = {
            pending: savedOrders.filter(o => o.status === 'pending').length,
            confirmed: savedOrders.filter(o => o.status === 'confirmed').length,
            processing: savedOrders.filter(o => o.status === 'processing').length,
            shipping: savedOrders.filter(o => o.status === 'shipping').length,
            delivered: savedOrders.filter(o => o.status === 'delivered').length,
            cancelled: savedOrders.filter(o => o.status === 'cancelled').length,
        };

        console.log('📊 Thống kê đơn hàng:');
        console.log(`   - Chờ xác nhận: ${stats.pending}`);
        console.log(`   - Đã xác nhận: ${stats.confirmed}`);
        console.log(`   - Đang xử lý: ${stats.processing}`);
        console.log(`   - Đang giao: ${stats.shipping}`);
        console.log(`   - Đã giao: ${stats.delivered}`);
        console.log(`   - Đã hủy: ${stats.cancelled}`);
        
        console.log('\n✨ Hoàn thành!');

    } catch (error) {
        console.error('❌ Lỗi khi tạo dữ liệu:', error);
    }
};

const run = async () => {
    await connectDB();
    await seedOrders();
    await mongoose.connection.close();
    console.log('\n👋 Đã đóng kết nối MongoDB');
};

run();
