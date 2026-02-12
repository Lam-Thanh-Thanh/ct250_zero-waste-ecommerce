require('dotenv').config();
const mongoose = require('mongoose');

const checkAndSeed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Product = require('./src/models/Product');
    const User = require('./src/models/User');
    const Review = require('./src/models/Review');
    
    // Check products
    const productCount = await Product.countDocuments();
    console.log(`📦 Products: ${productCount}`);
    
    // Check users
    const userCount = await User.countDocuments({ role: 'user' });
    console.log(`👥 Users (role=user): ${userCount}`);
    
    if (productCount === 0 || userCount === 0) {
        console.log('\n❌ Cannot create reviews:');
        if (productCount === 0) console.log('   - No products found');
        if (userCount === 0) console.log('   - No users with role="user" found');
        console.log('\n💡 Tip: Create some products and users first, then run this script again.');
        process.exit(1);
    }
    
    // Get actual data
    const products = await Product.find().limit(5);
    const users = await User.find({ role: 'user' }).limit(5);
    
    console.log(`\n📝 Will use:`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${users.length} users`);
    
    // Simple reviews
    const reviews = [
        { rating: 5, comment: "Sản phẩm tuyệt vời! Rất hài lòng!", status: 'approved' },
        { rating: 4, comment: "Tốt, nhưng giao hàng hơi lâu.", status: 'approved' },
        { rating: 5, comment: "Chất lượng cao, sẽ mua lại!", status: 'pending' },
        { rating: 3, comment: "Sản phẩm tạm ổn.", status: 'pending' },
        { rating: 1, comment: "SPAM! Click here!", status: 'rejected', adminNote: 'Spam' },
        { rating: 5, comment: "Perfect! Love it!", status: 'approved' },
        { rating: 4, comment: "Thiết kế đẹp, chất lượng tốt.", status: 'pending' },
        { rating: 2, comment: "Không như mong đợi.", status: 'pending' },
        { rating: 5, comment: "Tuyệt vời! Recommend!", status: 'approved' },
        { rating: 4, comment: "Sản phẩm ok, đóng gói đẹp.", status: 'pending' }
    ];
    
    // Clear old reviews
    await Review.deleteMany({});
    console.log('\n🗑️  Cleared old reviews');
    
    // Create reviews
    let created = 0;
    for (let i = 0; i < reviews.length; i++) {
        const product = products[i % products.length];
        const user = users[i % users.length];
        
        try {
            const review = await Review.create({
                product: product._id,
                user: user._id,
                rating: reviews[i].rating,
                comment: reviews[i].comment,
                status: reviews[i].status,
                adminNote: reviews[i].adminNote || '',
                verifiedPurchase: Math.random() > 0.5
            });
            created++;
            console.log(`✅ ${created}. Created ${review.rating}★ ${review.status} review`);
        } catch (error) {
            console.log(`❌ ${i+1}. Error:`, error.message);
        }
    }
    
    console.log(`\n✅ Created ${created} reviews!`);
    console.log(`\n🎯 Test at: http://localhost:5173/admin/reviews`);
    
    process.exit(0);
};

checkAndSeed().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
