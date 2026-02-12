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

const testCreateOrder = async () => {
    try {
        const user = await User.findOne({ role: 'user' });
        const product = await Product.findOne({ isActive: true });

        if (!user || !product) {
            console.log('Need user and product');
            return;
        }

        console.log('User:', user.username);
        console.log('Product:', product.name);

        const orderData = {
            user: user._id,
            items: [{
                product: product._id,
                productName: product.name,
                productImage: product.images?.[0]?.url || null,
                quantity: 2,
                price: product.price,
                discount: product.discount || 0,
                finalPrice: product.finalPrice || product.price,
                subtotal: (product.finalPrice || product.price) * 2
            }],
            subtotal: (product.finalPrice || product.price) * 2,
            discount: 0,
            promotionDiscount: 0,
            shippingCost: 30000,
            totalAmount: (product.finalPrice || product.price) * 2 + 30000,
            shippingAddress: {
                fullName: 'Test Customer',
                phone: '0912345678',
                address: '123 Test Street, District 1, Ho Chi Minh City',
                city: 'Ho Chi Minh',
                district: 'District 1',
                ward: 'Ward 1'
            },
            paymentMethod: 'COD',
            paymentStatus: 'pending',
            status: 'pending',
            statusHistory: [{
                status: 'pending',
                note: 'Order created',
                updatedAt: new Date()
            }],
            ecoPointsEarned: 10
        };

        console.log('\nCreating order...');
        const order = new Order(orderData);
        const saved = await order.save();
        console.log('Success! Order number:', saved.orderNumber);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.errors) {
            console.error('Validation errors:');
            Object.keys(error.errors).forEach(key => {
                console.error(`  ${key}: ${error.errors[key].message}`);
            });
        }
    }
};

const run = async () => {
    await connectDB();
    await testCreateOrder();
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
};

run();
