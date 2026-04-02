import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    getReviews,
    approveReview,
    rejectReview,
    deleteReview,
    getReviewById
} from '../../api/reviewApi';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        rating: 'all',
        search: '',
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState({});

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [rejectNote, setRejectNote] = useState('');

    // Fetch reviews
    const fetchReviews = async (page = filters.page) => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page
            };
            if (params.status === 'all') delete params.status;
            if (params.rating === 'all') delete params.rating;

            const response = await getReviews(params);
            setReviews(response.data.reviews);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [filters.status, filters.rating, filters.page]);

    // Handle approve
    const handleApprove = async (id) => {
        if (!confirm('Bạn có chắc muốn duyệt đánh giá này?')) return;

        try {
            await approveReview(id);
            toast.success('Duyệt đánh giá thành công');
            fetchReviews();
        } catch (error) {
            toast.error(error.message || 'Lỗi khi duyệt đánh giá');
        }
    };

    // Handle reject - open modal
    const handleRejectClick = (review) => {
        setSelectedReview(review);
        setRejectNote('');
        setShowRejectModal(true);
    };

    // Submit reject
    const handleRejectSubmit = async () => {
        if (!rejectNote.trim()) {
            toast.warning('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            await rejectReview(selectedReview._id, rejectNote);
            toast.success('Từ chối đánh giá thành công');
            setShowRejectModal(false);
            setSelectedReview(null);
            setRejectNote('');
            fetchReviews();
        } catch (error) {
            toast.error(error.message || 'Lỗi khi từ chối đánh giá');
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác.')) return;

        try {
            await deleteReview(id);
            toast.success('Xóa đánh giá thành công');
            fetchReviews();
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa đánh giá');
        }
    };

    // View detail
    const viewDetail = async (id) => {
        try {
            const response = await getReviewById(id);
            setSelectedReview(response.data);
            setShowDetailModal(true);
        } catch (error) {
            toast.error('Lỗi khi tải thông tin đánh giá');
        }
    };

    // Render stars
    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                    </svg>
                ))}
            </div>
        );
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            pending: <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Chờ duyệt</span>,
            approved: <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đã duyệt</span>,
            rejected: <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Đã từ chối</span>
        };
        return badges[status] || status;
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Đánh giá</h1>
                    <p className="text-gray-600 mt-1">Duyệt và quản lý đánh giá từ khách hàng</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">Tất cả</option>
                                <option value="pending">Chờ duyệt</option>
                                <option value="approved">Đã duyệt</option>
                                <option value="rejected">Đã từ chối</option>
                            </select>
                        </div>

                        {/* Rating filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá</label>
                            <select
                                value={filters.rating}
                                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value, page: 1 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">Tất cả</option>
                                <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                                <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                                <option value="3">⭐⭐⭐ (3 sao)</option>
                                <option value="2">⭐⭐ (2 sao)</option>
                                <option value="1">⭐ (1 sao)</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && fetchReviews(1)}
                                placeholder="Tìm theo bình luận..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Reviews Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-gray-600">Đang tải...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <p className="text-gray-600">Không có đánh giá nào</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Sản phẩm</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Người dùng</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Đánh giá</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Bình luận</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ngày tạo</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reviews.map((review) => (
                                        <tr key={review._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {review.product?.images?.[0] && (
                                                        <img
                                                            src={review.product.images[0].url || review.product.images[0]}
                                                            alt={review.product.name}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="font-medium text-gray-900 max-w-xs truncate">
                                                        {review.product?.name || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{review.user?.username || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{review.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStars(review.rating)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {review.comment}
                                                </div>
                                                {review.images && review.images.length > 0 && (
                                                    <div className="flex items-center gap-1 mt-1.5 text-xs text-blue-600 font-medium">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {review.images.length} ảnh đính kèm
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(review.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {formatDate(review.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => viewDetail(review._id)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Chi tiết"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {review.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(review._id)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Duyệt"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectClick(review)}
                                                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="Từ chối"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(review._id)}
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

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> đến{' '}
                                        <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalReviews)}</span> trong{' '}
                                        <span className="font-medium">{pagination.totalReviews}</span> đánh giá
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.currentPage === 1}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Trước
                                        </button>
                                        <span className="px-4 py-1 text-sm text-gray-700">
                                            Trang {pagination.currentPage} / {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Chi tiết đánh giá</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Product Info */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Sản phẩm</h3>
                                <div className="flex items-center gap-3">
                                    {selectedReview.product?.images?.[0] && (
                                        <img
                                            src={selectedReview.product.images[0].url || selectedReview.product.images[0]}
                                            alt={selectedReview.product.name}
                                            className="w-16 h-16 object-cover rounded border border-gray-200"
                                        />
                                    )}
                                    <div>
                                        <div className="font-medium">{selectedReview.product?.name}</div>
                                        {selectedReview.verifiedPurchase && (
                                            <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                                ✓ Đã mua hàng
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Người đánh giá</h3>
                                <div className="text-sm text-gray-700">{selectedReview.user?.username}</div>
                                <div className="text-xs text-gray-500">{selectedReview.user?.email}</div>
                            </div>

                            {/* Rating */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Đánh giá</h3>
                                {renderStars(selectedReview.rating)}
                            </div>

                            {/* Comment & Images */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Bình luận</h3>
                                <p className="text-gray-700">{selectedReview.comment}</p>
                                
                                {/* Review Images */}
                                {selectedReview.images && selectedReview.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {selectedReview.images.map((img, idx) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                    src={img} 
                                                    alt={`Review ${idx}`} 
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm hover:opacity-90 transition-opacity"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Trạng thái</h3>
                                {getStatusBadge(selectedReview.status)}
                                {selectedReview.adminNote && (
                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                                        <div className="text-xs font-medium text-red-800 mb-1">Lý do từ chối:</div>
                                        <div className="text-sm text-red-700">{selectedReview.adminNote}</div>
                                    </div>
                                )}
                            </div>

                            {/* Created Date */}
                            <div className="mb-6 text-sm text-gray-500">
                                Ngày tạo: {formatDate(selectedReview.createdAt)}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                {selectedReview.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleApprove(selectedReview._id);
                                                setShowDetailModal(false);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                handleRejectClick(selectedReview);
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Từ chối
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        handleDelete(selectedReview._id);
                                        setShowDetailModal(false);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    Xóa
                                </button>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Từ chối đánh giá</h2>
                            <p className="text-gray-600 mb-4">
                                Vui lòng nhập lý do từ chối đánh giá này:
                            </p>
                            <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                rows="4"
                                placeholder="Ví dụ: Nội dung không phù hợp, spam, ngôn từ không lịch sự..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-4"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Từ chối
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManagement;
