import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiPackage, FiCreditCard } from 'react-icons/fi';
import { retryVNPayPayment } from '../api/vnpayApi';
import { toast } from 'react-toastify';

/**
 * VNPay Return Page
 *
 * Trang hiển thị kết quả thanh toán VNPay
 * Sau khi thanh toán trên cổng VNPay, người dùng được redirect về trang này
 * với các query parameters chứa kết quả giao dịch
 *
 * Query params nhận từ backend Return URL:
 * - success: 'true' | 'false'
 * - orderId: Mã đơn hàng
 * - amount: Số tiền thanh toán
 * - transactionNo: Mã giao dịch VNPay
 * - bankCode: Ngân hàng thanh toán
 * - responseCode: Mã phản hồi VNPay ('00' = thành công)
 */
const VNPayReturn = () => {
  // Đọc query parameters từ URL (react-router-dom v6+)
  const [searchParams] = useSearchParams();
  const [retryLoading, setRetryLoading] = useState(false);

  // Lấy các thông tin từ query params
  const success = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0';
  const transactionNo = searchParams.get('transactionNo') || '';
  const bankCode = searchParams.get('bankCode') || '';
  const responseCode = searchParams.get('responseCode') || '';
  const message = searchParams.get('message') || '';

  // Format số tiền theo VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Map mã lỗi VNPay sang thông báo tiếng Việt
  const getErrorMessage = (code) => {
    const errorMessages = {
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
      '11': 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Khách hàng hủy giao dịch.',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Lỗi không xác định.'
    };
    return errorMessages[code] || `Giao dịch thất bại (Mã lỗi: ${code})`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">

        {/* ===== THANH TOÁN THÀNH CÔNG ===== */}
        {success ? (
          <>
            {/* Icon thành công */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="text-green-600" size={40} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-6">
              Giao dịch VNPay đã được xử lý thành công. Đơn hàng của bạn đang được chuẩn bị.
            </p>

            {/* Thông tin giao dịch */}
            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left space-y-3">
              {orderId && (
                <div>
                  <p className="text-sm text-gray-600">Mã đơn hàng:</p>
                  <p className="text-lg font-bold text-green-600">{orderId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Số tiền thanh toán:</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(amount)}</p>
              </div>
              {transactionNo && (
                <div>
                  <p className="text-sm text-gray-600">Mã giao dịch VNPay:</p>
                  <p className="text-sm font-medium text-gray-800">{transactionNo}</p>
                </div>
              )}
              {bankCode && (
                <div>
                  <p className="text-sm text-gray-600">Ngân hàng:</p>
                  <p className="text-sm font-medium text-gray-800">{bankCode}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Phương thức:</p>
                <p className="text-sm font-medium text-gray-800">VNPay</p>
              </div>
            </div>
          </>
        ) : (
          /* ===== THANH TOÁN THẤT BẠI ===== */
          <>
            {/* Icon thất bại */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiXCircle className="text-red-600" size={40} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-600 mb-6">
              {message
                ? decodeURIComponent(message.replace(/_/g, ' '))
                : responseCode
                  ? getErrorMessage(responseCode)
                  : 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'
              }
            </p>

            {/* Thông tin giao dịch thất bại */}
            <div className="bg-red-50 rounded-lg p-4 mb-6 text-left space-y-2">
              {orderId && (
                <div>
                  <p className="text-sm text-gray-600">Mã đơn hàng:</p>
                  <p className="text-sm font-medium text-gray-800">{orderId}</p>
                </div>
              )}
              {responseCode && (
                <div>
                  <p className="text-sm text-gray-600">Mã phản hồi:</p>
                  <p className="text-sm font-medium text-red-600">{responseCode}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Nếu thất bại và có orderId → hiển nút thanh toán lại */}
          {!success && orderId && (
            <button
              onClick={async () => {
                try {
                  setRetryLoading(true);
                  // orderId ở đây là orderNumber, cần tìm orderId thật
                  // Backend retry-payment nhận orderId (MongoDB _id)
                  // Nhưng từ VNPay Return chỉ có orderNumber
                  // → Redirect về trang đơn hàng để dùng nút thanh toán lại
                  toast.info('Vui lòng vào trang đơn hàng để thanh toán lại');
                  window.location.href = '/orders';
                } catch (error) {
                  toast.error('Lỗi: ' + (error.message || 'Không thể thanh toán lại'));
                } finally {
                  setRetryLoading(false);
                }
              }}
              disabled={retryLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiCreditCard size={18} />
              {retryLoading ? 'Đang xử lý...' : 'Thanh toán lại'}
            </button>
          )}
          <Link
            to="/orders"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <FiPackage size={18} />
            Xem đơn hàng
          </Link>
          <Link
            to="/"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <FiArrowLeft size={18} />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VNPayReturn;
