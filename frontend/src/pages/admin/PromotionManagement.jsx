import React, { useState, useEffect, useCallback } from 'react';
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from '../../api/promotionApi';
import { toast } from 'react-toastify';

const PromotionManagement = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        type: 'all',
        page: 1
    });

    // Form
    const initialFormData = {
        code: '',
        name: '',
        description: '',
        discountValue: '',
        type: 'percentage',
        applicableTo: 'all',
        minOrderAmount: '0',
        startDate: '',
        endDate: '',
        isActive: true,
        usageLimit: ''
    };
    const [formData, setFormData] = useState(initialFormData);

    // Fetch promotions
    const fetchPromotions = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 20 };
            if (filters.search) params.search = filters.search;
            if (filters.status !== 'all') params.status = filters.status;
            if (filters.type !== 'all') params.type = filters.type;

            const result = await getPromotions(params);
            if (result.success) {
                setPromotions(result.data.promotions);
                setPagination(result.data.pagination);
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải danh sách khuyến mãi');
        } finally {
            setLoading(false);
        }
    }, [filters.search, filters.status, filters.type]);

    useEffect(() => {
        fetchPromotions(filters.page);
    }, [fetchPromotions, filters.page]);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // Format date for input
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().split('T')[0];
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    // Open create modal
    const openCreateModal = () => {
        setEditingPromotion(null);
        setFormData(initialFormData);
        setShowModal(true);
    };

    // Open edit modal
    const openEditModal = (promotion) => {
        setEditingPromotion(promotion);
        setFormData({
            code: promotion.code,
            name: promotion.name,
            description: promotion.description || '',
            discountValue: promotion.discountValue.toString(),
            type: promotion.type,
            applicableTo: promotion.applicableTo,
            minOrderAmount: promotion.minOrderAmount.toString(),
            startDate: formatDateForInput(promotion.startDate),
            endDate: formatDateForInput(promotion.endDate),
            isActive: promotion.isActive,
            usageLimit: promotion.usageLimit !== null ? promotion.usageLimit.toString() : ''
        });
        setShowModal(true);
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
            };

            if (editingPromotion) {
                const result = await updatePromotion(editingPromotion._id, payload);
                if (result.success) {
                    toast.success('Cập nhật khuyến mãi thành công');
                }
            } else {
                const result = await createPromotion(payload);
                if (result.success) {
                    toast.success('Tạo khuyến mãi thành công');
                }
            }

            setShowModal(false);
            fetchPromotions(filters.page);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi lưu khuyến mãi');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa khuyến mãi "${name}"?`)) return;
        try {
            const result = await deletePromotion(id);
            if (result.success) {
                toast.success('Xóa khuyến mãi thành công');
                fetchPromotions(filters.page);
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa khuyến mãi');
        }
    };

    // Get status badge
    const getStatusBadge = (promotion) => {
        const now = new Date();
        const end = new Date(promotion.endDate);

        if (now > end) {
            return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Quá hạn</span>;
        }
        if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
            return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Hết lượt</span>;
        }
        return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Còn lượt</span>;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    🎟️ Quản lý Khuyến mãi
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {pagination.totalPromotions || 0}
                    </span>
                </h1>
                <p className="text-gray-600 mt-1">Quản lý mã giảm giá và chương trình khuyến mãi</p>
            </div>

            {/* Filters & Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                    <div className="flex-1 max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                        <input
                            type="text"
                            placeholder="Tìm theo mã hoặc tên..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Tất cả</option>
                            <option value="con_luot">Còn lượt</option>
                            <option value="het_luot">Hết lượt</option>
                            <option value="qua_han">Quá hạn</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Tất cả</option>
                            <option value="percentage">Phần trăm (%)</option>
                            <option value="fixed">Số tiền cố định</option>
                        </select>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        + Thêm khuyến mãi
                    </button>
                </div>
            </div>

            {/* Promotions Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : promotions.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🎟️</p>
                        <p className="text-gray-500 text-lg font-medium">Chưa có khuyến mãi nào</p>
                        <p className="text-gray-400 text-sm mt-1">Tạo mã giảm giá đầu tiên</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã / Tên</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại giảm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn tối thiểu</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã dùng</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {promotions.map((promo) => (
                                    <tr key={promo._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className="inline-block bg-primary-50 text-primary-700 font-mono font-bold text-sm px-2 py-0.5 rounded">{promo.code}</span>
                                                <p className="text-sm text-gray-600 mt-1">{promo.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${promo.type === 'percentage' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                {promo.type === 'percentage' ? 'Phần trăm' : 'Cố định'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900">
                                                {promo.type === 'percentage' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {promo.minOrderAmount > 0 ? formatCurrency(promo.minOrderAmount) : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div>{formatDate(promo.startDate)}</div>
                                            <div className="text-xs text-gray-400">→ {formatDate(promo.endDate)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="font-medium text-gray-900">{promo.usedCount}</span>
                                            {promo.usageLimit !== null && (
                                                <span className="text-gray-400">/{promo.usageLimit}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(promo)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openEditModal(promo)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(promo._id, promo.name)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && promotions.length > 0 && pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Trang {pagination.currentPage} / {pagination.totalPages} ({pagination.totalPromotions} khuyến mãi)
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                {editingPromotion ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mã giảm giá <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="VD: SAVE20"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                                        />
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tên khuyến mãi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="VD: Giảm 20% đơn hàng"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="Mô tả chương trình khuyến mãi..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại giảm giá <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="percentage">Phần trăm (%)</option>
                                            <option value="fixed">Số tiền cố định (VND)</option>
                                        </select>
                                    </div>

                                    {/* Discount Value */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá trị giảm <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="discountValue"
                                                value={formData.discountValue}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                                max={formData.type === 'percentage' ? '100' : undefined}
                                                step={formData.type === 'percentage' ? '1' : '1000'}
                                                placeholder={formData.type === 'percentage' ? '10' : '50000'}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 pr-12"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                {formData.type === 'percentage' ? '%' : 'VND'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Applicable To */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phạm vi áp dụng</label>
                                        <select
                                            name="applicableTo"
                                            value={formData.applicableTo}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="all">Tất cả đơn hàng</option>
                                            <option value="category">Theo danh mục</option>
                                            <option value="product">Theo sản phẩm</option>
                                        </select>
                                    </div>

                                    {/* Min Order Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VND)</label>
                                        <input
                                            type="number"
                                            name="minOrderAmount"
                                            value={formData.minOrderAmount}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="10000"
                                            placeholder="0"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày bắt đầu <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày kết thúc <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Usage Limit */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn sử dụng</label>
                                        <input
                                            type="number"
                                            name="usageLimit"
                                            value={formData.usageLimit}
                                            onChange={handleInputChange}
                                            min="0"
                                            placeholder="Không giới hạn"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Để trống = không giới hạn</p>
                                    </div>

                                    {/* Active */}
                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Kích hoạt ngay</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        {submitting ? 'Đang xử lý...' : editingPromotion ? 'Cập nhật' : 'Tạo mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionManagement;
