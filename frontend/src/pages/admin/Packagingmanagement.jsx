import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    getPackagings,
    createPackaging,
    updatePackaging,
    deletePackaging
} from '../../api/packagingApi';

const PackagingManagement = () => {
    const [packagings, setPackagings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalPackagings: 0,
        limit: 10
    });

    // Filters
    const [search, setSearch] = useState('');
    const [biodegradableFilter, setBiodegradableFilter] = useState('all');
    const [isActiveFilter, setIsActiveFilter] = useState('all');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingPackaging, setEditingPackaging] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        material: '',
        description: '',
        isBiodegradable: false,
        isReusable: false,
        isRecyclable: false,
        decompositionTime: '',
        isActive: true
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch packagings
    const fetchPackagings = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit,
                search,
                ...(biodegradableFilter !== 'all' && { isBiodegradable: biodegradableFilter }),
                ...(isActiveFilter !== 'all' && { isActive: isActiveFilter })
            };

            const response = await getPackagings(params);
            setPackagings(response.data.packagings);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải bao bì');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackagings();
    }, [search, biodegradableFilter, isActiveFilter]);

    // Handle search
    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Open modal
    const openModal = (packaging = null) => {
        if (packaging) {
            setEditingPackaging(packaging);
            setFormData({
                name: packaging.name,
                material: packaging.material,
                description: packaging.description || '',
                isBiodegradable: packaging.isBiodegradable,
                isReusable: packaging.isReusable,
                isRecyclable: packaging.isRecyclable,
                decompositionTime: packaging.decompositionTime?.toString() || '',
                isActive: packaging.isActive
            });
        } else {
            setEditingPackaging(null);
            setFormData({
                name: '',
                material: '',
                description: '',
                isBiodegradable: false,
                isReusable: false,
                isRecyclable: false,
                decompositionTime: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPackaging(null);
        setFormData({
            name: '',
            material: '',
            description: '',
            isBiodegradable: false,
            isReusable: false,
            isRecyclable: false,
            decompositionTime: '',
            isActive: true
        });
    };

    // Handle input
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
        setSubmitting(true);

        try {
            const data = {
                name: formData.name,
                material: formData.material,
                description: formData.description,
                isBiodegradable: formData.isBiodegradable,
                isReusable: formData.isReusable,
                isRecyclable: formData.isRecyclable,
                decompositionTime: formData.decompositionTime ? parseInt(formData.decompositionTime) : null,
                isActive: formData.isActive
            };

            if (editingPackaging) {
                await updatePackaging(editingPackaging._id, data);
                toast.success('Cập nhật bao bì thành công');
            } else {
                await createPackaging(data);
                toast.success('Tạo bao bì thành công');
            }

            closeModal();
            fetchPackagings(pagination.currentPage);
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa bao bì "${name}"?`)) return;

        try {
            await deletePackaging(id);
            toast.success('Xóa bao bì thành công');
            fetchPackagings(pagination.currentPage);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa bao bì');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Bao bì</h1>
                    <p className="text-gray-600 mt-1">Quản lý bao bì thân thiện môi trường</p>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            {/* Search */}
                            <div className="flex-1 max-w-md">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên hoặc chất liệu..."
                                    value={search}
                                    onChange={handleSearch}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={() => openModal()}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                + Thêm bao bì
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4 flex-wrap">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                <select
                                    value={isActiveFilter}
                                    onChange={(e) => setIsActiveFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="true">Hoạt động</option>
                                    <option value="false">Không hoạt động</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phân hủy</label>
                                <select
                                    value={biodegradableFilter}
                                    onChange={(e) => setBiodegradableFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="true">Phân hủy sinh học</option>
                                    <option value="false">Không phân hủy</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : packagings.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Không có bao bì nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Tên bao bì
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Chất liệu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Tính năng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Phân hủy
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Số SP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {packagings.map((packaging) => (
                                    <tr key={packaging._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{packaging.name}</div>
                                            {packaging.description && (
                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                    {packaging.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{packaging.material}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {packaging.isReusable && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        Tái sử dụng
                                                    </span>
                                                )}
                                                {packaging.isRecyclable && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                        Tái chế
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {packaging.isBiodegradable ? (
                                                <div>
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        Phân hủy sinh học
                                                    </span>
                                                    {packaging.decompositionTime && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {packaging.decompositionTime} ngày
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                    Không phân hủy
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {packaging.productCount} sản phẩm
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${packaging.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {packaging.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(packaging)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(packaging._id, packaging.name)}
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
                    {!loading && packagings.length > 0 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Hiển thị{' '}
                                    <span className="font-medium">
                                        {(pagination.currentPage - 1) * pagination.limit + 1}
                                    </span>{' '}
                                    đến{' '}
                                    <span className="font-medium">
                                        {Math.min(
                                            pagination.currentPage * pagination.limit,
                                            pagination.totalPackagings
                                        )}
                                    </span>{' '}
                                    trong tổng số{' '}
                                    <span className="font-medium">{pagination.totalPackagings}</span> bao bì
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchPackagings(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Trước
                                    </button>
                                    <span className="px-4 py-1 text-sm text-gray-700">
                                        Trang {pagination.currentPage} / {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchPackagings(pagination.currentPage + 1)}
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingPackaging ? 'Cập nhật bao bì' : 'Thêm bao bì mới'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên bao bì <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Ví dụ: Giấy tái chế 100%"
                                    />
                                </div>

                                {/* Material */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chất liệu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="material"
                                        value={formData.material}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Ví dụ: Giấy Kraft tái chế"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Mô tả ngắn về bao bì..."
                                    />
                                </div>

                                {/* Properties Checkboxes */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tính năng
                                    </label>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isBiodegradable"
                                            checked={formData.isBiodegradable}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Phân hủy sinh học (Biodegradable)
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isReusable"
                                            checked={formData.isReusable}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Có thể tái sử dụng (Reusable)
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isRecyclable"
                                            checked={formData.isRecyclable}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Có thể tái chế (Recyclable)
                                        </label>
                                    </div>
                                </div>

                                {/* Decomposition Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thời gian phân hủy (ngày)
                                    </label>
                                    <input
                                        type="number"
                                        name="decompositionTime"
                                        value={formData.decompositionTime}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="VD: 90"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Chỉ áp dụng nếu phân hủy sinh học</p>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Hoạt động
                                    </label>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        {submitting ? 'Đang xử lý...' : editingPackaging ? 'Cập nhật' : 'Tạo mới'}
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

export default PackagingManagement;