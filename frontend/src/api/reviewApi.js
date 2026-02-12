import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Review API Service
 */

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get all reviews (Admin)
 */
export const getReviews = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/reviews`, {
            params,
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy danh sách đánh giá' };
    }
};

/**
 * Get pending reviews (Admin)
 */
export const getPendingReviews = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/reviews/pending`, {
            params,
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy đánh giá chờ duyệt' };
    }
};

/**
 * Get single review by ID (Admin)
 */
export const getReviewById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/reviews/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thông tin đánh giá' };
    }
};

/**
 * Approve a review (Admin)
 */
export const approveReview = async (id) => {
    try {
        const response = await axios.put(`${API_URL}/reviews/${id}/approve`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi duyệt đánh giá' };
    }
};

/**
 * Reject a review (Admin)
 */
export const rejectReview = async (id, adminNote) => {
    try {
        const response = await axios.put(`${API_URL}/reviews/${id}/reject`, 
            { adminNote }, 
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi từ chối đánh giá' };
    }
};

/**
 * Delete a review (Admin)
 */
export const deleteReview = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/reviews/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa đánh giá' };
    }
};

/**
 * Get review statistics (Admin)
 */
export const getReviewStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/reviews/stats/overview`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thống kê' };
    }
};

/**
 * Get reviews for a product (Public)
 */
export const getProductReviews = async (productId, params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/reviews/product/${productId}`, {
            params
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy đánh giá sản phẩm' };
    }
};
