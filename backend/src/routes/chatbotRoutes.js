const express = require('express');
const router = express.Router();

const chatbotController = require('../controllers/chatbotController');
const { protect, admin, optionalAuth } = require('../middlewares/auth');

// ===== ADMIN: CẤU HÌNH & NỘI DUNG CHATBOT =====

// Tất cả route dưới /admin yêu cầu admin đăng nhập
router.get('/admin/config', protect, admin, chatbotController.getConfig);
router.put('/admin/config', protect, admin, chatbotController.updateConfig);

router.get('/admin/faqs', protect, admin, chatbotController.getFaqs);
router.post('/admin/faqs', protect, admin, chatbotController.createFaq);
router.put('/admin/faqs/:id', protect, admin, chatbotController.updateFaq);
router.delete('/admin/faqs/:id', protect, admin, chatbotController.deleteFaq);

// ===== CLIENT: PUBLIC =====

// Lấy danh sách câu hỏi gợi ý nhanh (hiện chips trong widget)
router.get('/suggestions', chatbotController.getSuggestions);

// Hỏi chatbot (optionalAuth: có token thì cá nhân hóa, không có vẫn hoạt động)
router.post('/ask', optionalAuth, chatbotController.askChatbot);

module.exports = router;
