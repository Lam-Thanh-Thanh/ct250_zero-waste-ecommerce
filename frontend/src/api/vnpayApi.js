import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * VNPay API Service
 * Gọi API backend để tạo URL thanh toán VNPay
 */

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Tạo URL thanh toán VNPay
 * Gọi API backend → nhận URL cổng thanh toán → redirect người dùng
 *
 * @param {Object} data - { orderId, amount, orderDescription }
 * @returns {Promise} - { success, data: { paymentUrl } }
 */
export const createVNPayPaymentUrl = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/vnpay/create-payment-url`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo URL thanh toán VNPay' };
  }
};

/**
 * Thanh toán lại đơn hàng VNPay thất bại
 * @param {Object} data - { orderId }
 * @returns {Promise} - { success, data: { paymentUrl } }
 */
export const retryVNPayPayment = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/vnpay/retry-payment`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo thanh toán lại' };
  }
};
