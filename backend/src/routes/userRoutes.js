const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Tất cả routes dưới đây cần đăng nhập và có quyền admin
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/users/stats
 * @desc    Thống kê người dùng
 * @access  Private/Admin
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Lấy danh sách tất cả users (có phân trang, tìm kiếm)
 * @access  Private/Admin
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Lấy thông tin chi tiết 1 user
 * @access  Private/Admin
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Cập nhật thông tin user
 * @access  Private/Admin
 */
router.put('/:id', userController.updateUser);

/**
 * @route   PUT /api/users/:id/toggle-status
 * @desc    Khóa/Mở khóa tài khoản user
 * @access  Private/Admin
 */
router.put('/:id/toggle-status', userController.toggleUserStatus);

/**
 * @route   DELETE /api/users/:id
 * @desc    Xóa user (soft delete)
 * @access  Private/Admin
 */
router.delete('/:id', userController.deleteUser);

module.exports = router;