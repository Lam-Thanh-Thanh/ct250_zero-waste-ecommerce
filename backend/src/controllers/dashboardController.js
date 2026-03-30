const dashboardService = require('../services/dashboardService');

/**
 * Dashboard Controller
 * Xử lý request/response cho các API thống kê admin
 */

// ===== GET /api/dashboard/stats =====
// Trả về tổng hợp tất cả dữ liệu thống kê cho Dashboard
const getStats = async (req, res) => {
    try {
        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();

        // Gọi song song tất cả service queries để tăng tốc (Promise.all)
        const [
            monthlyStats, topProducts, lowStockProducts, revenueByDay,
            orderPerformance, revenueByCategory, customerTypes, topCustomers
        ] = await Promise.all([
            dashboardService.getMonthlyStats(),
            dashboardService.getTopSellingProductsInMonth(m, y, 5),
            dashboardService.getLowStockProducts(10),
            dashboardService.getRevenueByDayInMonth(m, y),
            dashboardService.getOrderPerformanceInMonth(m, y),
            dashboardService.getRevenueByCategoryInMonth(m, y),
            dashboardService.getCustomerTypes(),
            dashboardService.getTopCustomersInMonth(m, y, 5)
        ]);

        res.json({
            success: true,
            data: {
                // Hàng 1: KPI Cards
                monthlyRevenue: monthlyStats.monthlyRevenue,
                newOrders: monthlyStats.newOrders,
                newUsers: monthlyStats.newUsers,
                newItems: monthlyStats.newItems,

                // Hàng 2 trái: AreaChart doanh thu theo ngày
                revenueByDay,

                // DonutChart: order performance
                orderPerformance,

                // Hàng 3: Category revenue (horizontal bar), Customer types (donut), Top customers
                revenueByCategory,
                customerTypes,
                topCustomers,

                // Hàng 4: Top products table + Low stock alerts
                topProducts,
                lowStockProducts
            }
        });
    } catch (error) {
        console.error('Dashboard getStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu thống kê',
            error: error.message
        });
    }
};

// ===== GET /api/dashboard/revenue?type=daily|monthly =====
// Trả về doanh thu theo ngày hoặc tháng (dùng khi toggle chart)
const getRevenue = async (req, res) => {
    try {
        const { type = 'daily' } = req.query;

        let data;
        if (type === 'monthly') {
            data = await dashboardService.getRevenueByMonth(12);
        } else {
            data = await dashboardService.getRevenueByDay(30);
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Dashboard getRevenue error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu doanh thu',
            error: error.message
        });
    }
};

// ===== GET /api/dashboard/export/excel =====
// Xuất file Excel (.xlsx) chứa danh sách đơn hàng & doanh thu
const exportExcel = async (req, res) => {
    try {
        const { month, year } = req.query;
        // Service sẽ tự set headers và write vào response stream
        await dashboardService.exportOrdersExcel(res, parseInt(month), parseInt(year));
    } catch (error) {
        console.error('Dashboard exportExcel error:', error);
        // Chỉ trả lỗi nếu headers chưa được gửi
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xuất file Excel',
                error: error.message
            });
        }
    }
};

// ===== GET /api/dashboard/export/pdf =====
// Xuất file PDF chứa báo cáo doanh thu
const exportPdf = async (req, res) => {
    try {
        const { month, year } = req.query;
        // Service sẽ tự set headers và pipe PDF vào response
        await dashboardService.exportRevenuePdf(res, parseInt(month), parseInt(year));
    } catch (error) {
        console.error('Dashboard exportPdf error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xuất file PDF',
                error: error.message
            });
        }
    }
};

// ===== GET /api/dashboard/stats-by-month?month=X&year=Y&section=... =====
// Trả data cho 1 section cụ thể, lọc theo tháng/năm
// section: revenue | products | customers | categories | orders
const getStatsByMonth = async (req, res) => {
    try {
        const { month, year, section } = req.query;
        const m = parseInt(month);
        const y = parseInt(year);

        if (!m || !y || m < 1 || m > 12 || y < 2020) {
            return res.status(400).json({ success: false, message: 'Tháng hoặc năm không hợp lệ' });
        }

        let data;
        switch (section) {
            case 'revenue':
                data = await dashboardService.getRevenueByDayInMonth(m, y);
                break;
            case 'products':
                data = await dashboardService.getTopSellingProductsInMonth(m, y, 5);
                break;
            case 'customers':
                data = await dashboardService.getTopCustomersInMonth(m, y, 5);
                break;
            case 'categories':
                data = await dashboardService.getRevenueByCategoryInMonth(m, y);
                break;
            case 'orders':
                data = await dashboardService.getOrderPerformanceInMonth(m, y);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Section không hợp lệ' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Dashboard getStatsByMonth error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu', error: error.message });
    }
};

module.exports = {
    getStats,
    getRevenue,
    getStatsByMonth,
    exportExcel,
    exportPdf
};
