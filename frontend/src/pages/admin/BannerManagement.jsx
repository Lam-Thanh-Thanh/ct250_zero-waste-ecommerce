import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '../../api/bannerApi';

const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        link: '',
        buttonText: '',
        order: 0,
        isActive: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch banners
    const fetchBanners = async () => {
        setLoading(true);
        try {
            const response = await getAllBanners();
            setBanners(response.data);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải banner');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    // Open modal
    const openModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                subtitle: banner.subtitle || '',
                link: banner.link || '',
                buttonText: banner.buttonText || '',
                order: banner.order || 0,
                isActive: banner.isActive
            });
            setImagePreview(banner.image || null);
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                subtitle: '',
                link: '',
                buttonText: '',
                order: 0,
                isActive: true
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBanner(null);
        setFormData({ title: '', subtitle: '', link: '', buttonText: '', order: 0, isActive: true });
        setImageFile(null);
        setImagePreview(null);
    };

    // Handle input
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle image
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
            data.append('title', formData.title);
            data.append('subtitle', formData.subtitle);
            data.append('link', formData.link);
            data.append('buttonText', formData.buttonText);
            data.append('order', formData.order);
            data.append('isActive', formData.isActive);

            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editingBanner) {
                await updateBanner(editingBanner._id, data);
                toast.success('Cập nhật banner thành công');
            } else {
                await createBanner(data);
                toast.success('Tạo banner thành công');
            }

            closeModal();
            fetchBanners();
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id, title) => {
        if (!window.confirm(`Bạn có chắc muốn xóa banner "${title}"?`)) return;

        try {
            await deleteBanner(id);
            toast.success('Xóa banner thành công');
            fetchBanners();
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa banner');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Banner</h1>
                    <p className="text-gray-600 mt-1">Quản lý banner trang chủ</p>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-end">
                    <button
                        onClick={() => openModal()}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                        + Thêm banner
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Chưa có banner nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Hình ảnh</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tiêu đề</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Link</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Thứ tự</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Trạng thái</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {banners.map((banner) => (
                                    <tr key={banner._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {banner.image ? (
                                                <img src={banner.image} alt={banner.title} className="h-16 w-32 rounded object-cover" />
                                            ) : (
                                                <div className="h-16 w-32 rounded bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">No img</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{banner.title}</div>
                                            <div className="text-sm text-gray-500">{banner.subtitle}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{banner.link || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{banner.order}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {banner.isActive ? 'Hoạt động' : 'Ẩn'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(banner)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(banner._id, banner.title)}
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
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingBanner ? 'Cập nhật banner' : 'Thêm banner mới'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Tiêu đề banner"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phụ đề</label>
                                    <input
                                        type="text"
                                        name="subtitle"
                                        value={formData.subtitle}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Phụ đề mô tả"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                                    <input
                                        type="text"
                                        name="link"
                                        value={formData.link}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="/collections/eco-products"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Text button</label>
                                    <input
                                        type="text"
                                        name="buttonText"
                                        value={formData.buttonText}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Mua ngay"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hình ảnh {!editingBanner && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        required={!editingBanner}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    {imagePreview && (
                                        <img src={imagePreview} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />
                                    )}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-primary-600 rounded"
                                    />
                                    <label className="ml-2 text-sm text-gray-700">Hoạt động</label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                        Hủy
                                    </button>
                                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">
                                        {submitting ? 'Đang xử lý...' : editingBanner ? 'Cập nhật' : 'Tạo mới'}
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

export default BannerManagement;
