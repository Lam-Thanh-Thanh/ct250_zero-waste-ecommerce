import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Product API Service
 * Các hàm gọi API liên quan đến sản phẩm
 */

// Lấy token từ localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách products (có filter, phân trang)
 */
export const getProducts = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/products`, { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy danh sách sản phẩm' };
    }
};

/**
 * Lấy chi tiết 1 product
 */
export const getProductById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/products/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thông tin sản phẩm' };
    }
};

/**
 * Lấy thống kê sản phẩm (Admin)
 */
export const getProductStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/products/admin/stats`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi lấy thống kê sản phẩm' };
    }
};

/**
 * Tạo product mới (có upload nhiều ảnh)
 */
export const createProduct = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/products`, formData, {
            headers: {
                ...getAuthHeader()
                // Content-Type sẽ tự động được set bởi axios với boundary phù hợp
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi tạo sản phẩm' };
    }
};

/**
 * Cập nhật product (có thể thêm ảnh mới)
 */
export const updateProduct = async (id, formData) => {
    try {
        const response = await axios.put(`${API_URL}/products/${id}`, formData, {
            headers: {
                ...getAuthHeader()
                // Content-Type sẽ tự động được set bởi axios với boundary phù hợp
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi cập nhật sản phẩm' };
    }
};

/**
 * Xóa product
 */
export const deleteProduct = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/products/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa sản phẩm' };
    }
};

/**
 * Xóa 1 ảnh của product
 */
export const deleteProductImage = async (productId, imageId) => {
    try {
        const response = await axios.delete(
            `${API_URL}/products/${productId}/images/${imageId}`,
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi xóa hình ảnh' };
    }
};

/**
 * Đặt ảnh chính cho product
 */
export const setMainImage = async (productId, imageId) => {
    try {
        const response = await axios.put(
            `${API_URL}/products/${productId}/images/${imageId}/set-main`,
            {},
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi khi đặt ảnh chính' };
    }
};