const dotenv = require('dotenv');
dotenv.config(); // ✅ PHẢI Ở DÒNG ĐẦU TIÊN

const app = require('./src/app');
const { startAutoCancelScheduler } = require('./src/utils/autoCancelScheduler');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Khởi chạy scheduler tự động hủy đơn VNPay quá hạn
  startAutoCancelScheduler();
});
