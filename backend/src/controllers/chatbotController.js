const ChatbotConfig = require('../models/chatbotConfigModel');
const ChatbotFaq = require('../models/chatbotFaqModel');
const { callGemini } = require('../services/geminiService');

// Helper: escape ký tự regex đặc biệt trong chuỗi người dùng nhập
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== ADMIN: CẤU HÌNH CHATBOT =====

exports.getConfig = async (req, res, next) => {
  try {
    let config = await ChatbotConfig.findOne({ name: 'default' });

    if (!config) {
      config = await ChatbotConfig.create({
        name: 'default'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const { systemPromptGuest, systemPromptUser, maxHistoryMessages, language, enabled } = req.body;

    const payload = {};
    if (typeof systemPromptGuest === 'string') payload.systemPromptGuest = systemPromptGuest;
    if (typeof systemPromptUser === 'string') payload.systemPromptUser = systemPromptUser;
    if (typeof maxHistoryMessages === 'number') payload.maxHistoryMessages = maxHistoryMessages;
    if (typeof language === 'string') payload.language = language;
    if (typeof enabled === 'boolean') payload.enabled = enabled;

    payload.updatedBy = req.user?._id || null;
    payload.updatedAt = new Date();

    const config = await ChatbotConfig.findOneAndUpdate(
      { name: 'default' },
      payload,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

// ===== ADMIN: FAQ / KNOWLEDGE BASE =====

exports.getFaqs = async (req, res, next) => {
  try {
    const { search, category, audience, isActive } = req.query;
    const filter = {};

    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { question: { $regex: escaped, $options: 'i' } },
        { answer: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (audience) filter.audience = audience;
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    const faqs = await ChatbotFaq.find(filter).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    next(error);
  }
};

exports.createFaq = async (req, res, next) => {
  try {
    const faq = await ChatbotFaq.create({
      ...req.body,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    });

    res.status(201).json({
      success: true,
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFaq = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faq = await ChatbotFaq.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: req.user?._id || null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy FAQ'
      });
    }

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFaq = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faq = await ChatbotFaq.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy FAQ'
      });
    }

    res.json({
      success: true,
      message: 'Đã xoá FAQ'
    });
  } catch (error) {
    next(error);
  }
};

// ===== CLIENT: LẤY GỢI Ý FAQ NHANH (PUBLIC) =====

exports.getSuggestions = async (req, res, next) => {
  try {
    const faqs = await ChatbotFaq.find({
      isActive: true,
      audience: { $in: ['guest', 'both'] }
    })
      .select('question answer category')
      .sort({ category: 1, updatedAt: -1 });

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    next(error);
  }
};

// ===== CLIENT: HỎI CHATBOT (VĂN BẢN) =====

exports.askChatbot = async (req, res, next) => {
  try {
    const { message, contextType } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung câu hỏi'
      });
    }

    // Xác định loại người dùng
    const isLoggedIn = !!req.user;
    const mode = contextType || (isLoggedIn ? 'user' : 'guest');

    // Lấy config
    const config = await ChatbotConfig.findOne({ name: 'default' });

    if (!config || !config.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Chatbot đang được bảo trì, vui lòng thử lại sau.'
      });
    }

    const systemPrompt = mode === 'user' ? config.systemPromptUser : config.systemPromptGuest;

    // Chuẩn bị bộ lọc FAQ theo đối tượng — escape chuỗi regex
    const audienceFilter = mode === 'user' ? ['user', 'both'] : ['guest', 'both'];
    const escapedMessage = escapeRegex(message.trim());

    // Tách từ khóa từ câu hỏi (loại bỏ từ ngắn < 2 ký tự)
    const keywords = message
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .slice(0, 5); // Tối đa 5 từ khóa

    const keywordRegex = keywords.map((k) => escapeRegex(k)).join('|');

    const faqFilter = {
      isActive: true,
      audience: { $in: audienceFilter }
    };

    // Chỉ thêm regex nếu có từ khóa hợp lệ
    if (keywordRegex) {
      faqFilter.$or = [
        { question: { $regex: keywordRegex, $options: 'i' } },
        { tags: { $regex: keywordRegex, $options: 'i' } }
      ];
    }

    const faqs = await ChatbotFaq.find(faqFilter).limit(5);

    const contextDocs = faqs.map(
      (f) => `Hỏi: ${f.question}\nTrả lời mẫu: ${f.answer}`
    );

    // Enrich câu hỏi với thông tin người dùng (nếu có)
    let enrichedMessage = message;

    if (isLoggedIn && req.user) {
      const user = req.user;
      const ecoSummary =
        typeof user.ecoPoints === 'number'
          ? `Điểm xanh (ecoPoints): ${user.ecoPoints}. `
          : '';

      enrichedMessage =
        `Thông tin khách hàng: tên: ${user.username || ''}. ` +
        ecoSummary +
        'Hãy ưu tiên gợi ý sản phẩm zero-waste phù hợp và các thói quen sống xanh cụ thể, dễ áp dụng. ' +
        `Câu hỏi của khách: "${message}".`;
    }

    const answer = await callGemini({
      systemPrompt,
      userMessage: enrichedMessage,
      contextDocs,
      language: config.language || 'vi'
    });

    res.json({
      success: true,
      data: {
        answer,
        mode,
        usedFaqs: faqs.map((f) => ({
          id: f._id,
          question: f.question,
          category: f.category
        }))
      }
    });
  } catch (error) {
    console.error('Chatbot askChatbot error:', error);

    // Trả về lỗi thân thiện thay vì để Express xử lý
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return res.status(504).json({
        success: false,
        message: 'Chatbot đang phản hồi chậm, vui lòng thử lại sau.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gọi chatbot. Vui lòng thử lại sau.'
    });
  }
};
