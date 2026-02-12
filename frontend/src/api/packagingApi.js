import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Packaging API Service
 */

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách packagings (có phân trang, tìm kiếm)
 */
export const getPackagings = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/packagings`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách bao bì' };
  }
};

/**
 * Lấy tất cả packagings (không phân trang) - dùng cho dropdown
 */
export const getAllPackagings = async () => {
  try {
    const response = await axios.get(`${API_URL}/packagings/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách bao bì' };
  }
};

// Alias for clearer naming
export const getAllPackagingsNoPagination = getAllPackagings;

/**
 * Lấy chi tiết 1 packaging
 */
export const getPackagingById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/packagings/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy thông tin bao bì' };
  }
};

/**
 * Tạo packaging mới
 */
export const createPackaging = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/packagings`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo bao bì' };
  }
};

/**
 * Cập nhật packaging
 */
export const updatePackaging = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/packagings/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật bao bì' };
  }
};

/**
 * Xóa packaging
 */
export const deletePackaging = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/packagings/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi xóa bao bì' };
  }
};