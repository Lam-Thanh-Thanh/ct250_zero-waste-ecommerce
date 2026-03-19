const crypto = require('crypto');
const moment = require('moment');

/**
 * VNPay Service
 * Xử lý tạo URL thanh toán VNPay và xác thực kết quả trả về
 *
 * Tài liệu tham khảo:
 * - VNPay Sandbox: https://sandbox.vnpayment.vn/
 * - Dùng thuật toán HMAC-SHA512 để tạo chữ ký bảo mật (vnp_SecureHash)
 *
 * QUAN TRỌNG VỀ ENCODING:
 * - Dùng hàm sortObject() để encode key+value rồi sort
 * - Dùng querystring.stringify với encode: false (vì đã encode rồi)
 * - Nếu encode 2 lần → chữ ký SAI → VNPay báo lỗi "sai chữ ký"
 */
class VNPayService {
  constructor() {
    // Lấy cấu hình từ biến môi trường
    this.tmnCode = process.env.VNPAY_TMN_CODE;       // Mã website tại VNPay
    this.hashSecret = process.env.VNPAY_HASH_SECRET;  // Chuỗi bí mật để tạo chữ ký
    this.vnpUrl = process.env.VNPAY_URL;               // URL cổng thanh toán VNPay
    this.returnUrl = process.env.VNPAY_RETURN_URL;     // URL backend nhận kết quả
  }

  /**
   * Tạo URL thanh toán VNPay
   *
   * @param {String} txnRef - Mã tham chiếu giao dịch (unique)
   * @param {Number} amount - Số tiền thanh toán (VND, số nguyên)
   * @param {String} orderInfo - Mô tả đơn hàng
   * @param {String} ipAddr - Địa chỉ IP của khách hàng
   * @returns {String} URL thanh toán VNPay đầy đủ
   */
  createPaymentUrl(txnRef, amount, orderInfo, ipAddr) {
    // Lấy thời gian hiện tại theo múi giờ Việt Nam (GMT+7)
    const createDate = moment().utcOffset('+07:00').format('YYYYMMDDHHmmss');

    // Thời gian hết hạn thanh toán (15 phút sau)
    const expireDate = moment().utcOffset('+07:00').add(15, 'minutes').format('YYYYMMDDHHmmss');

    // ===== Bước 1: Tạo object chứa tất cả tham số VNPay =====
    // Giá trị là RAW (chưa encode), sẽ được encode trong sortObject()
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.round(amount * 100); // Nhân 100 theo yêu cầu VNPay
    vnp_Params['vnp_ReturnUrl'] = this.returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    // ===== Bước 2: Sort params và encode theo chuẩn VNPay =====
    // Hàm sortObject sẽ: encode key, encode value, replace %20 → +, rồi sort
    vnp_Params = this._sortObject(vnp_Params);

    // ===== Bước 3: Tạo chuỗi signData (dùng để ký) =====
    // QUAN TRỌNG: Dùng encode: false vì giá trị ĐÃ được encode trong sortObject
    // Nếu không dùng encode: false → bị encode 2 lần → sai chữ ký
    const signData = Object.keys(vnp_Params)
      .map(key => key + '=' + vnp_Params[key])
      .join('&');

    // ===== Bước 4: Tạo chữ ký HMAC-SHA512 =====
    // Dùng HashSecret làm key để mã hóa chuỗi signData
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // ===== Bước 5: Ghép URL cuối cùng =====
    const paymentUrl = this.vnpUrl + '?' + signData + '&vnp_SecureHash=' + signed;

    return paymentUrl;
  }

  /**
   * Xác thực chữ ký từ VNPay trả về (Return URL / IPN)
   *
   * @param {Object} vnpParams - Query parameters từ VNPay trả về
   * @returns {Object} { isValid, responseCode }
   */
  verifyReturnUrl(vnpParams) {
    // Lấy chữ ký VNPay gửi về
    const secureHash = vnpParams['vnp_SecureHash'];

    // Tạo bản copy và xóa các trường chữ ký
    const paramsToSign = { ...vnpParams };
    delete paramsToSign['vnp_SecureHash'];
    delete paramsToSign['vnp_SecureHashType'];

    // Sort và encode params (giống hệt bước tạo URL)
    const sortedParams = this._sortObject(paramsToSign);

    // Tạo chuỗi signData
    const signData = Object.keys(sortedParams)
      .map(key => key + '=' + sortedParams[key])
      .join('&');

    // Tạo lại chữ ký
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // So sánh: khớp → hợp lệ
    return {
      isValid: secureHash === signed,
      responseCode: paramsToSign['vnp_ResponseCode']
    };
  }

  /**
   * Hàm sắp xếp và encode object theo CHUẨN VNPay
   *
   * Đây là hàm QUAN TRỌNG NHẤT — phải khớp chính xác với cách VNPay xử lý
   *
   * Quy trình:
   * 1. Encode tất cả key bằng encodeURIComponent
   * 2. Sort các key đã encode theo alphabet
   * 3. Với mỗi key đã sort, encode value bằng encodeURIComponent
   * 4. Replace %20 thành + trong value (theo chuẩn application/x-www-form-urlencoded)
   *
   * @param {Object} obj - Object cần sort và encode
   * @returns {Object} Object đã sort, key và value đều đã encode
   */
  _sortObject(obj) {
    const sorted = {};
    const str = [];

    // Bước 1: Encode tất cả key và đưa vào mảng
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }

    // Bước 2: Sort mảng key đã encode theo alphabet
    str.sort();

    // Bước 3: Với mỗi key đã sort, encode value tương ứng
    for (let i = 0; i < str.length; i++) {
      // str[i] chính là key đã encode (vnp_* không có ký tự đặc biệt nên giữ nguyên)
      // obj[str[i]] lấy giá trị gốc từ object
      sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, '+');
    }

    return sorted;
  }
}

module.exports = new VNPayService();
