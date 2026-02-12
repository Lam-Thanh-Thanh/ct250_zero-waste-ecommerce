import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy banners active (public)
 */
export const getBanners = async () => {
  try {
    const response = await axios.get(`${API_URL}/banners`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách banner' };
  }
};

/**
 * Lấy tất cả banners (admin - bao gồm inactive)
 */
export const getAllBanners = async () => {
  try {
    const response = await axios.get(`${API_URL}/banners/all`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách banner' };
  }
};

/**
 * Tạo banner mới
 */
export const createBanner = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/banners`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo banner' };
  }
};

/**
 * Cập nhật banner
 */
export const updateBanner = async (id, formData) => {
  try {
    const response = await axios.put(`${API_URL}/banners/${id}`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật banner' };
  }
};

/**
 * Xóa banner
 */
export const deleteBanner = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/banners/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi xóa banner' };
  }
};
