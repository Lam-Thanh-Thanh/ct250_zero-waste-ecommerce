import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Certificate API Service
 */

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách certificates (có phân trang, tìm kiếm)
 */
export const getCertificates = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/certificates`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách chứng chỉ' };
  }
};

/**
 * Lấy tất cả certificates (không phân trang) - dùng cho dropdown
 */
export const getAllCertificates = async () => {
  try {
    const response = await axios.get(`${API_URL}/certificates/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách chứng chỉ' };
  }
};

// Alias for clearer naming
export const getAllCertificatesNoPagination = getAllCertificates;

/**
 * Lấy chi tiết 1 certificate
 */
export const getCertificateById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/certificates/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy thông tin chứng chỉ' };
  }
};

/**
 * Tạo certificate mới (có upload ảnh)
 */
export const createCertificate = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/certificates`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo chứng chỉ' };
  }
};

/**
 * Cập nhật certificate
 */
export const updateCertificate = async (id, formData) => {
  try {
    const response = await axios.put(`${API_URL}/certificates/${id}`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật chứng chỉ' };
  }
};

/**
 * Xóa certificate
 */
export const deleteCertificate = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/certificates/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi xóa chứng chỉ' };
  }
};

/**
 * Xóa ảnh của certificate
 */
export const deleteCertificateImage = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/certificates/${id}/image`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi xóa hình ảnh' };
  }
};