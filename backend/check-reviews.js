require('dotenv').config();
const mongoose = require('mongoose');

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const Review = require('./src/models/Review');
    
    const total = await Review.countDocuments();
    const byStatus = await Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Review Statistics:');
    console.log(`Total reviews: ${total}`);
    console.log('\nBy status:');
    byStatus.forEach(s => {
        console.log(`  - ${s._id}: ${s.count}`);
    });
    
    if (total > 0) {
        const samples = await Review.find().limit(3).populate('user', 'username').populate('product', 'name');
        console.log('\n📝 Sample reviews:');
        samples.forEach((r, i) => {
            console.log(`\n${i+1}. ${r.rating}★ - ${r.status}`);
            console.log(`   User: ${r.user?.username || 'N/A'}`);
            console.log(`   Product: ${r.product?.name || 'N/A'}`);
            console.log(`   Comment: "${r.comment.substring(0, 50)}..."`);
        });
    }
    
    process.exit(0);
};

check().catch(console.error);
