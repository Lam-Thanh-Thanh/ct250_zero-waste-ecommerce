require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

const testSimple = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected\n');

        const count = await Order.countDocuments();
        console.log(`Total orders: ${count}`);

        const order = await Order.findOne();
        console.log(`\nFirst order ID: ${order._id}`);
        console.log(`Order number: ${order.orderNumber}`);
        console.log(`Status: ${order.status}`);
        console.log(`Total: ${order.totalAmount}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

testSimple();
