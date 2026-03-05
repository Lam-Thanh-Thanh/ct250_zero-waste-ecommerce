const mongoose = require('mongoose');

/**
 * Payment Schema
 * Quản lý thông tin thanh toán cho đơn hàng
 */
const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    method: {
        type: String,
        required: true,
        enum: ['COD', 'Banking', 'Momo', 'ZaloPay', 'VNPay']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    // Thông tin bổ sung từ cổng thanh toán
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// ===== INDEX =====
paymentSchema.index({ order: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
