import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiPackage, FiCreditCard } from 'react-icons/fi';
import { toast } from 'react-toastify';

/**
 * MoMo Return Page
 *
 * Trang hiển thị kết quả thanh toán MoMo
 * Sau khi thanh toán trên cổng MoMo, người dùng được redirect về trang này
 *
 * Query params nhận từ backend:
 * - success: 'true' | 'false'
 * - orderId: Mã đơn hàng (orderNumber)
 * - amount: Số tiền thanh toán
 * - transId: Mã giao dịch MoMo
 * - resultCode: Mã kết quả MoMo (0 = thành công)
 * - message: Thông báo từ MoMo
 */
const MoMoReturn = () => {
  const [searchParams] = useSearchParams();

  const success = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0';
  const transId = searchParams.get('transId') || '';
  const resultCode = searchParams.get('resultCode') || '';
  const message = searchParams.get('message') || '';

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getErrorMessage = (code) => {
    const errorMessages = {
      '1000': 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán.',
      '1001': 'Giao dịch thất bại do tài khoản không đủ tiền.',
      '1002': 'Giao dịch bị từ chối bởi nhà phát hành.',
      '1003': 'Giao dịch bị hủy bởi MoMo.',
      '1004': 'Giao dịch thất bại do số tiền vượt quá hạn mức.',
      '1005': 'Giao dịch thất bại do URL hoặc QR đã hết hạn.',
      '1006': 'Giao dịch thất bại do người dùng hủy thanh toán.',
      '1007': 'Giao dịch thất bại do tài khoản không tồn tại.',
      '1017': 'Giao dịch thất bại do tài khoản đang bị khóa.',
      '1026': 'Giao dịch bị hạn chế theo quy định của thương nhân.',
      '1080': 'Giao dịch hoàn tiền thất bại. Đơn hàng gốc không tìm thấy.',
      '1081': 'Giao dịch hoàn tiền bị từ chối. Đơn hàng gốc đã được hoàn.',
      '49': 'Người dùng chưa xác thực tài khoản MoMo.'
    };
    return errorMessages[code] || `Giao dịch thất bại (Mã lỗi: ${code})`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">

        {/* ===== THANH TOÁN THÀNH CÔNG ===== */}
        {success ? (
          <>
            {/* Icon thành công - MoMo pink theme */}
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="text-pink-600" size={40} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-6">
              Giao dịch MoMo đã được xử lý thành công. Đơn hàng của bạn đang được chuẩn bị.
            </p>

            {/* Thông tin giao dịch */}
            <div className="bg-pink-50 rounded-lg p-4 mb-6 text-left space-y-3">
              {orderId && (
                <div>
                  <p className="text-sm text-gray-600">Mã đơn hàng:</p>
                  <p className="text-lg font-bold text-pink-600">{orderId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Số tiền thanh toán:</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(amount)}</p>
              </div>
              {transId && (
                <div>
                  <p className="text-sm text-gray-600">Mã giao dịch MoMo:</p>
                  <p className="text-sm font-medium text-gray-800">{transId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Phương thức:</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">Ví MoMo</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ===== THANH TOÁN THẤT BẠI ===== */
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiXCircle className="text-red-600" size={40} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-600 mb-6">
              {message
                ? decodeURIComponent(message.replace(/_/g, ' '))
                : resultCode
                  ? getErrorMessage(resultCode)
                  : 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'
              }
            </p>

            <div className="bg-red-50 rounded-lg p-4 mb-6 text-left space-y-2">
              {orderId && (
                <div>
                  <p className="text-sm text-gray-600">Mã đơn hàng:</p>
                  <p className="text-sm font-medium text-gray-800">{orderId}</p>
                </div>
              )}
              {resultCode && (
                <div>
                  <p className="text-sm text-gray-600">Mã phản hồi:</p>
                  <p className="text-sm font-medium text-red-600">{resultCode}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!success && orderId && (
            <button
              onClick={() => {
                toast.info('Vui lòng vào trang đơn hàng để thanh toán lại');
                window.location.href = '/orders';
              }}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <FiCreditCard size={18} />
              Thanh toán lại
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

export default MoMoReturn;
