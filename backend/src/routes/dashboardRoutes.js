const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth');
const {
    getStats,
    getRevenue,
    getStatsByMonth,
    exportExcel,
    exportPdf
} = require('../controllers/dashboardController');

/**
 * Dashboard Routes
 * Tất cả routes đều yêu cầu đăng nhập (protect) + quyền admin (admin)
 * 
 * GET /api/dashboard/stats              - Tổng hợp thống kê
 * GET /api/dashboard/stats-by-month     - Thống kê theo tháng/năm + section
 * GET /api/dashboard/revenue            - Doanh thu theo ngày/tháng
 * GET /api/dashboard/export/excel       - Xuất Excel
 * GET /api/dashboard/export/pdf         - Xuất PDF
 */
router.get('/stats', protect, admin, getStats);
router.get('/stats-by-month', protect, admin, getStatsByMonth);
router.get('/revenue', protect, admin, getRevenue);
router.get('/export/excel', protect, admin, exportExcel);
router.get('/export/pdf', protect, admin, exportPdf);

module.exports = router;
