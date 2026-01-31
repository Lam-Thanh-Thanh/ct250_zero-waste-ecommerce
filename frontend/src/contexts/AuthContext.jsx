import React, { createContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user khi component mount hoặc khi token thay đổi
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Load user error:', error);
          // Token không hợp lệ, xóa token
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  /**
   * Đăng ký
   */
  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      const { user, token } = response.data;
      
      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      
      // Cập nhật state
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng ký thất bại',
        errors: error.response?.data?.errors
      };
    }
  };

  /**
   * Đăng nhập
   */
  const login = async (credentials) => {
    try {
      console.log('AuthContext: Calling login API with:', credentials);
      const response = await authApi.login(credentials);
      console.log('AuthContext: Raw API response:', response);
      console.log('AuthContext: response.data:', response.data);
      
      const { user, token } = response.data;
      console.log('AuthContext: Extracted user:', user);
      console.log('AuthContext: Extracted token:', token);
      
      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      
      // Cập nhật state
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      console.error('AuthContext: Error response:', error.response);
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại'
      };
    }
  };

  /**
   * Đăng xuất
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa token và reset state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Cập nhật thông tin user
   */
  const updateUser = async (userData) => {
    try {
      const response = await authApi.updateProfile(userData);
      setUser(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Cập nhật thất bại',
        errors: error.response?.data?.errors
      };
    }
  };

  /**
   * Đổi mật khẩu
   */
  const changePassword = async (passwordData) => {
    try {
      const response = await authApi.changePassword(passwordData);
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đổi mật khẩu thất bại',
        errors: error.response?.data?.errors
      };
    }
  };

  /**
   * Kiểm tra quyền admin
   */
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    updateUser,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
