import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../hooks/useAuth';
import { askChatbot, getSuggestedFaqs } from '../../api/chatbotApi';

// ===== CATEGORY LABELS (khớp với admin ChatbotFaqManagement) =====

const CATEGORY_LABELS = {
  product: { label: 'Sản phẩm', icon: '🛒' },
  green_lifestyle: { label: 'Mẹo sống xanh', icon: '🌿' },
  policy: { label: 'Chính sách', icon: '📋' },
  other: { label: 'Khác', icon: '💡' }
};

// ===== TYPING ANIMATION HOOK =====

const useTypingEffect = (text, speed = 12, enabled = false) => {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayed(text || '');
      setIsDone(true);
      return;
    }

    setDisplayed('');
    setIsDone(false);
    let index = 0;

    const interval = setInterval(() => {
      index += 2;
      if (index >= text.length) {
        setDisplayed(text);
        setIsDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.substring(0, index));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayed, isDone };
};

// ===== TYPING MESSAGE COMPONENT =====

const TypingMessage = ({ text, onDone }) => {
  const { displayed, isDone } = useTypingEffect(text, 12, true);

  useEffect(() => {
    if (isDone && onDone) onDone();
  }, [isDone, onDone]);

  return (
    <div className="prose-chat">
      <ReactMarkdown>{displayed}</ReactMarkdown>
      {!isDone && (
        <span className="inline-block w-1.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
      )}
    </div>
  );
};

// ===== STATIC MESSAGE COMPONENT =====

const StaticMessage = ({ text }) => (
  <div className="prose-chat">
    <ReactMarkdown>{text}</ReactMarkdown>
  </div>
);

// ===== FAQ PANEL (FOOTER, COLLAPSIBLE, GROUPED BY CATEGORY) =====

