let fetchFn = global.fetch;

if (!fetchFn) {
  try {
    // eslint-disable-next-line global-require
    fetchFn = require('node-fetch');
  } catch (error) {
    throw new Error(
      'Fetch API không khả dụng. Vui lòng dùng Node 18+ hoặc cài thêm gói "node-fetch".'
    );
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Gọi Gemini để sinh câu trả lời dạng văn bản
 * @param {Object} options
 * @param {String} options.systemPrompt - Prompt hệ thống (vai trò, phạm vi tư vấn)
 * @param {String} options.userMessage - Câu hỏi của người dùng (đã enrich nếu cần)
 * @param {Array<String>} options.contextDocs - Danh sách đoạn FAQ / kiến thức nội bộ
 * @param {String} options.language - Mã ngôn ngữ (vi/en)
 */
const callGemini = async ({ systemPrompt, userMessage, contextDocs = [], language = 'vi' }) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Thiếu GEMINI_API_KEY trong biến môi trường');
  }

  const systemInstruction = {
    parts: [
      {
        text:
          `${systemPrompt}\n\n` +
          `Ngôn ngữ trả lời: ${language === 'vi' ? 'Tiếng Việt' : 'English'}. ` +
          'Chỉ trả lời bằng văn bản, không xử lý hoặc đề cập tới âm thanh/giọng nói.'
      }
    ]
  };

  const contextText =
    contextDocs.length > 0
      ? 'Thông tin nội bộ và câu hỏi–trả lời mẫu (ưu tiên tham khảo nếu phù hợp, không tự bịa thêm):\n\n' +
      contextDocs.join('\n\n')
      : '';

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text:
            `${contextText ? `${contextText}\n\n---\n\n` : ''}` +
            `Câu hỏi của người dùng:\n${userMessage}`
        }
      ]
    }
  ];

  // Timeout 25 giây để tránh treo vĩnh viễn
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction,
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API raw error:', errorText);
      throw new Error(`Gemini API lỗi (${response.status}): Vui lòng thử lại sau.`);
    }

    const data = await response.json();

    // Kiểm tra nếu bị chặn bởi safety filter
    if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
      return 'Xin lỗi, mình không thể trả lời câu hỏi này do vi phạm chính sách nội dung. Bạn vui lòng hỏi câu khác nhé!';
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(' ') || '';

    if (!text.trim()) {
      return 'Xin lỗi, mình chưa thể trả lời câu hỏi này. Bạn thử diễn đạt lại nhé!';
    }

    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  callGemini
};
