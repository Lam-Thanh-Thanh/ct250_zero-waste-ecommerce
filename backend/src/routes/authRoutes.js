const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const { 
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../validators/authValidator');

// ===== PUBLIC ROUTES (không cần đăng nhập) =====

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

// ===== PRIVATE ROUTES (cần đăng nhập) =====

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user hiện tại
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Cập nhật thông tin cá nhân
 * @access  Private
 */
router.put(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Đổi mật khẩu
 * @access  Private
 */
router.put(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   DELETE /api/auth/account
 * @desc    Xóa tài khoản
 * @access  Private
 */
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;