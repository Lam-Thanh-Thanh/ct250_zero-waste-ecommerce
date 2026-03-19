const mongoose = require('mongoose');

/**
 * Promotion Schema
 * Quản lý mã giảm giá / khuyến mãi
 * Dựa trên class diagram: promotionId, code, name, description,
 * discountValue, type, applicableTo, minOrderAmount, startDate, endDate
 */
const promotionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Vui lòng nhập mã khuyến mãi'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [30, 'Mã khuyến mãi không được quá 30 ký tự']
    },
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên khuyến mãi'],
        trim: true,
        maxlength: [200, 'Tên khuyến mãi không được quá 200 ký tự']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    discountValue: {
        type: Number,
        required: [true, 'Vui lòng nhập giá trị giảm giá'],
        min: [0, 'Giá trị giảm giá không được âm']
    },
    type: {
        type: String,
        required: [true, 'Vui lòng chọn loại giảm giá'],
        enum: {
            values: ['percentage', 'fixed'],
            message: 'Loại giảm giá phải là percentage hoặc fixed'
        },
        default: 'percentage'
    },
    applicableTo: {
        type: String,
        enum: {
            values: ['all', 'category', 'product'],
            message: 'Phạm vi áp dụng phải là all, category hoặc product'
        },
        default: 'all'
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: [0, 'Giá trị đơn tối thiểu không được âm']
    },
    startDate: {
        type: Date,
        required: [true, 'Vui lòng nhập ngày bắt đầu']
    },
    endDate: {
        type: Date,
        required: [true, 'Vui lòng nhập ngày kết thúc']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        default: null,
        min: [0, 'Giới hạn sử dụng không được âm']
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// ===== VALIDATION: endDate phải sau startDate =====
promotionSchema.pre('validate', function () {
    if (this.startDate && this.endDate && this.endDate <= this.startDate) {
        this.invalidate('endDate', 'Ngày kết thúc phải sau ngày bắt đầu');
    }
    // percentage không quá 100%
    if (this.type === 'percentage' && this.discountValue > 100) {
        this.invalidate('discountValue', 'Giảm giá theo phần trăm không được quá 100%');
    }
});

// ===== VIRTUAL: Kiểm tra promotion còn hiệu lực =====
promotionSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive &&
        now >= this.startDate &&
        now <= this.endDate &&
        (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Enable virtuals in JSON/Object output
promotionSchema.set('toJSON', { virtuals: true });
promotionSchema.set('toObject', { virtuals: true });

// ===== INDEX =====
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);
