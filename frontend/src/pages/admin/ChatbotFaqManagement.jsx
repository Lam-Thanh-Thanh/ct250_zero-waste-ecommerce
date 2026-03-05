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

const CATEGORY_MAP = {
  product: { label: 'Sản phẩm', color: 'bg-blue-50 text-blue-700' },
  green_lifestyle: { label: 'Mẹo sống xanh', color: 'bg-primary-50 text-primary-700' },
  policy: { label: 'Chính sách', color: 'bg-amber-50 text-amber-700' },
  other: { label: 'Khác', color: 'bg-gray-100 text-gray-600' }
};

const AUDIENCE_MAP = {
  guest: { label: 'Khách vãng lai', color: 'bg-gray-100 text-gray-600' },
  user: { label: 'Đã đăng nhập', color: 'bg-purple-50 text-purple-700' },
  both: { label: 'Cả hai', color: 'bg-gray-100 text-gray-600' }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Quản lý FAQ Chatbot</h1>
                {faqs.length > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-full">
                    {faqs.length}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">Quản lý câu hỏi–trả lời mẫu để chatbot trả lời đúng định hướng zero-waste</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin/chatbot-config"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Cấu hình chatbot
              </Link>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm FAQ mới
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo câu hỏi, câu trả lời hoặc tag..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Tất cả loại nội dung</option>
              <option value="product">Sản phẩm</option>
              <option value="green_lifestyle">Mẹo sống xanh</option>
              <option value="policy">Chính sách / quy định</option>
              <option value="other">Khác</option>
            </select>
            <select
              value={filters.audience}
              onChange={(e) => handleFilterChange('audience', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Tất cả đối tượng</option>
              <option value="guest">Khách vãng lai</option>
              <option value="user">Khách đã đăng nhập</option>
              <option value="both">Cả hai</option>
            </select>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="true">Đang dùng</option>
              <option value="false">Tắt</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="py-20 text-center">
              <svg
                className="mx-auto w-14 h-14 text-gray-300 mb-4"
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
              <p className="text-gray-500 text-lg font-medium">
                Chưa có câu hỏi–trả lời mẫu nào
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Hãy thêm FAQ để chatbot có kiến thức nền tảng chính xác
              </p>
              <button
                onClick={() => openModal()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm FAQ đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Câu hỏi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trả lời mẫu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Phân loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {faqs.map((faq) => {
                    const cat = CATEGORY_MAP[faq.category] || CATEGORY_MAP.other;
                    const aud = AUDIENCE_MAP[faq.audience] || AUDIENCE_MAP.both;
                    return (
                      <tr key={faq._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 align-top" style={{ maxWidth: '240px' }}>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {faq.question}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top" style={{ maxWidth: '320px' }}>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {faq.answer}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full w-fit ${cat.color}`}>
                              {cat.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full w-fit ${aud.color}`}>
                              {aud.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap gap-1">
                            {(faq.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {(!faq.tags || faq.tags.length === 0) && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              faq.isActive
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                faq.isActive ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                            {faq.isActive ? 'Đang dùng' : 'Tắt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openModal(faq)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(faq)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Xoá"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    FAQ giúp chatbot có câu trả lời nhất quán với định hướng nội dung
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="px-6 py-5">
                <div className="space-y-5">
                  {/* Question */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Câu hỏi người dùng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="question"
                      value={form.question}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                      placeholder="Ví dụ: Tại sao nên dùng ống hút tre thay vì ống hút nhựa?"
                      required
                    />
                  </div>

                  {/* Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Câu trả lời mẫu <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="answer"
                      value={form.answer}
                      onChange={handleFormChange}
                      rows={5}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                      placeholder="Câu trả lời rõ ràng, ngắn gọn, đúng định hướng zero-waste..."
                      required
                    />
                    <p className="mt-1.5 text-xs text-gray-400">
                      Chatbot sẽ sử dụng câu trả lời này làm nguồn tham khảo, có thể diễn đạt lại bằng ngôn ngữ tự nhiên.
                    </p>
                  </div>

                  {/* Category + Audience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Loại nội dung
                      </label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      >
                        <option value="product">Sản phẩm / tính năng</option>
                        <option value="green_lifestyle">Mẹo sống xanh</option>
                        <option value="policy">Chính sách / quy định</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Đối tượng sử dụng
                      </label>
                      <select
                        name="audience"
                        value={form.audience}
                        onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      >
                        <option value="both">Cả khách vãng lai & đã đăng nhập</option>
                        <option value="guest">Chỉ khách vãng lai</option>
                        <option value="user">Chỉ khách đã đăng nhập</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tag (từ khoá, cách nhau bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={form.tags}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ví dụ: ống hút tre, giảm nhựa, đồ uống"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">
                      Tag giúp hệ thống tìm FAQ phù hợp khi người dùng hỏi.
                    </p>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleFormChange}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 transition-colors" />
                      <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.isActive ? 'translate-x-4' : ''}`} />
                    </label>
                    <span className="text-sm text-gray-700">
                      Sử dụng FAQ này trong chatbot
                    </span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors"
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
