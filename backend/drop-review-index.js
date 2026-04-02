const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zero-waste-db');
        const db = mongoose.connection.db;
        
        try {
            await db.collection('reviews').dropIndex('product_1_user_1');
            console.log("Index dropped successfully.");
        } catch (e) {
            console.log("Index might not exist or already dropped:", e.message);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

dropIndex();
