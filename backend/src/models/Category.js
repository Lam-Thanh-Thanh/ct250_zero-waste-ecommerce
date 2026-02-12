const mongoose = require('mongoose');

/**
 * Category Schema
 * Quản lý danh mục sản phẩm (Chai lọ tái chế, Túi xách thân thiện môi trường, v.v.)
 */
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên danh mục'],
        unique: true,
        trim: true,
        maxlength: [100, 'Tên danh mục không được quá 100 ký tự']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    image: {
        url: {
            type: String,
            default: null
        },
        publicId: {
            type: String,
            default: null
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Số lượng sản phẩm trong danh mục (tự động cập nhật)
    productCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// ===== MIDDLEWARE: Tự động tạo slug từ name =====
categorySchema.pre('save', function () {
    if (this.isModified('name')) {
        // Chuyển đổi tiếng Việt sang slug
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, space, gạch ngang
            .replace(/\s+/g, '-') // Thay space = gạch ngang
            .replace(/-+/g, '-') // Xóa gạch ngang liên tiếp
            .trim();
    }
});

// ===== INDEX: Tối ưu query =====
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);