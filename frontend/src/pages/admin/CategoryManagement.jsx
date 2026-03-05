import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteCategoryImage
} from '../../api/categoryApi';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCategories: 0,
        limit: 10
    });

    // Filters
    const [search, setSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('all');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch categories
    const fetchCategories = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit,
                search,
                ...(isActiveFilter !== 'all' && { isActive: isActiveFilter })
            };

            const response = await getCategories(params);
            setCategories(response.data.categories);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [search, isActiveFilter]);

    // Handle search
    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Handle filter
    const handleFilterChange = (filter) => {
        setIsActiveFilter(filter);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Open modal for create/edit
    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                isActive: category.isActive
            });
            setImagePreview(category.image?.url || null);
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                isActive: true
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', isActive: true });
        setImageFile(null);
        setImagePreview(null);
    };

    // Handle form input
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('isActive', formData.isActive);

            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editingCategory) {
                await updateCategory(editingCategory._id, data);
                toast.success('Cập nhật danh mục thành công');
            } else {
                await createCategory(data);
                toast.success('Tạo danh mục thành công');
            }

            closeModal();
            fetchCategories(pagination.currentPage);
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) return;

        try {
            await deleteCategory(id);
            toast.success('Xóa danh mục thành công');
            fetchCategories(pagination.currentPage);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa danh mục');
        }
    };

    // Handle delete image
    const handleDeleteImage = async (categoryId) => {
        if (!window.confirm('Bạn có chắc muốn xóa hình ảnh này?')) return;

        try {
            await deleteCategoryImage(categoryId);
            toast.success('Xóa hình ảnh thành công');
            fetchCategories(pagination.currentPage);
            setImagePreview(null);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa hình ảnh');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Danh mục</h1>
                    <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm</p>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên..."
                                value={search}
                                onChange={handleSearch}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={isActiveFilter}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="true">Hoạt động</option>
                                <option value="false">Không hoạt động</option>
                            </select>
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() => openModal()}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            + Thêm danh mục
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Không có danh mục nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Hình ảnh
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Tên danh mục
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Mô tả
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Số sản phẩm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {category.image?.url ? (
                                                <img
                                                    src={category.image.url}
                                                    alt={category.name}
                                                    className="h-12 w-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">No img</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{category.name}</div>
                                            <div className="text-sm text-gray-500">{category.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700 max-w-xs truncate">
                                                {category.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {category.productCount} sản phẩm
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${category.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(category)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category._id, category.name)}
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
                    {!loading && categories.length > 0 && (
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
                                            pagination.totalCategories
                                        )}
                                    </span>{' '}
                                    trong tổng số{' '}
                                    <span className="font-medium">{pagination.totalCategories}</span> danh mục
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchCategories(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Trước
                                    </button>
                                    <span className="px-4 py-1 text-sm text-gray-700">
                                        Trang {pagination.currentPage} / {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchCategories(pagination.currentPage + 1)}
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
                                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên danh mục <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Ví dụ: Chai lọ tái chế"
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
                                        placeholder="Mô tả ngắn về danh mục..."
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hình ảnh
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    {imagePreview && (
                                        <div className="mt-2 relative inline-block">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-32 w-32 object-cover rounded-lg"
                                            />
                                            {editingCategory?.image?.url && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteImage(editingCategory._id)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
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
                                        {submitting ? 'Đang xử lý...' : editingCategory ? 'Cập nhật' : 'Tạo mới'}
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

export default CategoryManagement;