import axios from './axios';

/**
 * Chatbot API Service
 * Giao tiếp với backend /api/chatbot
 */

/**
 * Hỏi chatbot (cho cả khách vãng lai & user đã đăng nhập)
 * Backend tự phân biệt qua token (optionalAuth)
 */
export const askChatbot = async ({ message, contextType }) => {
  try {
    const payload = { message };
    if (contextType) {
      payload.contextType = contextType;
    }

    const data = await axios.post('/chatbot/ask', payload);
    // axios instance đã trả về data trực tiếp
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi gọi chatbot' };
  }
};

/**
 * Lấy danh sách câu hỏi gợi ý nhanh (public, không cần đăng nhập)
 */
export const getSuggestedFaqs = async () => {
  try {
    const data = await axios.get('/chatbot/suggestions');
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tải gợi ý FAQ' };
  }
};

/**
 * ADMIN: Lấy cấu hình chatbot
 */
export const getChatbotConfig = async () => {
  try {
    const data = await axios.get('/chatbot/admin/config');
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tải cấu hình chatbot' };
  }
};

/**
 * ADMIN: Cập nhật cấu hình chatbot
 */
export const updateChatbotConfig = async (payload) => {
  try {
    const data = await axios.put('/chatbot/admin/config', payload);
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật cấu hình chatbot' };
  }
};

/**
 * ADMIN: Lấy danh sách FAQ
 */
export const getChatbotFaqs = async (params = {}) => {
  try {
    const data = await axios.get('/chatbot/admin/faqs', { params });
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tải danh sách FAQ' };
  }
};

/**
 * ADMIN: Tạo FAQ mới
 */
export const createChatbotFaq = async (payload) => {
  try {
    const data = await axios.post('/chatbot/admin/faqs', payload);
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo FAQ' };
  }
};

/**
 * ADMIN: Cập nhật FAQ
 */
export const updateChatbotFaq = async (id, payload) => {
  try {
    const data = await axios.put(`/chatbot/admin/faqs/${id}`, payload);
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật FAQ' };
  }
};

/**
 * ADMIN: Xoá FAQ
 */
export const deleteChatbotFaq = async (id) => {
  try {
    const data = await axios.delete(`/chatbot/admin/faqs/${id}`);
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi xoá FAQ' };
  }
};

