require('dotenv').config();
const mongoose = require('mongoose');

const createReviewsDirectly = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Product = require('./src/models/Product');
    const User = require('./src/models/User');
    
    // Check data availability
    const products = await Product.find().limit(5);
    const users = await User.find({ role: 'user' }).limit(5);
    
    console.log(`📦 Products: ${products.length}`);
    console.log(`👥 Users: ${users.length}`);
    
    if (products.length === 0 || users.length === 0) {
        console.log('\n❌ Need products and users first!');
        process.exit(1);
    }
    
    // Direct MongoDB insert (bypass mongoose middleware)
    const reviewsCollection = mongoose.connection.collection('reviews');
    
    // Clear old
    await reviewsCollection.deleteMany({});
    console.log('🗑️  Cleared old reviews');
    
    // Create reviews directly
    const reviews = [
        { rating: 5, comment: "Sản phẩm tuyệt vời! Rất hài lòng với chất lượng!", status: 'approved' },
        { rating: 4, comment: "Tốt, nhưng giao hàng hơi lâu một chút.", status: 'approved' },
        { rating: 5, comment: "Chất lượng cao, sẽ mua lại! Recommend!", status: 'pending' },
        { rating: 3, comment: "Sản phẩm tạm ổn, không có gì đặc biệt.", status: 'pending' },
        { rating: 1, comment: "SPAM! Click here for discount!", status: 'rejected', adminNote: 'Spam content' },
        { rating: 5, comment: "Perfect! Love the eco-friendly design!", status: 'approved' },
        { rating: 4, comment: "Thiết kế đẹp, chất lượng tốt. Đóng gói cẩn thận.", status: 'pending' },
        { rating: 2, comment: "Không như mong đợi. Hơi thất vọng.", status: 'pending' },
        { rating: 5, comment: "Tuyệt vời! Sẽ giới thiệu cho bạn bè!", status: 'approved' },
        { rating: 4, comment: "Sản phẩm ok, đóng gói đẹp. Giao hàng nhanh.", status: 'pending' },
        { rating: 5, comment: "Chất lượng vượt mong đợi! Zero waste thật sự!", status: 'approved' },
        { rating: 3, comment: "Bình thường, không có gì nổi bật.", status: 'pending' },
        { rating: 1, comment: "Tệ quá! Ngôn từ xúc phạm!", status: 'rejected', adminNote: 'Inappropriate language' },
        { rating: 5, comment: "Mua lần 2 rồi, vẫn hài lòng như lần đầu!", status: 'approved' },
        { rating: 4, comment: "Sản phẩm tốt nhưng giá hơi cao.", status: 'pending' }
    ];
    
    const docs = [];
    for (let i = 0; i < reviews.length; i++) {
        const product = products[i % products.length];
        const user = users[i % users.length];
        
        docs.push({
            product: product._id,
            user: user._id,
            rating: reviews[i].rating,
            comment: reviews[i].comment,
            status: reviews[i].status,
            adminNote: reviews[i].adminNote || '',
            verifiedPurchase: Math.random() > 0.5,
            helpful: 0,
            helpfulBy: [],
            images: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    
    const result = await reviewsCollection.insertMany(docs);
    console.log(`✅ Created ${result.insertedCount} reviews!`);
    
    // Count by status
    const pipeline = [
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ];
    const stats = await reviewsCollection.aggregate(pipeline).toArray();
    
    console.log('\n📈 Statistics:');
    stats.forEach(s => console.log(`   - ${s._id}: ${s.count}`));
    
    console.log(`\n🎯 Test now at: http://localhost:5173/admin/reviews`);
    
    process.exit(0);
};

createReviewsDirectly().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
