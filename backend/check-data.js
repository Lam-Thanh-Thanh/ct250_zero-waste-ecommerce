require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        const regularUsers = await User.countDocuments({ role: 'user' });
        const activeProducts = await Product.countDocuments({ isActive: true });

        console.log(`Total users: ${userCount}`);
        console.log(`Regular users: ${regularUsers}`);
        console.log(`Total products: ${productCount}`);
        console.log(`Active products: ${activeProducts}`);

        if (regularUsers > 0) {
            const users = await User.find({ role: 'user' }).limit(3);
            console.log('\nSample users:');
            users.forEach(u => console.log(`  - ${u.username} (${u.email})`));
        }

        if (activeProducts > 0) {
            const products = await Product.find({ isActive: true }).limit(3);
            console.log('\nSample products:');
            products.forEach(p => console.log(`  - ${p.name} (${p.price} VND)`));
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkData();
