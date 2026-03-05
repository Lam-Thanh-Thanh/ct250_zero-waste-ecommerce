const mongoose = require('mongoose');

/**
 * Cart Schema
 * Giỏ hàng - Mỗi user có 1 giỏ hàng duy nhất
 * Items được nhúng trực tiếp (embedded) để tối ưu query
 */

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Số lượng tối thiểu là 1'],
        default: 1
    }
}, {
    _id: true,
    timestamps: false
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi user chỉ có 1 cart
    },
    items: [cartItemSchema]
}, {
    timestamps: true
});

// ===== INDEX =====
cartSchema.index({ user: 1 });

module.exports = mongoose.model('Cart', cartSchema);
