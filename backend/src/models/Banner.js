const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Vui lòng nhập tiêu đề banner'],
        trim: true,
        maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [300, 'Phụ đề không được quá 300 ký tự']
    },
    image: {
        type: String,
        required: [true, 'Vui lòng upload hình ảnh banner']
    },
    link: {
        type: String,
        trim: true
    },
    buttonText: {
        type: String,
        trim: true,
        maxlength: [50, 'Text button không được quá 50 ký tự']
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index để sort theo order
bannerSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('Banner', bannerSchema);