const FaqPanel = ({ faqs, onSelect, disabled, isExpanded, onToggle }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  // Group FAQs by category
  const grouped = useMemo(() => {
    const map = {};
    faqs.forEach((faq) => {
      const cat = faq.category || 'other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(faq);
    });
    return map;
  }, [faqs]);

  const categories = Object.keys(grouped);

  // Đặt category đầu tiên làm mặc định
  useEffect(() => {
    if (categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  if (!faqs || faqs.length === 0) return null;

  const activeFaqs = activeCategory ? (grouped[activeCategory] || []) : [];

  return (
    <div className="border-t border-gray-100 bg-gray-50/80 flex-shrink-0">
      {/* Toggle header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100/80 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Câu hỏi thường gặp
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[220px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pb-2.5">
          {/* Category tabs */}
          <div className="flex gap-1 mb-2 flex-wrap">
            {categories.map((cat) => {
              const info = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  {info.icon} {info.label}
                </button>
              );
            })}
          </div>

          {/* FAQ items */}
          <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto pr-1">
            {activeFaqs.map((faq) => (
              <button
                key={faq._id}
                onClick={() => onSelect(faq)}
                disabled={disabled}
                className="flex items-start gap-2 px-2.5 py-2 text-left text-xs text-gray-700
                  hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-lg
                  transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                  active:scale-[0.98] group"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="line-clamp-2 leading-relaxed">{faq.question}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN CHATBOT WIDGET =====

const ChatbotWidget = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingMsgId, setTypingMsgId] = useState(null);
  const [suggestedFaqs, setSuggestedFaqs] = useState([]);
  const [faqExpanded, setFaqExpanded] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Welcome message
  const welcomeMsg = isAuthenticated
    ? `Xin chào${user?.username ? ` ${user.username}` : ''}! Mình là trợ lý AI của Zero-Waste Store 🌿\n\nBạn có thể bấm vào các câu hỏi thường gặp bên dưới, hoặc nhập câu hỏi riêng để mình tư vấn thêm.`
    : 'Xin chào! Mình là trợ lý AI của Zero-Waste Store 🌿\n\nBạn có thể bấm vào các câu hỏi thường gặp bên dưới để tìm hiểu nhanh, hoặc nhập câu hỏi riêng để mình tư vấn.';

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: welcomeMsg,
        typed: true
      }
    ]);

    const loadSuggestions = async () => {
      try {
        const res = await getSuggestedFaqs();
        if (res?.success && res.data) {
          setSuggestedFaqs(res.data);
        }
      } catch {
        // Bỏ qua
      }
    };
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, typingMsgId, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ======= GỬI CÂU HỎI RIÊNG CHO AI =======
  const handleSendToAI = async (messageText) => {
    const trimmed = (messageText || input).trim();
    if (!trimmed || loading) return;

    const newUserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      typed: true
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askChatbot({ message: trimmed });

      if (!response?.success) {
        throw new Error(response?.message || 'Chatbot hiện không khả dụng');
      }

      const answer = response.data?.answer || 'Xin lỗi, mình chưa thể trả lời câu hỏi này.';
      const msgId = `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: msgId, role: 'assistant', text: answer, typed: false }
      ]);
      setTypingMsgId(msgId);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error(
        error?.message || error?.response?.data?.message || 'Có lỗi xảy ra khi gọi chatbot'
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: 'Xin lỗi, hiện tại mình đang gặp sự cố nên không thể trả lời. Bạn vui lòng thử lại sau nhé 🙏',
          typed: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ======= BẤM FAQ → HIỆN TRẢ LỜI TRỰC TIẾP + AUTO COLLAPSE =======
  const handleFaqSelect = (faq) => {
    if (loading || typingMsgId) return;

    const userMsg = {
      id: `user-faq-${Date.now()}`,
      role: 'user',
      text: faq.question,
      typed: true
    };

    const msgId = `faq-answer-${Date.now()}`;
    const answerMsg = {
      id: msgId,
      role: 'assistant',
      text: faq.answer,
      typed: false,
      isFaqAnswer: true
    };

    setMessages((prev) => [...prev, userMsg, answerMsg]);
    setTypingMsgId(msgId);

    // Auto thu nhỏ FAQ panel
    setFaqExpanded(false);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    handleSendToAI();
  };

  const handleTypingDone = useCallback((msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, typed: true } : m))
    );
    setTypingMsgId(null);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = loading || !!typingMsgId;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* ===== Floating Button ===== */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="group flex items-center gap-3 px-4 py-3 rounded-full shadow-lg
            bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600
            text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-emerald-500 hover:shadow-xl hover:-translate-y-0.5"
        >
          <span className="relative inline-flex">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/90 text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5l-4-4H9a7 7 0 110-14 7 7 0 017 7v7z" />
              </svg>
            </span>
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400" />
            </span>
          </span>
          <div className="hidden sm:block text-left">
            <div className="text-xs uppercase tracking-wide font-semibold text-emerald-100">
              Chatbot AI
            </div>
            <div className="text-sm font-medium leading-tight">
              Hỏi ngay về sống xanh
            </div>
          </div>
        </button>
      )}

      {/* ===== Chat Panel ===== */}
      {isOpen && (
        <div className="w-[370px] sm:w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col animate-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5l-4-4H9a7 7 0 110-14 7 7 0 017 7v7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    Zero-Waste Assistant
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase flex-shrink-0">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 mt-0.5 truncate">
                  {isAuthenticated
                    ? 'Tư vấn & thói quen sống xanh phù hợp với bạn'
                    : 'Tìm hiểu sản phẩm zero-waste & mẹo sống xanh'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleOpen}
              className="text-emerald-50 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 bg-gradient-to-b from-emerald-50/60 via-white to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-md'
                      : msg.isFaqAnswer
                      ? 'bg-emerald-50 text-gray-800 border border-emerald-200 rounded-bl-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      {msg.isFaqAnswer && msg.typed && (
                        <div className="flex items-center gap-1 mb-1.5 text-[10px] text-emerald-600 font-medium uppercase tracking-wide">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Câu trả lời mẫu
                        </div>
                      )}
                      {msg.typed ? (
                        <StaticMessage text={msg.text} />
                      ) : (
                        <TypingMessage text={msg.text} onDone={() => handleTypingDone(msg.id)} />
                      )}
                    </>
                  ) : (
                    <p className="whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="mb-3 flex items-start">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mr-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* FAQ Panel — footer, collapsible, grouped by category */}
          {suggestedFaqs.length > 0 && (
            <FaqPanel
              faqs={suggestedFaqs}
              onSelect={handleFaqSelect}
              disabled={isDisabled}
              isExpanded={faqExpanded}
              onToggle={() => setFaqExpanded((v) => !v)}
            />
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white px-3 py-2.5 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAuthenticated
                    ? 'Hỏi về sản phẩm, thói quen sống xanh...'
                    : 'Hỏi về sản phẩm zero-waste hoặc mẹo sống xanh...'
                }
                disabled={isDisabled}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                  max-h-24 disabled:opacity-50 disabled:bg-gray-50 placeholder:text-gray-400
                  transition-shadow"
              />
              <button
                type="submit"
                disabled={isDisabled || !input.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-full
                  bg-emerald-600 text-white hover:bg-emerald-700
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150
                  active:scale-95 shadow-sm hover:shadow"
                title="Gửi"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-400">
              AI có thể sai sót • Chỉ tư vấn văn bản, không xử lý giọng nói
            </p>
          </form>
        </div>
      )}

      {/* ===== INLINE STYLES ===== */}
      <style>{`
        .animate-in {
          animation: chatSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Markdown prose inside chat bubbles */
        .prose-chat p {
          margin: 0 0 0.4em 0;
          line-height: 1.6;
        }
        .prose-chat p:last-child {
          margin-bottom: 0;
        }
        .prose-chat ul {
          list-style-type: disc !important;
          margin: 0.3em 0;
          padding-left: 1.3em;
        }
        .prose-chat ol {
          list-style-type: decimal !important;
          margin: 0.3em 0;
          padding-left: 1.3em;
        }
        .prose-chat li {
          margin-bottom: 0.2em;
          line-height: 1.5;
          display: list-item !important;
        }
        .prose-chat li::marker {
          color: #059669;
        }
        .prose-chat strong {
          font-weight: 600;
          color: inherit;
        }
        .prose-chat em {
          font-style: italic;
        }
        .prose-chat a {
          color: #059669;
          text-decoration: underline;
        }
        .prose-chat h1, .prose-chat h2, .prose-chat h3,
        .prose-chat h4, .prose-chat h5, .prose-chat h6 {
          font-size: inherit;
          font-weight: 600;
          margin: 0.5em 0 0.25em 0;
        }
        .prose-chat code {
          background: #f3f4f6;
          padding: 0.1em 0.35em;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .prose-chat pre {
          background: #f3f4f6;
          padding: 0.5em;
          border-radius: 6px;
          overflow-x: auto;
          font-size: 0.85em;
          margin: 0.35em 0;
        }
        .prose-chat blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 0.75em;
          margin: 0.35em 0;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default ChatbotWidget;
