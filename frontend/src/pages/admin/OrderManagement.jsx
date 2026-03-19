import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    getOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    getOrderStats
} from '../../api/orderApi';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
        limit: 20
    });

    // Advanced Filters - Modern approach
    const [filters, setFilters] = useState({
        search: '', // Order number or customer name/phone
        status: 'all',
        paymentStatus: 'all',
        paymentMethod: 'all',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        sortBy: 'createdAt',
        order: 'desc'
    });

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Quick actions dropdown state
    const [openDropdown, setOpenDropdown] = useState(null);

    // Fetch stats
    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const response = await getOrderStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    // Fetch orders with advanced filters
    const fetchOrders = async (page = pagination.currentPage) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pagination.limit,
                sortBy: filters.sortBy,
                order: filters.order
            };

            // Add filters only if they have values
            if (filters.search) params.search = filters.search;
            if (filters.status !== 'all') params.status = filters.status;
            if (filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus;
            if (filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.minAmount) params.minAmount = filters.minAmount;
            if (filters.maxAmount) params.maxAmount = filters.maxAmount;

            const response = await getOrders(params);
            setOrders(response.data.orders);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    // View order detail
    const viewOrderDetail = async (orderId) => {
        try {
            setLoadingDetail(true);
            setShowDetailModal(true);
            const response = await getOrderById(orderId);
            setSelectedOrder(response.data);
        } catch (error) {
            toast.error('Lỗi khi tải thông tin đơn hàng');
            setShowDetailModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Inline status update - Modern approach (no modal)
    const handleQuickStatusUpdate = async (orderId, newStatus, currentStatus) => {
        if (newStatus === currentStatus) return;

        const confirmMessage = `Bạn có chắc muốn chuyển trạng thái sang "${getStatusLabel(newStatus)}"?`;
        if (!confirm(confirmMessage)) return;

        try {
            await updateOrderStatus(orderId, { status: newStatus, note: 'Cập nhật nhanh từ admin' });
            toast.success('Cập nhật trạng thái thành công');
            fetchOrders();
            fetchStats(); // Refresh stats
        } catch (error) {
            toast.error(error.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    // Copy order number to clipboard
    const copyOrderNumber = (orderNumber) => {
        navigator.clipboard.writeText(orderNumber);
        toast.success('Đã sao chép mã đơn hàng');
    };

    // Handle search
    const handleSearch = () => {
        fetchOrders(1);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            search: '',
            status: 'all',
            paymentStatus: 'all',
            paymentMethod: 'all',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
            sortBy: 'createdAt',
            order: 'desc'
        });
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            processing: 'Đang xử lý',
            shipping: 'Đang giao',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy',
            refunded: 'Hoàn tiền'
        };
        return labels[status] || status;
    };

    // Get status badge with modern design
    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-purple-100 text-purple-800',
            shipping: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            refunded: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
                {getStatusLabel(status)}
            </span>
        );
    };

    // Get payment status badge
    const getPaymentBadge = (paymentStatus) => {
        const badges = {
            pending: <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Chưa thanh toán</span>,
            paid: <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đã thanh toán</span>,
            failed: <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Thất bại</span>,
            refunded: <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Đã hoàn tiền</span>
        };
        return badges[paymentStatus] || paymentStatus;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get available status transitions
    const getAvailableStatuses = (currentStatus) => {
        const transitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['processing', 'cancelled'],
            processing: ['shipping', 'cancelled'],
            shipping: ['delivered', 'cancelled'],
            delivered: ['refunded'],
            cancelled: [],
            refunded: []
        };
        return transitions[currentStatus] || [];
    };

    // Initial load
    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, [filters.status, filters.paymentStatus, filters.paymentMethod, filters.sortBy, filters.order]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
                    <p className="text-gray-600 mt-1">Theo dõi và quản lý đơn hàng của khách hàng</p>
                </div>

                {/* Stats Cards - Improvement #2 */}
                {loadingStats ? (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : stats && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Pending Orders */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Chờ xác nhận</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.statusBreakdown?.pending || 0}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Processing Orders */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {(stats.statusBreakdown?.confirmed || 0) + (stats.statusBreakdown?.processing || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Orders */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Đang giao</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.statusBreakdown?.shipping || 0}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Delivered Orders */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.statusBreakdown?.delivered || 0}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Filters - Improvement #3 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Mã đơn, tên khách hàng, SĐT..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="pending">Chờ xác nhận</option>
                                <option value="confirmed">Đã xác nhận</option>
                                <option value="processing">Đang xử lý</option>
                                <option value="shipping">Đang giao</option>
                                <option value="delivered">Đã giao</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                        </div>

                        {/* Payment Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thanh toán</label>
                            <select
                                value={filters.paymentStatus}
                                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="pending">Chưa thanh toán</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="failed">Thất bại</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Amount Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền từ</label>
                            <input
                                type="number"
                                value={filters.minAmount}
                                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                                placeholder="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Đến</label>
                            <input
                                type="number"
                                value={filters.maxAmount}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                                placeholder="999,999,999"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => fetchOrders(1)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Áp dụng bộ lọc
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Đặt lại
                        </button>
                    </div>
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                        <p className="mt-4 text-gray-600">Đang tải...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-600">Không có đơn hàng nào</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            {/* Add horizontal scroll wrapper */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Mã đơn</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Khách hàng</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tổng tiền</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Thanh toán</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ngày tạo</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-green-600">{order.orderNumber}</span>
                                                        <button
                                                            onClick={() => copyOrderNumber(order.orderNumber)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                            title="Sao chép mã đơn"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{order.items?.length || 0} sản phẩm</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{order.shippingAddress?.fullName}</div>
                                                    <div className="text-sm text-gray-500">{order.shippingAddress?.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                                                    <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getPaymentBadge(order.paymentStatus)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {/* Inline Status Update - Improvement #5 */}
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleQuickStatusUpdate(order._id, e.target.value, order.status)}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-green-500 ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                                    order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                                                                        order.status === 'shipping' ? 'bg-indigo-100 text-indigo-800' :
                                                                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        <option value={order.status}>{getStatusLabel(order.status)}</option>
                                                        {getAvailableStatuses(order.status).map(status => (
                                                            <option key={status} value={status}>→ {getStatusLabel(status)}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(order.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => viewOrderDetail(order._id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Xem chi tiết"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Chi tiết
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                viewOrderDetail(order._id);
                                                                setTimeout(() => window.print(), 500);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="In đơn hàng"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                            In
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> đến{' '}
                                            <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders)}</span> trong{' '}
                                            <span className="font-medium">{pagination.totalOrders}</span> đơn hàng
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fetchOrders(pagination.currentPage - 1)}
                                                disabled={pagination.currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Trước
                                            </button>
                                            <span className="px-4 py-2 text-sm text-gray-700">
                                                Trang {pagination.currentPage} / {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => fetchOrders(pagination.currentPage + 1)}
                                                disabled={pagination.currentPage === pagination.totalPages}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Sau
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal - Simplified */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {loadingDetail ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                <p className="mt-4 text-gray-600">Đang tải...</p>
                            </div>
                        ) : selectedOrder ? (
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
                                        <p className="text-gray-600 mt-1">#{selectedOrder.orderNumber}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Order Info */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="text-gray-600">Họ tên:</span> <span className="font-medium">{selectedOrder.shippingAddress?.fullName}</span></div>
                                            <div><span className="text-gray-600">SĐT:</span> <span className="font-medium">{selectedOrder.shippingAddress?.phone}</span></div>
                                            <div><span className="text-gray-600">Địa chỉ:</span> <span className="font-medium">{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.ward}, {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.province}</span></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Thông tin đơn hàng</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="text-gray-600">Trạng thái:</span> {getStatusBadge(selectedOrder.status)}</div>
                                            <div><span className="text-gray-600">Thanh toán:</span> {getPaymentBadge(selectedOrder.paymentStatus)}</div>
                                            <div><span className="text-gray-600">Phương thức:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></div>
                                            <div><span className="text-gray-600">Ngày tạo:</span> <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">Sản phẩm</h3>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sản phẩm</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Đơn giá</th>
                                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">SL</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedOrder.items?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3">{item.productName}</td>
                                                        <td className="px-4 py-3 text-right">{formatCurrency(item.finalPrice)}</td>
                                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">Tạm tính:</span>
                                        <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                                    </div>
                                    {selectedOrder.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm mb-2 text-green-600">
                                            <span>Giảm giá:</span>
                                            <span className="font-medium">-{formatCurrency(selectedOrder.discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">Phí vận chuyển:</span>
                                        <span className="font-medium">{formatCurrency(selectedOrder.shippingFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                        <span>Tổng cộng:</span>
                                        <span className="text-green-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;