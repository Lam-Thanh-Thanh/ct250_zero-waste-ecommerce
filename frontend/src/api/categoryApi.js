import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Category API Service
 * Các hàm gọi API liên quan đến danh mục
 */

// Lấy token từ localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách categories (có phân trang, tìm kiếm)
 */
export const getCategories = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/categories`, { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy danh sách danh mục' };
    }
};

/**
 * Lấy tất cả categories (không phân trang) - dùng cho dropdown
 */
export const getAllCategories = async () => {
    try {
        const response = await axios.get(`${API_URL}/categories/all`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy danh sách danh mục' };
    }
};

/**
 * Lấy chi tiết 1 category
 */
export const getCategoryById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/categories/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thông tin danh mục' };
    }
};

/**
 * Tạo category mới (có upload ảnh)
 */
export const createCategory = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/categories`, formData, {
            headers: {
                ...getAuthHeader()
                // Content-Type sẽ tự động được set bởi axios với boundary phù hợp
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi tạo danh mục' };
    }
};

/**
 * Cập nhật category (có thể upload ảnh mới)
 */
export const updateCategory = async (id, formData) => {
    try {
        const response = await axios.put(`${API_URL}/categories/${id}`, formData, {
            headers: {
                ...getAuthHeader()
                // Content-Type sẽ tự động được set bởi axios với boundary phù hợp
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi cập nhật danh mục' };
    }
};

/**
 * Xóa category
 */
export const deleteCategory = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/categories/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa danh mục' };
    }
};

/**
 * Xóa ảnh của category
 */
export const deleteCategoryImage = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/categories/${id}/image`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa hình ảnh' };
    }
};