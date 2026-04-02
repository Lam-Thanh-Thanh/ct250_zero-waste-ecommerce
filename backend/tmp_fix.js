const mongoose = require('mongoose');
require('dotenv').config();

async function fixDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zero-waste-db');
        const db = mongoose.connection.db;
        
        const res1 = await db.collection('productvariants').updateMany(
            { stockQuantity: { $lt: 0 } },
            { $set: { stockQuantity: 0 } }
        );
        
        const res2 = await db.collection('products').updateMany(
            { stock: { $lt: 0 } },
            { $set: { stock: 0, inStock: false } }
        );
        
        console.log('Fixed Variants:', res1.modifiedCount);
        console.log('Fixed Products:', res2.modifiedCount);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixDB();
