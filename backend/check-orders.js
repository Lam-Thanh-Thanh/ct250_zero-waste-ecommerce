require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const count = await Order.countDocuments();
        console.log(`Total orders: ${count}`);

        if (count > 0) {
            const orders = await Order.find().limit(5).sort({ createdAt: -1 });
            console.log('\nRecent orders:');
            orders.forEach(o => {
                console.log(`  - ${o.orderNumber}: ${o.status} - ${o.totalAmount} VND`);
            });

            const stats = await Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            console.log('\nOrder status distribution:');
            stats.forEach(s => console.log(`  ${s._id}: ${s.count}`));
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkOrders();
