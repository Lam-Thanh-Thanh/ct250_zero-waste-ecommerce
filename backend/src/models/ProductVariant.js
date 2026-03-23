const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  weight: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    trim: true,
    default: ''
  },
  volume: {
    type: String,
    trim: true,
    default: ''
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng tồn kho của biến thể'],
    min: [0, 'Tồn kho không được âm'],
    default: 0
  },
  priceModifier: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductVariant', productVariantSchema);
