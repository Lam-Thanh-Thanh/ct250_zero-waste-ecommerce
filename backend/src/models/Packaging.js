const mongoose = require('mongoose');

/**
 * Packaging Schema
 * Quản lý các loại bao bì thân thiện môi trường
 * VD: Giấy tái chế, Túi sinh học, Hộp gỗ, v.v.
 */
const packagingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên bao bì'],
    unique: true,
    trim: true,
    maxlength: [100, 'Tên bao bì không được quá 100 ký tự']
  },
  material: {
    type: String,
    required: [true, 'Vui lòng nhập chất liệu'],
    trim: true,
    maxlength: [200, 'Tên chất liệu không được quá 200 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
  },
  isBiodegradable: {
    type: Boolean,
    default: false
  },
  isReusable: {
    type: Boolean,
    default: false
  },
  isRecyclable: {
    type: Boolean,
    default: false
  },
  // Thời gian phân hủy (số ngày)
  decompositionTime: {
    type: Number,
    min: 0,
    default: null
  },
  // Điểm eco cộng thêm
  ecoPoints: {
    type: Number,
    default: 0,
    min: 0,
    max: 20
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Số lượng sản phẩm đang sử dụng bao bì này
  productCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// ===== INDEX: Tối ưu query =====
packagingSchema.index({ name: 1 });
packagingSchema.index({ material: 1 });
packagingSchema.index({ isBiodegradable: 1 });
packagingSchema.index({ isActive: 1 });

module.exports = mongoose.model('Packaging', packagingSchema);