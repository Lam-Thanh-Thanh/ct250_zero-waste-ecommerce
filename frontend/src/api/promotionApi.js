import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Promotion API Service
 */

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách khuyến mãi khả dụng (User)
 */
export const getAvailablePromotions = async () => {
    try {
        const response = await axios.get(`${API_URL}/promotions/available`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy danh sách khuyến mãi' };
    }
};

/**
 * Lấy danh sách khuyến mãi (Admin)
 */
export const getPromotions = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/promotions`, {
            params,
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy danh sách khuyến mãi' };
    }
};

/**
 * Lấy chi tiết khuyến mãi (Admin)
 */
export const getPromotionById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/promotions/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thông tin khuyến mãi' };
    }
};

/**
 * Tạo khuyến mãi mới (Admin)
 */
export const createPromotion = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/promotions`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi tạo khuyến mãi' };
    }
};

/**
 * Cập nhật khuyến mãi (Admin)
 */
export const updatePromotion = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/promotions/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi cập nhật khuyến mãi' };
    }
};

/**
 * Xóa khuyến mãi (Admin)
 */
export const deletePromotion = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/promotions/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa khuyến mãi' };
    }
};

/**
 * Validate mã giảm giá (User - Checkout)
 */
export const validatePromotionCode = async (code, orderSubtotal) => {
    try {
        const response = await axios.post(`${API_URL}/promotions/validate`, {
            code,
            orderSubtotal
        }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi kiểm tra mã giảm giá' };
    }
};
