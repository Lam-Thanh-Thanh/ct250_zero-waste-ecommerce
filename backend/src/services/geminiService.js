const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { AVAILABLE_FUNCTIONS } = require('./inventoryService');

// ===== CẤU HÌNH =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY chưa được cấu hình trong biến môi trường!');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ===== KHAI BÁO TOOL / FUNCTION DECLARATIONS =====

const toolDeclarations = [
  {
    functionDeclarations: [
      {
        name: 'checkProductStock',
        description:
          'Tra cứu thông tin tồn kho (số lượng còn lại, giá, trạng thái) của một sản phẩm trong cửa hàng Zero-Waste Store dựa trên tên sản phẩm. ' +
          'Gọi hàm này khi người dùng hỏi về: số lượng tồn kho, sản phẩm còn hàng không, còn bao nhiêu cái, giá sản phẩm cụ thể, hoặc thông tin chi tiết của một sản phẩm cụ thể trong cửa hàng.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: {
              type: SchemaType.STRING,
              description:
                'Tên sản phẩm cần tra cứu (tiếng Việt hoặc tiếng Anh). Ví dụ: "Ống hút tre", "Túi vải canvas", "Bàn chải tre".'
            }
          },
          required: ['productName']
        }
      }
    ]
  }
];

// ===== GENERATION CONFIG =====

const defaultGenerationConfig = {
  temperature: 0.7,
  maxOutputTokens: 1024,
  topP: 0.9
};

// ===== HÀM GỌI GEMINI VỚI FUNCTION CALLING =====

/**
 * Gửi tin nhắn đến Gemini và xử lý vòng lặp Function Calling
 *
 * @param {Object} options
 * @param {string} options.systemPrompt - Prompt hệ thống
 * @param {string} options.userMessage - Câu hỏi của người dùng
 * @param {string[]} options.contextDocs - FAQ context
 * @param {string} options.language - Ngôn ngữ (vi/en)
 * @returns {Promise<string>} Câu trả lời cuối cùng dạng text
 */
const callGeminiWithTools = async ({
  systemPrompt,
  userMessage,
  contextDocs = [],
  language = 'vi'
}) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Thiếu GEMINI_API_KEY trong biến môi trường');
  }

  // Tạo system instruction
  const systemInstruction =
    `${systemPrompt}\n\n` +
    `Ngôn ngữ trả lời: ${language === 'vi' ? 'Tiếng Việt' : 'English'}. ` +
    'Chỉ trả lời bằng văn bản, không xử lý hoặc đề cập tới âm thanh/giọng nói.\n\n' +
    'KHI TRA CỨU SẢN PHẨM:\n' +
    '- Khi người dùng hỏi về một sản phẩm cụ thể (tồn kho, giá cả, còn hàng không...), hãy sử dụng hàm checkProductStock để tra cứu dữ liệu thực từ database.\n' +
    '- Dựa trên kết quả trả về, tạo câu trả lời tự nhiên, thân thiện.\n' +
    '- Nếu không tìm thấy sản phẩm, thông báo lịch sự và gợi ý khách kiểm tra lại tên hoặc duyệt danh mục trên website.\n' +
    '- Nếu tìm thấy nhiều sản phẩm, liệt kê cho khách và hỏi họ muốn biết về sản phẩm nào.';

  // Tạo context text từ FAQ docs
  const contextText =
    contextDocs.length > 0
      ? 'Thông tin nội bộ và câu hỏi–trả lời mẫu (ưu tiên tham khảo nếu phù hợp, không tự bịa thêm):\n\n' +
        contextDocs.join('\n\n')
      : '';

  // Khởi tạo model với tools
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    tools: toolDeclarations,
    generationConfig: defaultGenerationConfig
  });

  // Tạo nội dung tin nhắn user
  const fullUserMessage =
    `${contextText ? `${contextText}\n\n---\n\n` : ''}` +
    `Câu hỏi của người dùng:\n${userMessage}`;

  // Bắt đầu chat session
  const chat = model.startChat();

  // Gửi tin nhắn đầu tiên
  let result = await chat.sendMessage(fullUserMessage);
  let response = result.response;

  // ===== VÒNG LẶP FUNCTION CALLING =====
  // Gemini có thể trả về functionCall thay vì text
  // Tối đa 5 vòng để tránh infinite loop
  const MAX_FUNCTION_CALLS = 5;
  let functionCallCount = 0;

  while (functionCallCount < MAX_FUNCTION_CALLS) {
    // Lấy danh sách function calls từ response
    const functionCalls = response.functionCalls();

    // Nếu không có function call → Gemini đã trả lời xong
    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    console.log(`[Gemini] Function call(s) detected: ${functionCalls.map((fc) => fc.name).join(', ')}`);

    // Xử lý từng function call
    const functionResponses = [];

    for (const fc of functionCalls) {
      const funcName = fc.name;
      const funcArgs = fc.args;

      console.log(`[Gemini] Executing ${funcName} with args:`, JSON.stringify(funcArgs));

      // Tìm và thực thi hàm tương ứng
      const func = AVAILABLE_FUNCTIONS[funcName];

      let funcResult;
      if (func) {
        try {
          funcResult = await func(funcArgs.productName);
        } catch (error) {
          console.error(`[Gemini] Error executing ${funcName}:`, error);
          funcResult = {
            error: true,
            message: 'Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại sau.'
          };
        }
      } else {
        console.warn(`[Gemini] Unknown function: ${funcName}`);
        funcResult = {
          error: true,
          message: `Hàm "${funcName}" không tồn tại trong hệ thống.`
        };
      }

      console.log(`[Gemini] ${funcName} result:`, JSON.stringify(funcResult));

      functionResponses.push({
        functionResponse: {
          name: funcName,
          response: funcResult
        }
      });
    }

    // Gửi kết quả function call ngược lại cho Gemini
    result = await chat.sendMessage(functionResponses);
    response = result.response;
    functionCallCount++;
  }

  // ===== TRÍCH XUẤT CÂU TRẢ LỜI CUỐI CÙNG =====
  const text = response.text();

  if (!text || !text.trim()) {
    return 'Xin lỗi, mình chưa thể trả lời câu hỏi này. Bạn thử diễn đạt lại nhé!';
  }

  // Kiểm tra safety filter
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    return 'Xin lỗi, mình không thể trả lời câu hỏi này do vi phạm chính sách nội dung. Bạn vui lòng hỏi câu khác nhé!';
  }

  return text.trim();
};

// ===== HÀM GỌI GEMINI KHÔNG CÓ TOOLS (backward compatible) =====

const callGemini = async ({ systemPrompt, userMessage, contextDocs = [], language = 'vi' }) => {
  // Gọi lại callGeminiWithTools — vẫn hoạt động bình thường cho câu hỏi thông thường
  // vì Gemini sẽ chỉ gọi tool khi thật sự cần
  return callGeminiWithTools({ systemPrompt, userMessage, contextDocs, language });
};

module.exports = {
  callGemini,
  callGeminiWithTools
};
