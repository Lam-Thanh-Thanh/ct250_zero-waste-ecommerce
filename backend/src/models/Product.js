const mongoose = require('mongoose');

/**
 * Product Schema
 * Quản lý sản phẩm zero-waste với nhiều tính năng:
 * - Nhiều ảnh
 * - Quản lý stock (tồn kho)
 * - Eco score (điểm xanh)
 * - Featured (sản phẩm nổi bật)
 * - Discount (khuyến mãi)
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên sản phẩm'],
    trim: true,
    maxlength: [200, 'Tên sản phẩm không được quá 200 ký tự']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả sản phẩm'],
    trim: true,
    maxlength: [2000, 'Mô tả không được quá 2000 ký tự']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Mô tả ngắn không được quá 300 ký tự']
  },
  
  // ===== GIÁ & KHUYẾN MÃI =====
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá sản phẩm'],
    min: [0, 'Giá không được âm']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Giảm giá không được âm'],
    max: [100, 'Giảm giá không được quá 100%']
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  
  // ===== DANH MỤC =====
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Vui lòng chọn danh mục']
  },
  
  // ===== HÌNH ẢNH (Nhiều ảnh) =====
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  
  // ===== QUẢN LÝ TỒN KHO =====
  stock: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng tồn kho'],
    min: [0, 'Tồn kho không được âm'],
    default: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  
  // ===== ECO SCORE - CRITERIA BASED (5 tiêu chí) =====
  ecoScore: {
    type: Number,
    min: [0, 'Eco Score tối thiểu là 0 sao'],
    max: [5, 'Eco Score tối đa là 5 sao'],
    default: 0
  },
  
  // Tiêu chí 1: Vật liệu xanh (100% tự nhiên, hữu cơ hoặc tái chế)
  isNaturalMaterial: {
    type: Boolean,
    default: false
  },
  
  // Tiêu chí 2: Tái sử dụng (thay thế single-use, dùng lại nhiều năm)
  isReusable: {
    type: Boolean,
    default: false
  },
  
  // Tiêu chí 3: Phân hủy sinh học (biodegradable/compostable)
  isBiodegradable: {
    type: Boolean,
    default: false
  },
  
  // Tiêu chí 4: Chứng nhận xanh - dùng field certificates (đã có ở dưới)
  // Nếu certificates.length > 0 → +1 điểm
  
  // Tiêu chí 5: Refillable (có thiết kế refill)
  hasRefill: {
    type: Boolean,
    default: false
  },
  
  // Giữ lại materials array cho thông tin chi tiết
  materials: [{
    type: String,
    trim: true
  }],
  
  // ===== BIẾN THỂ (Variants) =====
  variants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant'
  }],
  
  // ===== CERTIFICATE & PACKAGING =====
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  packaging: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Packaging',
    default: null
  },
  
  // ===== TRẠNG THÁI =====
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // ===== THỐNG KÊ =====
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true
});

// ===== MIDDLEWARE: Tự động tạo slug từ name =====
productSchema.pre('save', function() {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
});

// ===== MIDDLEWARE: Tính finalPrice từ price và discount =====
productSchema.pre('save', function() {
  if (this.isModified('price') || this.isModified('discount')) {
    this.finalPrice = this.price - (this.price * this.discount / 100);
  }
});

// ===== MIDDLEWARE: Cập nhật inStock dựa vào stock =====
productSchema.pre('save', function() {
  if (this.isModified('stock')) {
    this.inStock = this.stock > 0;
  }
});

// ===== MIDDLEWARE: Tự động tính ecoScore từ 5 tiêu chí =====
productSchema.pre('save', function() {
  // Tính lại khi bất kỳ tiêu chí nào thay đổi
  if (
    this.isModified('isNaturalMaterial') ||
    this.isModified('isReusable') ||
    this.isModified('isBiodegradable') ||
    this.isModified('certificates') ||
    this.isModified('hasRefill')
  ) {
    let score = 0;
    
    // Tiêu chí 1: Vật liệu xanh
    if (this.isNaturalMaterial) score += 1;
    
    // Tiêu chí 2: Tái sử dụng
    if (this.isReusable) score += 1;
    
    // Tiêu chí 3: Phân hủy sinh học
    if (this.isBiodegradable) score += 1;
    
    // Tiêu chí 4: Có ít nhất 1 chứng nhận
    if (this.certificates && this.certificates.length > 0) score += 1;
    
    // Tiêu chí 5: Refillable
    if (this.hasRefill) score += 1;
    
    this.ecoScore = score; // 0-5
  }
});

// ===== VIRTUAL: Phần trăm đã bán =====
productSchema.virtual('soldPercentage').get(function() {
  if (this.stock + this.sold === 0) return 0;
  return Math.round((this.sold / (this.stock + this.sold)) * 100);
});

// ===== VIRTUAL: Chi tiết breakdown ecoScore =====
productSchema.virtual('ecoScoreBreakdown').get(function() {
  return {
    total: this.ecoScore,
    criteria: [
      { name: 'Vật liệu xanh', met: this.isNaturalMaterial },
      { name: 'Tái sử dụng', met: this.isReusable },
      { name: 'Phân hủy sinh học', met: this.isBiodegradable },
      { name: 'Chứng nhận xanh', met: this.certificates && this.certificates.length > 0 },
      { name: 'Refillable', met: this.hasRefill }
    ]
  };
});

// Enable virtuals in JSON/Object output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// ===== INDEX: Tối ưu query =====
productSchema.index({ name: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ecoScore: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ sold: -1 });
productSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Product', productSchema);