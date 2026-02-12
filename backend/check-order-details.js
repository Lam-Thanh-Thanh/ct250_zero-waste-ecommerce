require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

const checkOrderDetails = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const orders = await Order.find().limit(3);
        
        for (const order of orders) {
            console.log(`Order: ${order.orderNumber}`);
            console.log(`  User: ${order.user}`);
            console.log(`  Items count: ${order.items.length}`);
            
            for (let i = 0; i < order.items.length; i++) {
                const item = order.items[i];
                console.log(`  Item ${i + 1}:`);
                console.log(`    Product ID: ${item.product}`);
                console.log(`    Product Name: ${item.productName}`);
            }
            console.log('');
        }

        // Try to populate one order
        console.log('Trying to populate first order...');
        const firstOrder = await Order.findById(orders[0]._id)
            .populate('user', 'username email')
            .populate({
                path: 'items.product',
                select: 'name slug images',
                options: { strictPopulate: false }
            });

        if (firstOrder) {
            console.log('Populate successful!');
            console.log(`Order: ${firstOrder.orderNumber}`);
            console.log(`User: ${firstOrder.user?.username || 'N/A'}`);
            console.log(`Items:`);
            firstOrder.items.forEach((item, i) => {
                console.log(`  ${i + 1}. ${item.productName} - Product exists: ${item.product ? 'Yes' : 'No'}`);
            });
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

checkOrderDetails();
