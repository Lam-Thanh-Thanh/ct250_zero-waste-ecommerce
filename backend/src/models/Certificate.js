const mongoose = require('mongoose');

/**
 * Certificate Schema
 * Quản lý các chứng chỉ môi trường, chất lượng cho sản phẩm
 * VD: FSC, GOTS, Fair Trade, ISO 14001, v.v.
 */
const certificateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên chứng chỉ'],
    unique: true,
    trim: true,
    maxlength: [100, 'Tên chứng chỉ không được quá 100 ký tự']
  },
  organization: {
    type: String,
    required: [true, 'Vui lòng nhập tổ chức cấp chứng chỉ'],
    trim: true,
    maxlength: [200, 'Tên tổ chức không được quá 200 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  // Hình ảnh logo/badge của chứng chỉ
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
  // Điểm eco cộng thêm khi có chứng chỉ này
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
  // Số lượng sản phẩm đang sử dụng chứng chỉ này
  productCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// ===== INDEX: Tối ưu query =====
certificateSchema.index({ name: 1 });
certificateSchema.index({ organization: 1 });
certificateSchema.index({ isActive: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);