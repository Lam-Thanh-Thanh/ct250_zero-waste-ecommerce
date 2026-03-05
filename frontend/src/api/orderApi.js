import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Order API Service
 */

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách đơn hàng (Admin)
 */
export const getOrders = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/orders`, {
            params,
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy danh sách đơn hàng' };
    }
};

/**
 * Lấy chi tiết đơn hàng
 */
export const getOrderById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/orders/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thông tin đơn hàng' };
    }
};

/**
 * Cập nhật trạng thái đơn hàng
 */
export const updateOrderStatus = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/orders/${id}/status`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi cập nhật trạng thái' };
    }
};

/**
 * Cập nhật trạng thái thanh toán
 */
export const updatePaymentStatus = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/orders/${id}/payment-status`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi cập nhật trạng thái thanh toán' };
    }
};

/**
 * Thêm ghi chú admin
 */
export const addAdminNote = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/orders/${id}/admin-note`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi thêm ghi chú' };
    }
};

/**
 * Lấy thống kê đơn hàng
 */
export const getOrderStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/orders/stats/overview`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thống kê' };
    }
};

/**
 * Lấy đơn hàng của user (Admin)
 */
export const getUserOrders = async (userId, params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/orders/user/${userId}`, {
            params,
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy đơn hàng' };
    }
};

// ===== USER-FACING APIs =====

/**
 * Tạo đơn hàng mới (Checkout)
 */
export const createOrder = async (orderData) => {
    try {
        const response = await axios.post(`${API_URL}/orders`, orderData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi tạo đơn hàng' };
    }
};

/**
 * Lấy danh sách đơn hàng của user hiện tại
 */
export const getMyOrders = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/orders/my-orders`, {
            params,
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy đơn hàng' };
    }
};

/**
 * Lấy chi tiết đơn hàng của user hiện tại
 */
export const getMyOrderDetail = async (orderId) => {
    try {
        const response = await axios.get(`${API_URL}/orders/my-orders/${orderId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy chi tiết đơn hàng' };
    }
};

/**
 * User hủy đơn hàng
 */
export const cancelMyOrder = async (orderId, reason) => {
    try {
        const response = await axios.put(`${API_URL}/orders/${orderId}/cancel`, 
            { reason },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi hủy đơn hàng' };
    }
};