import axiosInstance from './axios';

/**
 * Authentication API
 */
const authApi = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} userData - { username, email, password, confirmPassword, phone, address }
   * @returns {Promise}
   */
  register: (userData) => {
    return axiosInstance.post('/auth/register', userData);
  },

  /**
   * Đăng nhập
   * @param {Object} credentials - { email, password }
   * @returns {Promise}
   */
  login: (credentials) => {
    return axiosInstance.post('/auth/login', credentials);
  },

  /**
   * Lấy thông tin user hiện tại
   * @returns {Promise}
   */
  getCurrentUser: () => {
    return axiosInstance.get('/auth/me');
  },

  /**
   * Cập nhật thông tin cá nhân
   * @param {Object} userData - { username, phone, address }
   * @returns {Promise}
   */
  updateProfile: (userData) => {
    return axiosInstance.put('/auth/profile', userData);
  },

  /**
   * Đổi mật khẩu
   * @param {Object} passwordData - { currentPassword, newPassword, confirmNewPassword }
   * @returns {Promise}
   */
  changePassword: (passwordData) => {
    return axiosInstance.put('/auth/change-password', passwordData);
  },

  /**
   * Đăng xuất
   * @returns {Promise}
   */
  logout: () => {
    return axiosInstance.post('/auth/logout');
  },

  /**
   * Xóa tài khoản
   * @returns {Promise}
   */
  deleteAccount: () => {
    return axiosInstance.delete('/auth/account');
  }
};

export default authApi;