require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

const generatePhone = () => {
    return '09' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
};

const seedOrders = async () => {
    try {
        console.log('Starting to seed orders...\n');

        // Get users and products
        const users = await User.find({ role: 'user' }).limit(10);
        const products = await Product.find({ isActive: true }).limit(20);

        console.log(`Found ${users.length} users and ${products.length} products`);

        if (users.length === 0 || products.length === 0) {
            console.log('Need at least 1 user and 1 product to create orders');
            return;
        }

        // Delete existing orders
        await Order.deleteMany({});
        console.log('Deleted all existing orders\n');

        const orders = [];
        const statuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
        const paymentMethods = ['COD', 'Banking', 'Momo', 'ZaloPay'];

        // Create 25 orders
        for (let i = 0; i < 25; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const numItems = Math.floor(Math.random() * 3) + 1;
            
            // Select random products
            const selectedProducts = [];
            for (let j = 0; j < numItems; j++) {
                selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
            }

            // Create order items
            const items = selectedProducts.map(product => {
                const quantity = Math.floor(Math.random() * 2) + 1;
                const finalPrice = product.finalPrice || product.price;
                return {
                    product: product._id,
                    productName: product.name,
                    productImage: product.images?.[0]?.url || null,
                    quantity,
                    price: product.price,
                    discount: product.discount || 0,
                    finalPrice,
                    subtotal: finalPrice * quantity
                };
            });

            const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const shippingCost = 30000;
            const totalAmount = subtotal + shippingCost;

            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const paymentStatus = (status === 'delivered' || (paymentMethod !== 'COD' && Math.random() > 0.5)) ? 'paid' : 'pending';

            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

            const order = {
                user: user._id,
                items,
                subtotal,
                discount: 0,
                promotionDiscount: 0,
                shippingCost,
                totalAmount,
                shippingAddress: {
                    fullName: `Customer ${i + 1}`,
                    phone: generatePhone(),
                    address: `123 Street ${i + 1}, District ${(i % 12) + 1}, Ho Chi Minh City`,
                    city: 'Ho Chi Minh',
                    district: `District ${(i % 12) + 1}`,
                    ward: `Ward ${(i % 10) + 1}`
                },
                paymentMethod,
                paymentStatus,
                paidAt: paymentStatus === 'paid' ? createdAt : null,
                status,
                statusHistory: [{
                    status: 'pending',
                    note: 'Order created',
                    updatedAt: createdAt
                }],
                ecoPointsEarned: Math.floor(totalAmount / 10000),
                createdAt,
                updatedAt: createdAt
            };

            orders.push(order);
        }

        // Save orders one by one to trigger middleware
        const savedOrders = [];
        for (const orderData of orders) {
            const order = new Order(orderData);
            const saved = await order.save();
            savedOrders.push(saved);
        }
        
        console.log(`\nSuccessfully created ${savedOrders.length} orders!`);

        const stats = {
            pending: savedOrders.filter(o => o.status === 'pending').length,
            confirmed: savedOrders.filter(o => o.status === 'confirmed').length,
            processing: savedOrders.filter(o => o.status === 'processing').length,
            shipping: savedOrders.filter(o => o.status === 'shipping').length,
            delivered: savedOrders.filter(o => o.status === 'delivered').length,
            cancelled: savedOrders.filter(o => o.status === 'cancelled').length,
        };

        console.log('\nOrder statistics:');
        console.log(`  Pending: ${stats.pending}`);
        console.log(`  Confirmed: ${stats.confirmed}`);
        console.log(`  Processing: ${stats.processing}`);
        console.log(`  Shipping: ${stats.shipping}`);
        console.log(`  Delivered: ${stats.delivered}`);
        console.log(`  Cancelled: ${stats.cancelled}`);

    } catch (error) {
        console.error('Error seeding orders:', error.message);
        console.error(error);
    }
};

const run = async () => {
    await connectDB();
    await seedOrders();
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
};

run();
