require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedAll = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Category = require('./src/models/Category');
    const User = require('./src/models/User');
    const Packaging = require('./src/models/Packaging');
    const Certificate = require('./src/models/Certificate');
    const Product = require('./src/models/Product');

    // ========== 1. CATEGORIES (10) ==========
    console.log('\n📁 Seeding Categories...');
    await Category.deleteMany({});

    const categoriesData = [
        { name: 'Chai lọ tái chế', description: 'Các loại chai lọ làm từ vật liệu tái chế, thân thiện môi trường', image: { url: '/images/categories/category-1.jpg', publicId: 'local' } },
        { name: 'Túi vải & Túi sinh thái', description: 'Túi vải canvas, túi đay, túi tái sử dụng thay thế túi nhựa', image: { url: '/images/categories/category-2.jpg', publicId: 'local' } },
        { name: 'Dụng cụ nhà bếp', description: 'Dụng cụ nấu ăn, bảo quản thực phẩm bằng vật liệu tự nhiên', image: { url: '/images/categories/category-3.jpg', publicId: 'local' } },
        { name: 'Chăm sóc cá nhân', description: 'Sản phẩm vệ sinh, chăm sóc cơ thể không chứa hóa chất độc hại', image: { url: '/images/categories/category-4.jpg', publicId: 'local' } },
        { name: 'Ống hút & Ly tái chế', description: 'Ống hút tre, inox, thủy tinh và ly giữ nhiệt tái sử dụng', image: { url: '/images/categories/category-5.jpg', publicId: 'local' } },
        { name: 'Hộp đựng thực phẩm', description: 'Hộp inox, thủy tinh, silicone thay thế hộp nhựa dùng một lần', image: { url: '/images/categories/category-6.jpg', publicId: 'local' } },
        { name: 'Sản phẩm tre & Gỗ', description: 'Bàn chải, dao kéo, dụng cụ gia đình làm từ tre và gỗ tự nhiên', image: { url: '/images/categories/category-7.jpg', publicId: 'local' } },
        { name: 'Quần áo bền vững', description: 'Trang phục từ cotton hữu cơ, sợi tái chế, vải tự nhiên', image: { url: '/images/categories/category-8.jpg', publicId: 'local' } },
        { name: 'Vệ sinh nhà cửa', description: 'Chất tẩy rửa sinh học, dụng cụ vệ sinh tái sử dụng', image: { url: '/images/categories/category-9.jpg', publicId: 'local' } },
        { name: 'Phụ kiện & Quà tặng xanh', description: 'Phụ kiện thời trang và quà tặng thân thiện môi trường', image: { url: '/images/categories/category-10.jpg', publicId: 'local' } }
    ];
    const categories = [];
    for (const data of categoriesData) {
        categories.push(await Category.create(data));
    }
    console.log(`   ✅ Created ${categories.length} categories`);

    // ========== 2. USERS (10) ==========
    console.log('\n👥 Seeding Users...');
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = await User.insertMany([
        { username: 'admin', email: 'admin@zerowaste.vn', password: hashedPassword, role: 'admin', phone: '0901234567', address: 'TP. Hồ Chí Minh', isActive: true },
        { username: 'Nguyễn Văn A', email: 'vana@gmail.com', password: hashedPassword, role: 'user', phone: '0912345678', address: 'Quận 1, TP.HCM', isActive: true },
        { username: 'Nguyễn Văn B', email: 'vanb@gmail.com', password: hashedPassword, role: 'user', phone: '0923456789', address: 'Quận 3, TP.HCM', isActive: true },
        { username: 'Nguyễn Văn C', email: 'vanc@gmail.com', password: hashedPassword, role: 'user', phone: '0934567890', address: 'Quận 7, TP.HCM', isActive: true },
        { username: 'Nguyễn Văn D', email: 'vand@gmail.com', password: hashedPassword, role: 'user', phone: '0945678901', address: 'Quận Bình Thạnh, TP.HCM', isActive: true },
        { username: 'Nguyễn Văn E', email: 'vane@gmail.com', password: hashedPassword, role: 'user', phone: '0956789012', address: 'TP. Đà Nẵng', isActive: true },
        { username: 'Nguyễn Văn F', email: 'vanf@gmail.com', password: hashedPassword, role: 'user', phone: '0967890123', address: 'TP. Hà Nội', isActive: true },
        { username: 'Nguyễn Văn G', email: 'vang@gmail.com', password: hashedPassword, role: 'user', phone: '0978901234', address: 'TP. Cần Thơ', isActive: true },
        { username: 'Nguyễn Văn H', email: 'vanh@gmail.com', password: hashedPassword, role: 'user', phone: '0989012345', address: 'TP. Huế', isActive: true },
        { username: 'admin2', email: 'admin2@zerowaste.vn', password: hashedPassword, role: 'admin', phone: '0990123456', address: 'Quận 2, TP.HCM', isActive: true }
    ]);
    console.log(`   ✅ Created ${users.length} users`);

    // ========== 3. PACKAGINGS (10) ==========
    console.log('\n📦 Seeding Packagings...');
    await Packaging.deleteMany({});

    const packagings = await Packaging.insertMany([
        { name: 'Giấy tái chế 100%', material: 'Giấy Kraft tái chế', description: 'Bao bì giấy tái chế hoàn toàn, có thể phân hủy sinh học', isBiodegradable: true, isReusable: false, isRecyclable: true, decompositionTime: 60, isActive: true },
        { name: 'Hộp carton sóng', material: 'Giấy carton sóng', description: 'Hộp đóng gói chắc chắn, bảo vệ sản phẩm khi vận chuyển', isBiodegradable: true, isReusable: true, isRecyclable: true, decompositionTime: 90, isActive: true },
        { name: 'Túi vải cotton', material: 'Vải cotton hữu cơ', description: 'Túi vải dùng nhiều lần, có thể giặt và tái sử dụng', isBiodegradable: true, isReusable: true, isRecyclable: false, decompositionTime: 180, isActive: true },
        { name: 'Bao bì bắp', material: 'Tinh bột bắp', description: 'Bao bì sinh học từ tinh bột bắp, phân hủy nhanh', isBiodegradable: true, isReusable: false, isRecyclable: false, decompositionTime: 30, isActive: true },
        { name: 'Giấy sáp ong', material: 'Vải cotton + Sáp ong', description: 'Giấy gói thực phẩm tái sử dụng từ sáp ong tự nhiên', isBiodegradable: true, isReusable: true, isRecyclable: false, decompositionTime: 120, isActive: true },
        { name: 'Lá chuối khô', material: 'Lá chuối tự nhiên', description: 'Đóng gói bằng lá chuối, truyền thống và thân thiện', isBiodegradable: true, isReusable: false, isRecyclable: false, decompositionTime: 14, isActive: true },
        { name: 'Hộp tre đan', material: 'Tre tự nhiên', description: 'Hộp đựng thủ công từ tre, chắc chắn và tái sử dụng', isBiodegradable: true, isReusable: true, isRecyclable: false, decompositionTime: 365, isActive: true },
        { name: 'Túi giấy dầu', material: 'Giấy không tẩy trắng', description: 'Túi giấy chống thấm dầu, phù hợp đựng thực phẩm', isBiodegradable: true, isReusable: false, isRecyclable: true, decompositionTime: 45, isActive: true },
        { name: 'Bao bì rong biển', material: 'Rong biển tự nhiên', description: 'Bao bì ăn được từ rong biển, phân hủy hoàn toàn', isBiodegradable: true, isReusable: false, isRecyclable: false, decompositionTime: 7, isActive: true },
        { name: 'Túi lưới cotton', material: 'Cotton hữu cơ', description: 'Túi lưới đựng rau củ, nhẹ và tái sử dụng nhiều lần', isBiodegradable: true, isReusable: true, isRecyclable: false, decompositionTime: 150, isActive: true }
    ]);
    console.log(`   ✅ Created ${packagings.length} packagings`);

    // ========== 4. CERTIFICATES (10) ==========
    console.log('\n🏅 Seeding Certificates...');
    await Certificate.deleteMany({});

    const certificates = await Certificate.insertMany([
        { name: 'FSC Certified', organization: 'Forest Stewardship Council', description: 'Chứng chỉ quản lý rừng bền vững, đảm bảo nguồn gỗ và giấy có trách nhiệm', issuedDate: new Date('2023-01-15'), image: { url: '/images/certificates/cert-1.jpg', publicId: 'local' }, isActive: true },
        { name: 'GOTS Organic', organization: 'Global Organic Textile Standard', description: 'Tiêu chuẩn dệt may hữu cơ toàn cầu, đảm bảo sợi tự nhiên', issuedDate: new Date('2023-03-20'), image: { url: '/images/certificates/cert-2.jpg', publicId: 'local' }, isActive: true },
        { name: 'Fair Trade', organization: 'Fairtrade International', description: 'Chứng nhận thương mại công bằng, hỗ trợ người sản xuất nhỏ', issuedDate: new Date('2022-11-10'), image: { url: '/images/certificates/cert-3.jpg', publicId: 'local' }, isActive: true },
        { name: 'USDA Organic', organization: 'United States Department of Agriculture', description: 'Chứng nhận hữu cơ theo tiêu chuẩn Bộ Nông nghiệp Hoa Kỳ', issuedDate: new Date('2023-06-01'), image: { url: '/images/certificates/cert-4.jpg', publicId: 'local' }, isActive: true },
        { name: 'EU Ecolabel', organization: 'European Commission', description: 'Nhãn sinh thái Châu Âu cho sản phẩm thân thiện môi trường', issuedDate: new Date('2023-02-28'), image: { url: '/images/certificates/cert-5.jpg', publicId: 'local' }, isActive: true },
        { name: 'Rainforest Alliance', organization: 'Rainforest Alliance', description: 'Chứng nhận bảo vệ rừng nhiệt đới và đa dạng sinh học', issuedDate: new Date('2022-09-15'), image: { url: '/images/certificates/cert-6.jpg', publicId: 'local' }, isActive: true },
        { name: 'Cradle to Cradle', organization: 'Cradle to Cradle Products Innovation Institute', description: 'Chứng nhận thiết kế sản phẩm tuần hoàn, an toàn cho con người và môi trường', issuedDate: new Date('2023-04-10'), image: { url: '/images/certificates/cert-7.jpg', publicId: 'local' }, isActive: true },
        { name: 'B Corp', organization: 'B Lab', description: 'Chứng nhận doanh nghiệp có tác động tích cực đến xã hội và môi trường', issuedDate: new Date('2023-07-22'), image: { url: '/images/certificates/cert-8.jpg', publicId: 'local' }, isActive: true },
        { name: 'OEKO-TEX Standard 100', organization: 'OEKO-TEX Association', description: 'Kiểm tra chất độc hại trong sản phẩm dệt may, đảm bảo an toàn sức khỏe', issuedDate: new Date('2023-05-18'), image: { url: '/images/certificates/cert-9.jpg', publicId: 'local' }, isActive: true },
        { name: 'Green Seal', organization: 'Green Seal Inc.', description: 'Chứng nhận sản phẩm xanh tiêu chuẩn Bắc Mỹ', issuedDate: new Date('2022-12-05'), image: { url: '/images/certificates/cert-10.jpg', publicId: 'local' }, isActive: true }
    ]);
    console.log(`   ✅ Created ${certificates.length} certificates`);

    // ========== 5. PRODUCTS (10) ==========
    console.log('\n🛍️  Seeding Products...');
    await Product.deleteMany({});

    const productsData = [
        {
            name: 'Bình nước tre 500ml',
            description: 'Bình nước làm từ tre tự nhiên, giữ nhiệt tốt, không chứa BPA. Thiết kế gọn nhẹ, phù hợp mang đi học và đi làm.',
            shortDescription: 'Bình nước tre tự nhiên 500ml, giữ nhiệt',
            price: 250000, discount: 10, stock: 50,
            category: categories[0]._id,
            packaging: packagings[6]._id,
            certificates: [certificates[0]._id],
            images: [{ url: '/images/products/product-1.jpg', publicId: 'local', isMain: true }, { url: '/images/products/product-1-sub.jpg', publicId: 'local', isMain: false }],
            isNaturalMaterial: true, isReusable: true, isBiodegradable: true, hasRefill: false,
            materials: ['Tre tự nhiên', 'Nắp inox 304'],
            isFeatured: true, isActive: true
        },
        {
            name: 'Túi vải canvas A4',
            description: 'Túi vải canvas 100% cotton hữu cơ, kích thước A4, phù hợp đi chợ, đi học. Có thể giặt bằng máy.',
            shortDescription: 'Túi vải canvas organic, kích thước A4',
            price: 89000, discount: 0, stock: 120,
            category: categories[1]._id,
            packaging: packagings[2]._id,
            certificates: [certificates[1]._id, certificates[2]._id],
            images: [{ url: '/images/products/product-2.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: true, isReusable: true, isBiodegradable: true, hasRefill: false,
            materials: ['Cotton hữu cơ GOTS'],
            isFeatured: true, isActive: true
        },
        {
            name: 'Bộ ống hút tre (10 chiếc)',
            description: 'Bộ 10 ống hút tre tự nhiên, đi kèm cọ rửa. Thay thế ống hút nhựa, phân hủy hoàn toàn trong tự nhiên.',
            shortDescription: 'Bộ 10 ống hút tre kèm cọ rửa',
            price: 65000, discount: 5, stock: 200,
            category: categories[4]._id,
            packaging: packagings[0]._id,
            certificates: [certificates[5]._id],
            images: [{ url: '/images/products/product-3.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: true, isReusable: true, isBiodegradable: true, hasRefill: false,
            materials: ['Tre rừng trồng'],
            isFeatured: false, isActive: true
        },
        {
            name: 'Hộp cơm inox 3 ngăn',
            description: 'Hộp cơm inox 304 cao cấp 3 ngăn, chống rò rỉ, giữ nhiệt tốt. An toàn cho lò vi sóng (bỏ nắp).',
            shortDescription: 'Hộp cơm inox 304 ba ngăn, chống rò rỉ',
            price: 320000, discount: 15, stock: 35,
            category: categories[5]._id,
            packaging: packagings[1]._id,
            certificates: [certificates[8]._id],
            images: [{ url: '/images/products/product-4.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: false, isReusable: true, isBiodegradable: false, hasRefill: false,
            materials: ['Inox 304', 'Silicone food-grade'],
            isFeatured: true, isActive: true
        },
        {
            name: 'Bàn chải tre',
            description: 'Bàn chải đánh răng làm từ tre, lông chải mềm bằng nylon phân hủy sinh học. Thiết kế ergonomic.',
            shortDescription: 'Bàn chải đánh răng tre, lông mềm',
            price: 35000, discount: 0, stock: 300,
            category: categories[6]._id,
            packaging: packagings[0]._id,
            certificates: [certificates[6]._id],
            images: [{ url: '/images/products/product-5.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: true, isReusable: false, isBiodegradable: true, hasRefill: false,
            materials: ['Tre Moso', 'Nylon phân hủy sinh học'],
            isFeatured: false, isActive: true
        },
        {
            name: 'Dầu gội dạng thanh (Shampoo Bar)',
            description: 'Dầu gội dạng thanh 60g, không chai nhựa, thành phần tự nhiên. Lên bọt tốt, phù hợp mọi loại tóc.',
            shortDescription: 'Dầu gội dạng thanh 60g, thành phần tự nhiên',
            price: 120000, discount: 0, stock: 80,
            category: categories[3]._id,
            packaging: packagings[7]._id,
            certificates: [certificates[3]._id, certificates[4]._id],
            images: [{ url: '/images/products/product-6.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: true, isReusable: false, isBiodegradable: true, hasRefill: false,
            materials: ['Dầu dừa', 'Bơ hạt mỡ', 'Tinh dầu bưởi'],
            isFeatured: true, isActive: true
        },
        {
            name: 'Giấy gói sáp ong (set 3)',
            description: 'Set 3 miếng giấy gói sáp ong kích thước S/M/L, dùng thay màng bọc thực phẩm. Sử dụng lại đến 1 năm.',
            shortDescription: 'Set 3 miếng giấy sáp ong thay thế màng bọc',
            price: 180000, discount: 20, stock: 45,
            category: categories[2]._id,
            packaging: packagings[4]._id,
            certificates: [certificates[2]._id],
            images: [{ url: '/images/products/product-7.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: true, isReusable: true, isBiodegradable: true, hasRefill: false,
            materials: ['Vải cotton', 'Sáp ong', 'Nhựa thông', 'Dầu jojoba'],
            isFeatured: false, isActive: true
        },
        {
            name: 'Nước rửa chén hữu cơ (refill 1L)',
            description: 'Nước rửa chén gốc thực vật 1L, không paraben, không SLS. Dạng refill túi giảm 80% nhựa.',
            shortDescription: 'Nước rửa chén hữu cơ dạng refill 1 lít',
            price: 95000, discount: 0, stock: 60,
            category: categories[8]._id,
            packaging: packagings[3]._id,
            certificates: [certificates[4]._id, certificates[9]._id],
            images: [{ url: '/images/products/product-8.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: true, isReusable: false, isBiodegradable: true, hasRefill: true,
            materials: ['Chiết xuất bồ hòn', 'Tinh dầu chanh'],
            isFeatured: false, isActive: true
        },
        {
            name: 'Áo thun cotton hữu cơ',
            description: 'Áo thun basic làm từ 100% cotton hữu cơ GOTS, nhuộm màu tự nhiên. Mềm mại, thoáng mát.',
            shortDescription: 'Áo thun basic 100% cotton hữu cơ',
            price: 350000, discount: 10, stock: 25,
            category: categories[7]._id,
            packaging: packagings[2]._id,
            certificates: [certificates[1]._id, certificates[8]._id],
            images: [{ url: '/images/products/product-9.jpg', publicId: 'local', isMain: true }],
            isNaturalMaterial: true, isReusable: true, isBiodegradable: true, hasRefill: false,
            materials: ['Cotton hữu cơ GOTS', 'Phẩm nhuộm tự nhiên'],
            isFeatured: true, isActive: true
        },
        {
            name: 'Ly giữ nhiệt inox 350ml',
            description: 'Ly giữ nhiệt inox 304 dung tích 350ml, giữ nóng 6h / lạnh 12h. Nắp chống tràn, kèm ống hút inox.',
            shortDescription: 'Ly giữ nhiệt inox 350ml kèm ống hút',
            price: 280000, discount: 5, stock: 70,
            category: categories[4]._id,
            packaging: packagings[1]._id,
            certificates: [certificates[6]._id, certificates[7]._id],
            images: [{ url: '/images/products/product-10.jpg', publicId: 'local', isMain: true }, { url: '/images/products/product-10-sub.jpg', publicId: 'local', isMain: false }, { url: '/images/products/product-10-sub2.jpg', publicId: 'local', isMain: false }],
            isNaturalMaterial: false, isReusable: true, isBiodegradable: false, hasRefill: false,
            materials: ['Inox 304', 'Silicone nắp'],
            isFeatured: false, isActive: true
        }
    ];
    const products = [];
    for (const data of productsData) {
        products.push(await Product.create(data));
    }
    console.log(`   ✅ Created ${products.length} products`);

    // ========== 6. ORDERS (10) ==========
    console.log('\n🛒 Seeding Orders...');
    const Order = require('./src/models/Order');
    await Order.deleteMany({});

    const regularUsers = users.filter(u => u.role === 'user'); // 8 users

    const ordersData = [];
    // Random span from Dec 1, 2025 to Mar 31, 2026
    const startTimestamp = new Date('2025-11-01T00:00:00Z').getTime();
    const endTimestamp = new Date('2026-03-21T23:59:59Z').getTime();
    const baseDateStr = new Date('2026-03-15').toISOString().slice(0, 10).replace(/-/g, ''); // Cố định prefix mã đơn

    // Seed function to produce deterministic random numbers
    let randSeed = 42;
    const nextRandom = () => {
        randSeed = (randSeed * 9301 + 49297) % 233280;
        return randSeed / 233280;
    };

    for (let i = 0; i < 100; i++) {
        const orderNumber = `ORD${baseDateStr}${String(i + 1).padStart(5, '0')}`;
        const randomTime = startTimestamp + nextRandom() * (endTimestamp - startTimestamp);
        const createdAt = new Date(randomTime);

        // Pick random user deterministically
        const u = regularUsers[Math.floor(nextRandom() * regularUsers.length)];
        // Pick 1-3 random products
        const itemsCount = Math.floor(nextRandom() * 3) + 1;
        const items = [];
        let subtotal = 0;

        // Shuffle products deterministically
        const shuffledProducts = [...products].sort(() => 0.5 - nextRandom());

        for (let j = 0; j < itemsCount; j++) {
            const p = shuffledProducts[j];
            const quantity = Math.floor(nextRandom() * 3) + 1;
            const finalPrice = p.price * (1 - p.discount / 100);
            const itemSubtotal = finalPrice * quantity;

            items.push({
                product: p._id,
                productName: p.name,
                quantity: quantity,
                price: p.price,
                discount: p.discount,
                finalPrice: finalPrice,
                subtotal: itemSubtotal
            });
            subtotal += itemSubtotal;
        }

        const shippingCost = 30000;
        const discount = nextRandom() > 0.8 ? 20000 : 0; // 20% chance for a discount
        const totalAmount = subtotal + shippingCost - discount;
        const paymentMethods = ['COD', 'Momo', 'VNPay'];
        const pm = paymentMethods[Math.floor(nextRandom() * paymentMethods.length)];
        const statuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];

        // Bias towards delivered (75%)
        let r = nextRandom();
        let status = 'delivered';
        if (r > 0.75 && r < 0.8) status = 'pending';
        else if (r >= 0.8 && r < 0.85) status = 'confirmed';
        else if (r >= 0.85 && r < 0.9) status = 'shipping';
        else if (r >= 0.9) status = 'cancelled';

        const paymentStatus = status === 'delivered' || pm !== 'COD' ? 'paid' : 'pending';

        ordersData.push({
            orderNumber,
            user: u._id,
            items,
            subtotal,
            shippingCost,
            discount,
            totalAmount,
            shippingAddress: {
                fullName: u.username,
                phone: u.phone,
                address: u.address,
                city: 'TP. HCM',
                district: 'Quận 1',
                ward: 'Phường Bến Nghé'
            },
            paymentMethod: pm,
            paymentStatus,
            status,
            createdAt,
            updatedAt: createdAt
        });
    }

    const orders = await Order.insertMany(ordersData);
    console.log(`   ✅ Created ${orders.length} orders (Nov 2025 - Mar 2026)`);

    // ========== 7. REVIEWS (10) ==========
    console.log('\n⭐ Seeding Reviews...');
    const Review = require('./src/models/Review');
    await Review.deleteMany({});

    const reviewsData = [
        { product: products[0]._id, user: regularUsers[0]._id, rating: 5, comment: 'Bình nước tre rất đẹp, giữ nhiệt tốt. Thiết kế tự nhiên, cầm rất thoải mái!', status: 'approved', verifiedPurchase: true },
        { product: products[1]._id, user: regularUsers[1]._id, rating: 4, comment: 'Túi vải chất lượng tốt, may chắc chắn. Hơi nhỏ so với mong đợi nhưng vẫn đẹp.', status: 'approved', verifiedPurchase: true },
        { product: products[2]._id, user: regularUsers[2]._id, rating: 5, comment: 'Ống hút tre rất thích! Con tôi rất thích, không còn dùng ống hút nhựa nữa.', status: 'approved', verifiedPurchase: true },
        { product: products[3]._id, user: regularUsers[3]._id, rating: 4, comment: 'Hộp cơm inox chắc chắn, không rò rỉ. Hơi nặng nhưng bền lắm.', status: 'approved', verifiedPurchase: true },
        { product: products[4]._id, user: regularUsers[4]._id, rating: 5, comment: 'Bàn chải tre mềm mại, chải sạch răng. Cán cầm vừa tay, rất thích!', status: 'pending', verifiedPurchase: true },
        { product: products[5]._id, user: regularUsers[5]._id, rating: 3, comment: 'Shampoo bar tạm ổn, lên bọt ít hơn dầu gội bình thường. Cần quen dần.', status: 'pending', verifiedPurchase: false },
        { product: products[6]._id, user: regularUsers[6]._id, rating: 5, comment: 'Giấy sáp ong tuyệt vời! Dùng bọc trái cây, bánh mì rất tiện. Sẽ mua thêm.', status: 'approved', verifiedPurchase: true },
        { product: products[7]._id, user: regularUsers[0]._id, rating: 4, comment: 'Nước rửa chén hữu cơ rửa sạch, mùi chanh dễ chịu. Dạng refill rất tiết kiệm.', status: 'approved', verifiedPurchase: false },
        { product: products[8]._id, user: regularUsers[1]._id, rating: 5, comment: 'Áo thun cotton hữu cơ mặc rất mát, vải mềm. Nhuộm tự nhiên nên màu nhẹ nhàng.', status: 'pending', verifiedPurchase: true },
        { product: products[9]._id, user: regularUsers[2]._id, rating: 2, comment: 'Ly giữ nhiệt bị trầy xước khi giao hàng. Chức năng giữ nhiệt thì tốt.', status: 'rejected', adminNote: 'Lỗi vận chuyển, không phải lỗi sản phẩm. Đã hỗ trợ đổi mới.' }
    ];

    const reviews = [];
    for (const reviewData of reviewsData) {
        const review = await Review.create(reviewData);
        reviews.push(review);
    }
    console.log(`   ✅ Created ${reviews.length} reviews`);

    // ========== 8. BANNERS (10) ==========
    console.log('\n🖼️  Seeding Banners...');
    const Banner = require('./src/models/Banner');
    await Banner.deleteMany({});

    const banners = await Banner.insertMany([
        { title: 'Sống Xanh Mỗi Ngày', subtitle: 'Khám phá bộ sưu tập sản phẩm thân thiện môi trường mới nhất', image: '/images/banners/banner-1.jpg', link: '/products', buttonText: 'Mua ngay', order: 1, isActive: true },
        { title: 'Giảm 20% Túi Vải Canvas', subtitle: 'Thay thế túi nhựa bằng túi vải bền đẹp — Ưu đãi có hạn!', image: '/images/banners/banner-2.jpg', link: '/products?category=tui-vai', buttonText: 'Xem ưu đãi', order: 2, isActive: true },
        { title: 'Zero Waste Kitchen', subtitle: 'Dụng cụ nhà bếp thân thiện môi trường cho gia đình bạn', image: '/images/banners/banner-3.jpg', link: '/products?category=dung-cu-nha-bep', buttonText: 'Khám phá', order: 3, isActive: true },
        { title: 'Chăm Sóc Bản Thân — Chăm Sóc Trái Đất', subtitle: 'Mỹ phẩm thiên nhiên, không hóa chất độc hại', image: '/images/banners/banner-4.jpg', link: '/products?category=cham-soc-ca-nhan', buttonText: 'Tìm hiểu', order: 4, isActive: true },
        { title: 'Bộ Sưu Tập Tre & Gỗ', subtitle: 'Vẻ đẹp tự nhiên từ tre và gỗ bền vững', image: '/images/banners/banner-5.jpg', link: '/products?category=san-pham-tre-go', buttonText: 'Xem ngay', order: 5, isActive: true },
        { title: 'Refill & Reuse', subtitle: 'Giảm rác thải nhựa với sản phẩm refill thông minh', image: '/images/banners/banner-6.jpg', link: '/products?hasRefill=true', buttonText: 'Khám phá', order: 6, isActive: true },
        { title: 'Thời Trang Bền Vững', subtitle: 'Cotton hữu cơ, sợi tái chế — Đẹp mà không hại môi trường', image: '/images/banners/banner-7.jpg', link: '/products?category=quan-ao-ben-vung', buttonText: 'Mua sắm', order: 7, isActive: true },
        { title: 'Quà Tặng Xanh', subtitle: 'Bộ quà tặng thân thiện môi trường cho người thân yêu', image: '/images/banners/banner-8.jpg', link: '/products?category=phu-kien-qua-tang-xanh', buttonText: 'Chọn quà', order: 8, isActive: true },
        { title: 'Mới: Bao Bì Rong Biển', subtitle: 'Công nghệ bao bì mới từ rong biển — Phân hủy trong 7 ngày', image: '/images/banners/banner-9.jpg', link: '/products', buttonText: 'Tìm hiểu', order: 9, isActive: false },
        { title: 'Cộng Đồng Zero Waste Việt Nam', subtitle: 'Tham gia cùng hàng nghìn người sống xanh trên cả nước', image: '/images/banners/banner-10.jpg', link: '/about', buttonText: 'Tham gia', order: 10, isActive: false }
    ]);
    console.log(`   ✅ Created ${banners.length} banners`);


    // ========== 9. PROMOTIONS (2) ==========
    console.log('\n🎁 Seeding Promotions...');
    const Promotion = require('./src/models/Promotion');
    await Promotion.deleteMany({});

    const promotions = await Promotion.insertMany([
        {
            code: 'MARAPR20',
            name: 'Khuyến mãi Tháng 3 & 4',
            description: 'Giảm 20% cho tất cả đơn hàng từ nay đến hết tháng 4',
            discountValue: 20,
            type: 'percentage',
            applicableTo: 'all',
            minOrderAmount: 0,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 1000
        },
        {
            code: 'SPRING50K',
            name: 'Đón Xuân sang, giảm 50K',
            description: 'Giảm 50.000đ cho đơn hàng từ 300.000đ',
            discountValue: 50000,
            type: 'fixed',
            applicableTo: 'all',
            minOrderAmount: 300000,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 500
        },
        {
            code: 'NEWUSER10',
            name: 'Chào bạn mới',
            description: 'Giảm 10% cho khách hàng mới',
            discountValue: 10,
            type: 'percentage',
            applicableTo: 'all',
            minOrderAmount: 0,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 500
        },
        {
            code: 'ECOFREESHIP',
            name: 'Freeship Xanh',
            description: 'Giảm 30.000đ phí vận chuyển cho đơn trên 400.000đ',
            discountValue: 30000,
            type: 'fixed',
            applicableTo: 'all',
            minOrderAmount: 400000,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 1000
        },
        {
            code: 'ZEROWASTE25',
            name: 'Lan toả lối sống Zero Waste',
            description: 'Giảm 25% cho đơn hàng mua dụng cụ gia đình',
            discountValue: 25,
            type: 'percentage',
            applicableTo: 'category',
            minOrderAmount: 200000,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 200
        },
        {
            code: 'WEEKEND5K',
            name: 'Cuối tuần Deal Xanh',
            description: 'Giảm sương sương 5%), không giới hạn đơn tối thiểu',
            discountValue: 5,
            type: 'percentage',
            applicableTo: 'all',
            minOrderAmount: 0,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 2000
        },
        {
            code: 'BAMBOO15',
            name: 'Yêu đồ tre nứa',
            description: 'Giảm 15% cho các sản phẩm từ Tre',
            discountValue: 15,
            type: 'percentage',
            applicableTo: 'category',
            minOrderAmount: 0,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 300
        },
        {
            code: 'FLASH100K',
            name: 'Flash Sale Tháng 3',
            description: 'Giảm 100.000đ cho đơn hàng giá trị cao từ 1.000.000đ',
            discountValue: 100000,
            type: 'fixed',
            applicableTo: 'all',
            minOrderAmount: 1000000,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 100
        },
        {
            code: 'EARTHDAY',
            name: 'Mừng tháng Giờ Trái Đất',
            description: 'Giảm 12% toàn bộ cửa hàng',
            discountValue: 12,
            type: 'percentage',
            applicableTo: 'all',
            minOrderAmount: 0,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-04-30T23:59:59Z'),
            isActive: true,
            usageLimit: 500
        },
        {
            code: 'GIFT8MARCH',
            name: 'Quà tặng 8/3 ngọt ngào',
            description: 'Giảm 38.000đ đơn từ 250.000đ',
            discountValue: 38000,
            type: 'fixed',
            applicableTo: 'all',
            minOrderAmount: 250000,
            startDate: new Date('2026-03-01T00:00:00Z'),
            endDate: new Date('2026-03-31T23:59:59Z'),
            isActive: true,
            usageLimit: 500
        }
    ]);
    console.log(`   ✅ Created ${promotions.length} promotions`);

    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED DATA HOÀN TẤT!');
    console.log('='.repeat(50));
    console.log(`📁 Categories  : ${categories.length}`);
    console.log(`👥 Users        : ${users.length}`);
    console.log(`📦 Packagings   : ${packagings.length}`);
    console.log(`🏅 Certificates : ${certificates.length}`);
    console.log(`🛍️ Products     : ${products.length}`);
    console.log(`🛒 Orders       : ${orders.length}`);
    console.log(`⭐ Reviews      : ${reviews.length}`);
    console.log(`🖼️ Banners      : ${banners.length}`);
    console.log(`🎁 Promotions   : ${promotions.length}`);
    console.log('\n💡 Login: admin@zerowaste.vn / 123456');
    console.log('🌐 Test: http://localhost:5173/admin/dashboard');

    process.exit(0);
};

seedAll().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
