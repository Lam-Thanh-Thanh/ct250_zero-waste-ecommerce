import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getChatbotFaqs,
  createChatbotFaq,
  updateChatbotFaq,
  deleteChatbotFaq
} from '../../api/chatbotApi';
import { Link } from 'react-router-dom';

const emptyForm = {
  question: '',
  answer: '',
  category: 'product',
  audience: 'both',
  tags: '',
  isActive: true
};

const ChatbotFaqManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    audience: '',
    isActive: 'true'
  });
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFaqs = async (paramsOverride = {}) => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        ...paramsOverride
      };

      // Loại bỏ filter rỗng
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const data = await getChatbotFaqs(params);
      setFaqs(data.data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast.error(error.message || 'Không thể tải danh sách FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    fetchFaqs(newFilters);
  };

  const openModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setForm({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || 'product',
        audience: faq.audience || 'both',
        tags: (faq.tags || []).join(', '),
        isActive: faq.isActive ?? true
      });
    } else {
      setEditingFaq(null);
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFaq(null);
    setForm(emptyForm);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category,
        audience: form.audience,
        isActive: !!form.isActive,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      };

      if (!payload.question || !payload.answer) {
        toast.error('Vui lòng nhập đầy đủ câu hỏi và câu trả lời');
        setSaving(false);
        return;
      }

      if (editingFaq) {
        await updateChatbotFaq(editingFaq._id, payload);
        toast.success('Cập nhật FAQ thành công');
      } else {
        await createChatbotFaq(payload);
        toast.success('Thêm FAQ mới thành công');
      }

      closeModal();
      fetchFaqs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error(error.message || 'Không thể lưu FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq) => {
    if (!window.confirm(`Bạn có chắc muốn xoá FAQ: "${faq.question}"?`)) return;
    try {
      await deleteChatbotFaq(faq._id);
      toast.success('Xoá FAQ thành công');
      fetchFaqs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error(error.message || 'Không thể xoá FAQ');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nội dung Chatbot AI</h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý các câu hỏi–trả lời mẫu (knowledge base) để chatbot trả lời đúng định hướng zero-waste.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/chatbot-config"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v8m-4-4h8m7 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Cấu hình chatbot
            </Link>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thêm FAQ mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Tìm theo câu hỏi, câu trả lời hoặc tag..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả loại nội dung</option>
              <option value="product">Sản phẩm</option>
              <option value="green_lifestyle">Mẹo sống xanh</option>
              <option value="policy">Chính sách / quy định</option>
              <option value="other">Khác</option>
            </select>
            <div className="flex gap-2">
              <select
                value={filters.audience}
                onChange={(e) => handleFilterChange('audience', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Tất cả đối tượng</option>
                <option value="guest">Khách vãng lai</option>
                <option value="user">Khách đã đăng nhập</option>
                <option value="both">Cả hai</option>
              </select>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="true">Đang dùng</option>
                <option value="false">Tắt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <svg
                className="mx-auto w-12 h-12 text-gray-300 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5l-4-4H9a7 7 0 110-14 7 7 0 017 7v7z"
                />
              </svg>
              <p className="text-sm font-medium">
                Chưa có câu hỏi–trả lời mẫu nào.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Hãy thêm một vài FAQ để chatbot có kiến thức nền tảng chính xác.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Câu hỏi
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Trả lời mẫu
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Loại / Đối tượng
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Tag
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {faqs.map((faq) => (
                    <tr key={faq._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {faq.question}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-xs text-gray-700 line-clamp-3">
                          {faq.answer}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 w-fit">
                            {faq.category === 'product'
                              ? 'Sản phẩm'
                              : faq.category === 'green_lifestyle'
                              ? 'Mẹo sống xanh'
                              : faq.category === 'policy'
                              ? 'Chính sách'
                              : 'Khác'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-700 w-fit">
                            {faq.audience === 'guest'
                              ? 'Khách vãng lai'
                              : faq.audience === 'user'
                              ? 'Đã đăng nhập'
                              : 'Cả hai'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {(faq.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px]"
                            >
                              #{tag}
                            </span>
                          ))}
                          {(!faq.tags || faq.tags.length === 0) && (
                            <span className="text-[11px] text-gray-400">Không có</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              faq.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                faq.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                            />
                            {faq.isActive ? 'Đang dùng' : 'Tắt'}
                          </span>
                          <button
                            onClick={() => openModal(faq)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                            title="Chỉnh sửa"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(faq)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            title="Xoá"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    FAQ giúp chatbot có câu trả lời nhất quán với định hướng nội dung của website.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Câu hỏi người dùng (Vietnamese)
                    </label>
                    <textarea
                      name="question"
                      value={form.question}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ví dụ: Tại sao nên dùng ống hút tre thay vì ống hút nhựa?"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Câu trả lời mẫu
                    </label>
                    <textarea
                      name="answer"
                      value={form.answer}
                      onChange={handleFormChange}
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Câu trả lời rõ ràng, ngắn gọn, đúng định hướng zero-waste. Ví dụ: Ống hút tre có thể tái sử dụng nhiều lần..."
                      required
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Chatbot sẽ sử dụng câu trả lời này làm nguồn tham khảo, có thể diễn đạt lại bằng ngôn ngữ tự nhiên.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại nội dung
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="product">Sản phẩm / tính năng</option>
                      <option value="green_lifestyle">Mẹo sống xanh</option>
                      <option value="policy">Chính sách / quy định</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đối tượng sử dụng
                    </label>
                    <select
                      name="audience"
                      value={form.audience}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="both">Cả khách vãng lai & đã đăng nhập</option>
                      <option value="guest">Chỉ khách vãng lai</option>
                      <option value="user">Chỉ khách đã đăng nhập</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag (từ khoá, cách nhau bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={form.tags}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ví dụ: ống hút tre, giảm nhựa, đồ uống, quán cà phê"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Tag giúp hệ thống tìm FAQ phù hợp khi người dùng hỏi (dùng regex theo nội dung câu hỏi).
                    </p>
                  </div>
                  <div className="flex items-center gap-3 md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Sử dụng FAQ này trong chatbot
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {saving && (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {editingFaq ? 'Lưu thay đổi' : 'Thêm FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotFaqManagement;

