const authService = require('../services/authService');

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    // req.validatedBody đã được validate bởi middleware
    const result = await authService.register(req.validatedBody);
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: result
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đăng ký thất bại'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;
    
    const result = await authService.login(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Đăng nhập thất bại'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user hiện tại
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user đã được set bởi authMiddleware
    const user = await authService.getCurrentUser(req.user._id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get Current User Error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Không tìm thấy người dùng'
    });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Cập nhật thông tin cá nhân
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.validatedBody);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: user
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Cập nhật thông tin thất bại'
    });
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Đổi mật khẩu
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.validatedBody;
    
    const result = await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đổi mật khẩu thất bại'
    });
  }
};

/**
 * @route   DELETE /api/auth/account
 * @desc    Xóa tài khoản (soft delete)
 * @access  Private
 */
exports.deleteAccount = async (req, res) => {
  try {
    const result = await authService.deleteAccount(req.user._id);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Xóa tài khoản thất bại'
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất (client xóa token)
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    // Với JWT, logout chỉ cần client xóa token
    // Server không cần làm gì (stateless)
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Đăng xuất thất bại'
    });
  }
};