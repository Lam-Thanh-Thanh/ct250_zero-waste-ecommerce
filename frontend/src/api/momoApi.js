import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * MoMo API Service
 * Gọi API backend để tạo URL thanh toán MoMo
 */

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Tạo URL thanh toán MoMo
 * @param {Object} data - { orderId, amount, orderDescription }
 * @returns {Promise} - { success, data: { paymentUrl } }
 */
export const createMoMoPaymentUrl = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/momo/create-payment-url`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo URL thanh toán MoMo' };
  }
};

/**
 * Thanh toán lại đơn hàng MoMo thất bại
 * @param {Object} data - { orderId }
 * @returns {Promise} - { success, data: { paymentUrl } }
 */
export const retryMoMoPayment = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/momo/retry-payment`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo thanh toán lại MoMo' };
  }
};
