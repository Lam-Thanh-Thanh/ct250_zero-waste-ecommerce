import axiosInstance from './axios';

/**
 * Dashboard API
 * Gọi các endpoint thống kê admin
 */

// Lấy toàn bộ dữ liệu thống kê cho Dashboard
// Response chứa: monthlyRevenue, newOrders, newUsers, revenueByDay, topProducts, lowStockProducts
export const fetchDashboardStats = () => {
    return axiosInstance.get('/dashboard/stats');
};

// Lấy doanh thu theo ngày hoặc tháng (dùng khi toggle chart)
// @param type: 'daily' | 'monthly'
export const fetchRevenue = (type = 'daily') => {
    return axiosInstance.get(`/dashboard/revenue?type=${type}`);
};

// Lấy data cho 1 section, lọc theo tháng/năm
// @param section: 'revenue' | 'products' | 'customers' | 'categories' | 'orders'
// @param month: 1-12
// @param year: 2025, 2026, ...
export const fetchStatsByMonth = (section, month, year) => {
    return axiosInstance.get(`/dashboard/stats-by-month?section=${section}&month=${month}&year=${year}`);
};

// Xuất file Excel — trả về Blob
// responseType: 'blob' để axios không parse JSON mà giữ nguyên binary data
export const exportExcel = (month, year) => {
    return axiosInstance.get(`/dashboard/export/excel?month=${month}&year=${year}`, {
        responseType: 'blob'
    });
};

// Xuất file PDF — trả về Blob
export const exportPdf = (month, year) => {
    return axiosInstance.get(`/dashboard/export/pdf?month=${month}&year=${year}`, {
        responseType: 'blob'
    });
};
