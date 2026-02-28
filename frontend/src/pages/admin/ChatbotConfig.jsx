import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getChatbotConfig, updateChatbotConfig } from '../../api/chatbotApi';
import { Link } from 'react-router-dom';

const ChatbotConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cấu hình Chatbot AI</h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý prompt và hành vi tư vấn văn bản cho khách vãng lai và khách đã đăng nhập.
            </p>
          </div>
          <Link
            to="/admin/chatbot-faqs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium"
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5l-4-4H9a7 7 0 110-14 7 7 0 017 7v7z"
              />
            </svg>
            Quản lý câu hỏi–trả lời mẫu
          </Link>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Mục tiêu chatbot
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Chatbot được thiết kế để tư vấn <span className="font-semibold">bằng văn bản</span>, không xử lý giọng
              nói. Với khách vãng lai, tập trung giải thích lợi ích sản phẩm zero-waste và gợi ý mẹo sống xanh cơ bản.
              Với khách đã đăng nhập, ưu tiên tư vấn sản phẩm phù hợp với nhu cầu cá nhân và gợi ý thói quen sống xanh
              cụ thể dựa trên thông tin người dùng.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-emerald-50 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Gợi ý viết prompt
            </h2>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Viết bằng tiếng Việt, rõ ràng, định nghĩa rõ vai trò của chatbot.</li>
              <li>Hạn chế khẳng định về sức khoẻ/y tế; khuyến khích người dùng kiểm tra thông tin quan trọng.</li>
              <li>Nhấn mạnh thái độ thân thiện, khuyến khích lối sống xanh đơn giản, dễ áp dụng.</li>
              <li>Không yêu cầu hoặc xử lý âm thanh, chỉ tập trung trả lời văn bản.</li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Thiết lập chung
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Bật/tắt chatbot, cấu hình ngôn ngữ và số lượng tin nhắn lịch sử được sử dụng.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm text-gray-700">Trạng thái</span>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!config.enabled}
                    onChange={(e) => handleChange('enabled', e.target.checked)}
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                  <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform ${config.enabled ? 'translate-x-5' : ''}`} />
                </div>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Ngôn ngữ:</label>
                <select
                  value={config.language || 'vi'}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">
                  Số tin nhắn lịch sử:
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={config.maxHistoryMessages ?? 10}
                  onChange={(e) => handleChange('maxHistoryMessages', e.target.value)}
                  className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Prompt cho khách vãng lai
                </label>
                <span className="text-[11px] text-gray-500">
                  Đối tượng: khách chưa đăng nhập
                </span>
              </div>
              <textarea
                value={config.systemPromptGuest || ''}
                onChange={(e) => handleChange('systemPromptGuest', e.target.value)}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: Bạn là chatbot tư vấn về lối sống xanh và sản phẩm zero-waste cho khách truy cập chưa đăng nhập..."
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Nên tập trung: giải thích lợi ích sản phẩm zero-waste, khái niệm cơ bản, mẹo sống xanh đơn giản, không cá nhân hoá theo từng người dùng.
              </p>
            </div>

            {/* Logged-in user prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Prompt cho khách đã đăng nhập
                </label>
                <span className="text-[11px] text-gray-500">
                  Đối tượng: người dùng đã đăng nhập
                </span>
              </div>
              <textarea
                value={config.systemPromptUser || ''}
                onChange={(e) => handleChange('systemPromptUser', e.target.value)}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: Bạn là trợ lý cá nhân hóa cho khách hàng đã đăng nhập của website bán sản phẩm zero-waste..."
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Nên tận dụng: tên người dùng, điểm xanh, lịch sử đơn hàng (nếu backend bổ sung) để gợi ý sản phẩm và thói quen sống xanh cụ thể, vẫn giữ thái độ trung lập và an toàn.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-500">
              Lưu ý: Chatbot chỉ tư vấn bằng văn bản, không thu âm hay xử lý giọng nói của người dùng.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Lưu cấu hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotConfig;

