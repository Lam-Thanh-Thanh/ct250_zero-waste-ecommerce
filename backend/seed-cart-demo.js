/**
 * Seed Cart Demo Data
 * Tạo dữ liệu giỏ hàng mẫu cho user "nguyenvana" (vana@gmail.com)
 * Để user có thể demo luồng: Cart → Checkout → Order History
 * 
 * Chạy: cd backend && node seed-cart-demo.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const seedCartDemo = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('./src/models/User');
    const Product = require('./src/models/Product');
    const Cart = require('./src/models/Cart');
    const Payment = require('./src/models/Payment');

    // 1. Tìm user nguyenvana
    const user = await User.findOne({ email: 'vana@gmail.com' });
    if (!user) {
        console.error('❌ Không tìm thấy user vana@gmail.com. Hãy chạy seed-data.js trước!');
        process.exit(1);
    }
    console.log(`\n👤 User: ${user.username} (${user.email})`);

    // 2. Lấy một số sản phẩm để thêm vào giỏ
    const products = await Product.find({ isActive: true }).limit(4);
    if (products.length === 0) {
        console.error('❌ Không có sản phẩm nào. Hãy chạy seed-data.js trước!');
        process.exit(1);
    }

    // 3. Tạo giỏ hàng cho user
    console.log('\n🛒 Tạo giỏ hàng mẫu...');
    await Cart.deleteOne({ user: user._id }); // Xóa giỏ cũ nếu có

    const cartItems = products.slice(0, 3).map((product, idx) => ({
        product: product._id,
        quantity: idx + 1 // 1, 2, 3
    }));

    const cart = await Cart.create({
        user: user._id,
        items: cartItems
    });

    // Populate để hiển thị
    const populatedCart = await Cart.findById(cart._id).populate({
        path: 'items.product',
        select: 'name price discount finalPrice stock'
    });

    console.log('   ✅ Giỏ hàng tạo thành công với:');
    let total = 0;
    for (const item of populatedCart.items) {
        const itemTotal = (item.product.finalPrice || item.product.price) * item.quantity;
        total += itemTotal;
        console.log(`      - ${item.product.name} x${item.quantity} = ${itemTotal.toLocaleString('vi-VN')}đ`);
    }
    console.log(`      💰 Tổng tạm tính: ${total.toLocaleString('vi-VN')}đ`);

    // 4. Tạo Payment records cho các đơn hàng cũ (nếu chưa có)
    console.log('\n💳 Kiểm tra & tạo Payment cho đơn hàng mẫu...');
    const Order = require('./src/models/Order');
    const orders = await Order.find({});
    let paymentCount = 0;

    for (const order of orders) {
        const existingPayment = await Payment.findOne({ order: order._id });
        if (!existingPayment) {
            await Payment.create({
                order: order._id,
                method: order.paymentMethod,
                amount: order.totalAmount,
                status: order.paymentStatus === 'paid' ? 'paid' : 'pending',
                paidAt: order.paidAt || null,
                transactionId: order.paymentStatus === 'paid' 
                    ? `${order.paymentMethod.toUpperCase()}-SEED${String(paymentCount + 1).padStart(4, '0')}`
                    : null
            });
            paymentCount++;
        }
    }
    console.log(`   ✅ Tạo ${paymentCount} payment records`);

    // ===== SUMMARY =====
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED DEMO DATA HOÀN TẤT!');
    console.log('='.repeat(50));
    console.log(`\n📱 Hướng dẫn test:`);
    console.log(`   1. Mở trình duyệt: http://localhost:5173`);
    console.log(`   2. Đăng nhập: vana@gmail.com / 123456`);
    console.log(`   3. Trang chủ: Xem sản phẩm, bấm "Thêm vào giỏ"`);
    console.log(`   4. Giỏ hàng (/cart): Xem ${cartItems.length} sản phẩm đã thêm sẵn`);
    console.log(`   5. Checkout (/checkout): Điền thông tin → Đặt hàng`);
    console.log(`   6. Đơn hàng (/orders): Xem lịch sử & theo dõi trạng thái`);
    console.log(`\n💡 Tips:`);
    console.log(`   - Giỏ hàng đã có ${cartItems.length} sản phẩm sẵn để demo checkout`);
    console.log(`   - Có thể thêm/xóa/thay đổi số lượng trên trang giỏ hàng`);
    console.log(`   - Chọn COD để đặt hàng nhanh nhất`);
    console.log(`   - Chọn Banking/Momo/etc sẽ tự động đánh dấu "Đã thanh toán"`);

    process.exit(0);
};

seedCartDemo().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
