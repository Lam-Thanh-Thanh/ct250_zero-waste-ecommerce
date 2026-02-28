const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {});

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // ===== Chatbot FAQ indexes: auto-fix legacy wrong indexes =====
    try {
      const ChatbotFaq = require('../models/chatbotFaqModel');

      // Lấy danh sách index hiện tại
      const indexes = await ChatbotFaq.collection.indexes();

      for (const idx of indexes) {
        // Nếu có index text cũ chứa field tags -> xoá đi để tránh lỗi "Field 'tags' of text index contains an array"
        if (idx.key && idx.key.tags === 'text') {
          console.warn(
            `Dropping legacy text index on tags in ChatbotFaq collection: ${idx.name}`
          );
          await ChatbotFaq.collection.dropIndex(idx.name);
        }
      }

      // Đồng bộ lại index theo schema mới
      await ChatbotFaq.syncIndexes();
    } catch (indexError) {
      console.warn('ChatbotFaq index sync warning:', indexError.message);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
