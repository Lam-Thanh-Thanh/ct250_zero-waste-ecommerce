const mongoose = require('mongoose');

const chatbotFaqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Vui lòng nhập câu hỏi mẫu'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'Vui lòng nhập câu trả lời mẫu']
  },

  // Nhóm nội dung chính để admin lọc dễ hơn
  category: {
    type: String,
    enum: ['product', 'green_lifestyle', 'policy', 'other'],
    default: 'product'
  },

  // Đối tượng áp dụng
  audience: {
    type: String,
    enum: ['guest', 'user', 'both'],
    default: 'both'
  },

  // Tag hỗ trợ tìm kiếm (ví dụ: "ống hút tre", "giảm nhựa")
  tags: [{
    type: String,
    trim: true
  }],

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Text index chỉ nên đặt trên field kiểu string (không đặt text index lên tags dạng array).
// Tags có index thường để lọc theo tag.
chatbotFaqSchema.index(
  { question: 'text', answer: 'text' },
  { name: 'chatbotFaq_text_question_answer' }
);
chatbotFaqSchema.index({ tags: 1 }, { name: 'chatbotFaq_tags' });

module.exports = mongoose.model('ChatbotFaq', chatbotFaqSchema);

