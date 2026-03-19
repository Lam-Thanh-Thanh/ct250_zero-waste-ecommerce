import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getChatbotConfig, updateChatbotConfig, resetChatbotConfig } from '../../api/chatbotApi';
import { Link } from 'react-router-dom';

const ChatbotConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getChatbotConfig();
        setConfig(data.data);
      } catch (error) {
        console.error('Error loading chatbot config:', error);
        toast.error(error.message || 'Không thể tải cấu hình chatbot');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      const payload = {
        systemPromptGuest: config.systemPromptGuest,
        systemPromptUser: config.systemPromptUser,
        maxHistoryMessages: Number(config.maxHistoryMessages) || 0,
        language: config.language,
        enabled: !!config.enabled
      };

      const data = await updateChatbotConfig(payload);
      setConfig(data.data);
      toast.success('Cập nhật cấu hình chatbot thành công');
    } catch (error) {
      console.error('Error updating chatbot config:', error);
      toast.error(error.message || 'Không thể cập nhật cấu hình chatbot');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Bạn có chắc muốn đặt lại prompt về mặc định? Prompt hiện tại sẽ bị ghi đè.')) return;
    setResetting(true);
    try {
      const data = await resetChatbotConfig();
      setConfig(data.data);
      toast.success('Đã đặt lại prompt về mặc định');
    } catch (error) {
      toast.error(error.message || 'Không thể đặt lại prompt');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cấu hình Chatbot AI</h1>
        <p className="text-gray-600">Không thể tải cấu hình chatbot. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Cấu hình Chatbot</h1>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.enabled
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-500 bg-gray-100'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.enabled ? 'bg-primary-500' : 'bg-gray-400'}`} />
                  {config.enabled ? 'Đang hoạt động' : 'Đã tắt'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">Quản lý prompt hệ thống và thiết lập hành vi chatbot</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTips(!showTips)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hướng dẫn
              </button>
              <Link
                to="/admin/chatbot-faqs"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5l-4-4H9a7 7 0 110-14 7 7 0 017 7v7z" />
                </svg>
                Quản lý FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Tips - Collapsible */}
        {showTips && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mục tiêu chatbot
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Chatbot tư vấn <span className="font-medium">bằng văn bản</span>, không xử lý giọng nói.
                  Với khách vãng lai — giải thích lợi ích zero-waste, gợi ý mẹo sống xanh.
                  Với khách đã đăng nhập — tư vấn cá nhân hoá dựa trên thông tin người dùng.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Gợi ý viết prompt
                </h3>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    Viết bằng tiếng Việt, rõ ràng, định nghĩa rõ vai trò chatbot
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    Hạn chế khẳng định về sức khoẻ/y tế
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    Nhấn mạnh thái độ thân thiện, khuyến khích lối sống xanh
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    Chỉ tập trung trả lời văn bản, không yêu cầu xử lý âm thanh
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Thiết lập chung</h2>
              <p className="text-xs text-gray-500 mt-0.5">Bật/tắt chatbot</p> {/* cấu hình ngôn ngữ và số tin nhắn lịch sử */}
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-6">
                {/* Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Trạng thái</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!config.enabled}
                      onChange={(e) => handleChange('enabled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 transition-colors" />
                    <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${config.enabled ? 'translate-x-5' : ''}`} />
                  </label>
                  <span className={`text-xs font-medium ${config.enabled ? 'text-primary-600' : 'text-gray-400'}`}>
                    {config.enabled ? 'Bật' : 'Tắt'}
                  </span>
                </div>

                {/* Nút đặt lại prompt */}
                <div className="w-px h-8 bg-gray-200 hidden md:block" />
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Đặt lại cả 2 prompt về giá trị mặc định ban đầu"
                >
                  {resetting ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Đặt lại mặc định
                </button>

                {/* Tạm ẩn: Ngôn ngữ & Số tin nhắn lịch sử (chưa cần dùng)
                <div className="w-px h-8 bg-gray-200 hidden md:block" />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Ngôn ngữ</label>
                  <select
                    value={config.language || 'vi'}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh</option>
                  </select>
                </div>
                <div className="w-px h-8 bg-gray-200 hidden md:block" />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Số tin nhắn lịch sử</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={config.maxHistoryMessages ?? 10}
                    onChange={(e) => handleChange('maxHistoryMessages', e.target.value)}
                    className="w-20 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                */}
              </div>
            </div>
          </div>

          {/* Prompt Editors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest Prompt */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Prompt khách vãng lai</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Chưa đăng nhập
                  </span>
                </div>
              </div>
              <div className="p-5">
                <textarea
                  value={config.systemPromptGuest || ''}
                  onChange={(e) => handleChange('systemPromptGuest', e.target.value)}
                  rows={12}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y leading-relaxed"
                  placeholder="Ví dụ: Bạn là chatbot tư vấn về lối sống xanh và sản phẩm zero-waste cho khách truy cập chưa đăng nhập..."
                />
                <p className="mt-2 text-xs text-gray-400">
                  Nên tập trung: giải thích lợi ích sản phẩm zero-waste, khái niệm cơ bản, mẹo sống xanh đơn giản.
                </p>
              </div>
            </div>

            {/* User Prompt */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Prompt khách đã đăng nhập</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Đã đăng nhập
                  </span>
                </div>
              </div>
              <div className="p-5">
                <textarea
                  value={config.systemPromptUser || ''}
                  onChange={(e) => handleChange('systemPromptUser', e.target.value)}
                  rows={12}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y leading-relaxed"
                  placeholder="Ví dụ: Bạn là trợ lý cá nhân hóa cho khách hàng đã đăng nhập của website bán sản phẩm zero-waste..."
                />
                <p className="mt-2 text-xs text-gray-400">
                  Nên tận dụng: tên người dùng, điểm xanh, lịch sử đơn hàng để gợi ý sản phẩm và thói quen sống xanh cụ thể.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Chatbot chỉ tư vấn bằng văn bản, không thu âm hay xử lý giọng nói.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotConfig;
