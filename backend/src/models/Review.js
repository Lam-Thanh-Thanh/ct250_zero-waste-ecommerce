const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Core fields
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Sản phẩm là bắt buộc']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người dùng là bắt buộc']
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null // Optional - để verify purchase
    },

    // Review content
    rating: {
        type: Number,
        required: [true, 'Đánh giá là bắt buộc'],
        min: [1, 'Đánh giá tối thiểu là 1 sao'],
        max: [5, 'Đánh giá tối đa là 5 sao']
    },
    comment: {
        type: String,
        required: [true, 'Bình luận là bắt buộc'],
        trim: true,
        maxlength: [1000, 'Bình luận không được quá 1000 ký tự']
    },
    images: [{
        type: String // URL to review images
    }],

    // Moderation
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNote: {
        type: String, // Lý do từ chối
        default: ''
    },

    // Helpful votes
    helpful: {
        type: Number,
        default: 0
    },
    helpfulBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Verification
    verifiedPurchase: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// ===== INDEXES =====
// Đảm bảo mỗi user chỉ review 1 lần cho mỗi sản phẩm
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });
reviewSchema.index({ status: 1 });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// ===== VIRTUAL =====
// Get review age
reviewSchema.virtual('age').get(function () {
    return Date.now() - this.createdAt.getTime();
});

// ===== METHODS =====
// Mark as helpful by user
reviewSchema.methods.markHelpful = async function (userId) {
    if (!this.helpfulBy.includes(userId)) {
        this.helpfulBy.push(userId);
        this.helpful += 1;
        await this.save();
    }
};

// Unmark helpful
reviewSchema.methods.unmarkHelpful = async function (userId) {
    const index = this.helpfulBy.indexOf(userId);
    if (index > -1) {
        this.helpfulBy.splice(index, 1);
        this.helpful -= 1;
        await this.save();
    }
};

// ===== STATICS =====
// Get average rating for a product
reviewSchema.statics.getAverageRating = async function (productId) {
    const result = await this.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    return result[0] || { avgRating: 0, totalReviews: 0 };
};

// Get rating distribution for a product
reviewSchema.statics.getRatingDistribution = async function (productId) {
    const distribution = await this.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: -1 } }
    ]);

    const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach(d => {
        result[d._id] = d.count;
    });

    return result;
};

// ===== MIDDLEWARE =====
// Auto-set verifiedPurchase if order is provided
reviewSchema.pre('save', async function () {
    if (this.isNew && this.order) {
        const Order = mongoose.model('Order');
        const order = await Order.findOne({
            _id: this.order,
            user: this.user,
            status: 'delivered'
        });

        if (order) {
            // Check if product is in order
            const hasProduct = order.items.some(
                item => item.product.toString() === this.product.toString()
            );

            if (hasProduct) {
                this.verifiedPurchase = true;
            }
        }
    }
});

// Update product rating when review is approved/rejected
reviewSchema.post('save', async function (doc) {
    if (doc.status === 'approved' || doc.status === 'rejected') {
        try {
            const Product = mongoose.model('Product');
            const stats = await mongoose.model('Review').getAverageRating(doc.product);

            await Product.findByIdAndUpdate(doc.product, {
                'rating.average': Math.round(stats.avgRating * 10) / 10, // Round to 1 decimal
                'rating.count': stats.totalReviews
            });
        } catch (error) {
            console.error('Error updating product rating:', error);
        }
    }
});

// Update product rating when review is deleted
reviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc && doc.status === 'approved') {
        try {
            const Product = mongoose.model('Product');
            const stats = await mongoose.model('Review').getAverageRating(doc.product);

            await Product.findByIdAndUpdate(doc.product, {
                'rating.average': Math.round(stats.avgRating * 10) / 10, // Round to 1 decimal
                'rating.count': stats.totalReviews
            });
        } catch (error) {
            console.error('Error updating product rating after delete:', error);
        }
    }
});

module.exports = mongoose.model('Review', reviewSchema);
