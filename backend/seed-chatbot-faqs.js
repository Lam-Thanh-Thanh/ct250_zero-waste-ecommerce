/**
 * Seed FAQ Chatbot — Câu hỏi-trả lời mẫu cho knowledge base
 * Chạy: node seed-chatbot-faqs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ChatbotFaq = require('./src/models/chatbotFaqModel');

const faqs = [
  // ===== SẢN PHẨM ZERO-WASTE =====
  {
    question: 'Sản phẩm zero-waste là gì?',
    answer:
      'Sản phẩm zero-waste là những sản phẩm được thiết kế để giảm thiểu tối đa rác thải.\n\n' +
      '- Được làm từ nguyên liệu tự nhiên\n' +
      '- Có thể tái sử dụng nhiều lần\n' +
      '- Phân hủy sinh học hoặc tái chế được\n\n' +
      'Ví dụ: ống hút tre, túi vải, bàn chải tre, khăn sáp ong thay màng bọc nhựa.',
    category: 'product',
    audience: 'both',
    tags: ['zero-waste', 'sản phẩm', 'giới thiệu'],
    isActive: true
  },
  {
    question: 'Ống hút tre có ưu điểm gì so với ống hút nhựa?',
    answer:
      'Ống hút tre có nhiều ưu điểm nổi bật:\n\n' +
      '- Làm từ tre tự nhiên, phân hủy sinh học hoàn toàn\n' +
      '- Có thể tái sử dụng nhiều lần (rửa sạch sau mỗi lần dùng)\n' +
      '- Không chứa BPA hay hóa chất độc hại\n' +
      '- Giúp giảm lượng rác nhựa đáng kể\n' +
      '- Bền, không bị mềm khi ngâm lâu trong nước',
    category: 'product',
    audience: 'both',
    tags: ['ống hút tre', 'ống hút', 'nhựa', 'tre'],
    isActive: true
  },
  {
    question: 'Túi vải canvas có thể thay thế túi nilon không?',
    answer:
      'Hoàn toàn có thể!\n\n' +
      '- Một chiếc túi vải canvas thay thế hàng trăm túi nilon dùng một lần\n' +
      '- Túi vải bền, chịu tải tốt, dễ giặt\n' +
      '- Có thể sử dụng trong nhiều năm\n\n' +
      'Mẹo: Mang theo 1-2 túi vải khi đi chợ hoặc siêu thị để giảm sử dụng túi nilon.',
    category: 'product',
    audience: 'both',
    tags: ['túi vải', 'canvas', 'túi nilon', 'thay thế'],
    isActive: true
  },
  {
    question: 'Bàn chải tre có tốt cho răng không?',
    answer:
      'Bàn chải tre hoạt động tương tự bàn chải nhựa thông thường.\n\n' +
      '- Lông bàn chải làm từ nylon mềm, an toàn cho nướu và men răng\n' +
      '- Cán làm từ tre — phân hủy sinh học sau khi bỏ đi\n' +
      '- Nên thay mỗi 3 tháng, giống bàn chải thường\n\n' +
      'Sử dụng bàn chải tre giúp bạn giảm rác nhựa mỗi ngày.',
    category: 'product',
    audience: 'both',
    tags: ['bàn chải tre', 'răng', 'tre'],
    isActive: true
  },
  {
    question: 'Khăn sáp ong dùng để làm gì?',
    answer:
      'Khăn sáp ong (beeswax wrap) thay thế màng bọc thực phẩm nhựa.\n\n' +
      'Cách dùng:\n' +
      '- Dùng hơi ấm từ tay để ép khăn ôm sát thực phẩm\n' +
      '- Rửa bằng nước mát và xà phòng nhẹ sau mỗi lần dùng\n' +
      '- Tái sử dụng được trong 6-12 tháng\n' +
      '- Khi hết tuổi thọ, khăn phân hủy sinh học hoàn toàn',
    category: 'product',
    audience: 'both',
    tags: ['khăn sáp ong', 'beeswax', 'bọc thực phẩm'],
    isActive: true
  },
  {
    question: 'Làm sao bảo quản sản phẩm tre lâu bền?',
    answer:
      'Để sản phẩm tre bền lâu:\n\n' +
      '- Rửa sạch sau mỗi lần dùng bằng nước ấm\n' +
      '- Phơi khô hoàn toàn trước khi cất\n' +
      '- Tránh ngâm trong nước quá lâu\n' +
      '- Bảo quản nơi khô ráo, thoáng mát\n' +
      '- Không dùng trong lò vi sóng hay máy rửa chén nhiệt độ cao',
    category: 'product',
    audience: 'both',
    tags: ['bảo quản', 'tre', 'ống hút tre', 'bàn chải tre'],
    isActive: true
  },
  {
    question: 'Làm thế nào để chọn sản phẩm phù hợp?',
    answer:
      'Để chọn sản phẩm zero-waste phù hợp:\n\n' +
      '- Xác định thói quen nào tạo nhiều rác nhựa nhất\n' +
      '- Bắt đầu thay thế từ sản phẩm dùng thường xuyên nhất\n' +
      '- Đọc mô tả và đánh giá sản phẩm trên trang web\n' +
      '- Duyệt danh mục sản phẩm trên website để tìm sản phẩm phù hợp\n\n' +
      'Bạn cũng có thể nhập câu hỏi riêng để chatbot AI tư vấn thêm.',
    category: 'product',
    audience: 'both',
    tags: ['chọn sản phẩm', 'tư vấn', 'phù hợp'],
    isActive: true
  },

  // ===== MẸO SỐNG XANH =====
  {
    question: 'Bắt đầu sống xanh từ đâu?',
    answer:
      '5 bước đơn giản để bắt đầu sống xanh:\n\n' +
      '1. Mang theo túi vải khi đi mua sắm\n' +
      '2. Sử dụng bình nước cá nhân thay chai nhựa dùng 1 lần\n' +
      '3. Từ chối ống hút nhựa, dùng ống hút tre hoặc inox\n' +
      '4. Phân loại rác tại nhà\n' +
      '5. Ưu tiên sản phẩm có bao bì thân thiện môi trường\n\n' +
      'Không cần làm tất cả cùng lúc — hãy bắt đầu từ 1-2 thói quen nhỏ!',
    category: 'green_lifestyle',
    audience: 'both',
    tags: ['sống xanh', 'bắt đầu', 'thói quen', 'cơ bản'],
    isActive: true
  },
  {
    question: 'Làm sao giảm rác nhựa trong gia đình?',
    answer:
      'Một số cách hiệu quả:\n\n' +
      '- Dùng túi vải thay túi nilon\n' +
      '- Mua sắm tại cửa hàng refill (bán lẻ không bao bì)\n' +
      '- Thay màng bọc nhựa bằng khăn sáp ong hoặc hộp thủy tinh\n' +
      '- Sử dụng xà phòng, dầu gội dạng thanh\n' +
      '- Dùng bàn chải tre, dao cạo inox thay đồ nhựa dùng 1 lần\n\n' +
      'Mỗi thay đổi nhỏ đều góp phần lớn cho môi trường!',
    category: 'green_lifestyle',
    audience: 'both',
    tags: ['giảm nhựa', 'gia đình', 'rác nhựa'],
    isActive: true
  },
  {
    question: 'Phân loại rác như thế nào cho đúng?',
    answer:
      'Rác gia đình nên phân thành 3 nhóm:\n\n' +
      '- Rác hữu cơ: thức ăn thừa, vỏ trái cây, lá cây → có thể ủ compost\n' +
      '- Rác tái chế: giấy, bìa carton, lon nhôm, chai thủy tinh\n' +
      '- Rác không tái chế: túi nilon bẩn, xốp, tã, băng vệ sinh\n\n' +
      'Mẹo: Rửa sạch bao bì trước khi bỏ vào thùng tái chế, vì bao bì bẩn không thể tái chế.',
    category: 'green_lifestyle',
    audience: 'both',
    tags: ['phân loại rác', 'tái chế', 'rác hữu cơ'],
    isActive: true
  },
  {
    question: 'Composting tại nhà có khó không?',
    answer:
      'Compost tại nhà không khó nếu làm đúng cách:\n\n' +
      'Cho vào được:\n' +
      '- Vỏ rau củ, bã cà phê, vỏ trứng, lá cây\n\n' +
      'Không cho:\n' +
      '- Thịt, cá, sản phẩm sữa, dầu mỡ\n\n' +
      'Cách làm:\n' +
      '- Đảo trộn mỗi tuần, giữ ẩm vừa phải\n' +
      '- Sau 2-3 tháng sẽ có phân hữu cơ bón cây',
    category: 'green_lifestyle',
    audience: 'both',
    tags: ['compost', 'ủ phân', 'hữu cơ', 'tại nhà'],
    isActive: true
  },
  {
    question: 'Tại sao nên hạn chế nhựa dùng một lần?',
    answer:
      'Nhựa dùng một lần gây hại lớn cho môi trường:\n\n' +
      '- Mất 400-1000 năm để phân hủy trong tự nhiên\n' +
      '- Gây ô nhiễm đại dương, đe dọa sinh vật biển\n' +
      '- Tạo ra vi nhựa (microplastic) xâm nhập chuỗi thực phẩm\n' +
      '- Quá trình sản xuất thải nhiều khí CO2\n\n' +
      'Chỉ cần thay thế một vài sản phẩm nhựa dùng 1 lần, bạn đã góp phần bảo vệ hành tinh!',
    category: 'green_lifestyle',
    audience: 'both',
    tags: ['nhựa', 'dùng một lần', 'ô nhiễm', 'vi nhựa'],
    isActive: true
  },
  {
    question: 'Lối sống xanh có tốn kém không?',
    answer:
      'Sống xanh có thể tiết kiệm tiền trong dài hạn:\n\n' +
      '- Túi vải dùng nhiều năm → tiết kiệm hơn mua túi nilon mỗi ngày\n' +
      '- Bình nước cá nhân → không tốn tiền mua nước đóng chai\n' +
      '- Sản phẩm tái sử dụng → đầu tư 1 lần, dùng lâu dài\n' +
      '- Tự ủ compost → có phân bón miễn phí cho cây\n\n' +
      'Ban đầu cần đầu tư, nhưng lâu dài vừa tiết kiệm vừa bảo vệ môi trường!',
    category: 'green_lifestyle',
    audience: 'both',
    tags: ['tiết kiệm', 'chi phí', 'tốn kém'],
    isActive: true
  },

  // ===== CHÍNH SÁCH =====
  {
    question: 'Chính sách đổi trả sản phẩm như thế nào?',
    answer:
      'Chính sách đổi trả của Zero-Waste Store:\n\n' +
      '- Đổi/trả trong vòng 7 ngày kể từ ngày nhận hàng\n' +
      '- Sản phẩm phải còn nguyên tem, nhãn, chưa qua sử dụng\n' +
      '- Sản phẩm lỗi do nhà sản xuất: đổi mới miễn phí\n' +
      '- Phí vận chuyển đổi trả do khách chịu (trừ lỗi từ shop)\n\n' +
      'Để yêu cầu đổi/trả, vui lòng liên hệ qua trang web hoặc email.',
    category: 'policy',
    audience: 'both',
    tags: ['đổi trả', 'chính sách', 'bảo hành'],
    isActive: true
  },
  {
    question: 'Thời gian giao hàng là bao lâu?',
    answer:
      'Thời gian giao hàng dự kiến:\n\n' +
      '- Nội thành TP.HCM / Hà Nội: 1-2 ngày làm việc\n' +
      '- Các tỉnh thành khác: 3-5 ngày làm việc\n' +
      '- Đơn hàng được xử lý trong ngày nếu đặt trước 15h\n\n' +
      'Bạn sẽ nhận được mã vận đơn qua email để theo dõi đơn hàng.',
    category: 'policy',
    audience: 'both',
    tags: ['giao hàng', 'vận chuyển', 'thời gian'],
    isActive: true
  },
  {
    question: 'Thanh toán bằng hình thức nào?',
    answer:
      'Zero-Waste Store hỗ trợ nhiều hình thức thanh toán:\n\n' +
      '- Thanh toán khi nhận hàng (COD)\n' +
      '- Chuyển khoản ngân hàng\n' +
      '- Ví điện tử (MoMo, ZaloPay)\n' +
      '- Thẻ tín dụng / ghi nợ (Visa, Mastercard)\n\n' +
      'Tất cả giao dịch đều được bảo mật an toàn.',
    category: 'policy',
    audience: 'both',
    tags: ['thanh toán', 'cod', 'chuyển khoản', 'momo'],
    isActive: true
  },

  // ===== KHÁC =====
  {
    question: 'Điểm xanh (ecoPoints) là gì?',
    answer:
      'Điểm xanh (ecoPoints) là chương trình khách hàng thân thiện môi trường:\n\n' +
      '- Tích lũy điểm qua mỗi đơn hàng sản phẩm zero-waste\n' +
      '- Có thể đổi thành voucher giảm giá cho đơn tiếp theo\n' +
      '- Mua sản phẩm có chứng chỉ xanh nhận nhiều điểm hơn\n\n' +
      'Kiểm tra số điểm xanh trong trang hồ sơ cá nhân của bạn.',
    category: 'other',
    audience: 'both',
    tags: ['ecoPoints', 'điểm xanh', 'thưởng', 'voucher'],
    isActive: true
  }
];

async function seedFaqs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await ChatbotFaq.deleteMany({});
    console.log('Cleared old FAQs');

    const result = await ChatbotFaq.insertMany(faqs);
    console.log(`Inserted ${result.length} FAQs successfully!`);

    const byCategory = {};
    result.forEach((f) => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    });
    console.log('\nTóm tắt theo loại:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} câu`);
    });

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error seeding FAQs:', error.message);
    process.exit(1);
  }
}

seedFaqs();
