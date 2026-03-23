const mongoose = require('mongoose');

/**
 * Order Schema
 * Quản lý đơn hàng với đầy đủ thông tin
 */

// OrderDetail sub-schema (embedded)
const orderDetailSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: String,     // Lưu tên sản phẩm tại thời điểm đặt
    productImage: String,    // Lưu ảnh chính
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        default: null
    },
    variantSize: String,
    variantWeight: Number,
    variantVolume: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    finalPrice: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    }
});

// Main Order Schema
const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Order Items
    items: [orderDetailSchema],

    // Pricing
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Delivery Information
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: String,
        district: String,
        ward: String,
        note: String
    },

    // Payment Information
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'Banking', 'Momo', 'ZaloPay', 'VNPay'],
        default: 'COD'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paidAt: {
        type: Date,
        default: null
    },

    // Order Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },

    // Status History (tracking changes)
    statusHistory: [{
        status: String,
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Promotion/Coupon
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
        default: null
    },
    promotionCode: String,
    promotionDiscount: {
        type: Number,
        default: 0
    },

    // Eco Points Earned
    ecoPointsEarned: {
        type: Number,
        default: 0,
        min: 0
    },

    // Cancellation
    cancelReason: String,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledAt: Date,

    // Delivery Tracking
    deliveryEstimate: Date,
    deliveredAt: Date,

    // Notes
    customerNote: String,
    adminNote: String

}, {
    timestamps: true
});

// ===== MIDDLEWARE: Tạo order number tự động =====
orderSchema.pre('save', async function () {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        this.orderNumber = `ORD${dateStr}${String(count + 1).padStart(5, '0')}`;
    }
});

// ===== MIDDLEWARE: Tính toán tổng tiền =====
orderSchema.pre('save', function () {
    // Calculate subtotal from items
    if (this.items && this.items.length > 0) {
        this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    }

    // Calculate total: subtotal - discount - promotion + shipping
    this.totalAmount = this.subtotal - this.discount - this.promotionDiscount + this.shippingCost;
});

// ===== INDEX: Tối ưu query =====
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: 1 }); // Compound index for Dashboard
orderSchema.index({ 'shippingAddress.phone': 1 });

module.exports = mongoose.model('Order', orderSchema);