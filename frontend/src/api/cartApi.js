import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Cart API Service
 */

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy giỏ hàng hiện tại
 */
export const getCart = async () => {
    try {
        const response = await axios.get(`${API_URL}/cart`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy giỏ hàng' };
    }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 */
export const addToCart = async (productId, quantity = 1) => {
    try {
        const response = await axios.post(`${API_URL}/cart/items`, 
            { productId, quantity },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi thêm vào giỏ hàng' };
    }
};

/**
 * Cập nhật số lượng sản phẩm
 */
export const updateCartItem = async (productId, quantity) => {
    try {
        const response = await axios.put(`${API_URL}/cart/items/${productId}`, 
            { quantity },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi cập nhật giỏ hàng' };
    }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 */
export const removeCartItem = async (productId) => {
    try {
        const response = await axios.delete(`${API_URL}/cart/items/${productId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa sản phẩm' };
    }
};

/**
 * Xóa toàn bộ giỏ hàng
 */
export const clearCart = async () => {
    try {
        const response = await axios.delete(`${API_URL}/cart`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa giỏ hàng' };
    }
};
