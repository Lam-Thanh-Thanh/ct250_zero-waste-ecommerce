import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getReviewableProducts, getMyReviews, createReview } from '../api/reviewApi';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiStar, FiImage, FiX, FiCheck, FiClock, FiAlertCircle, FiShoppingBag } from 'react-icons/fi';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const ReviewProduct = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reviewable');
  const [reviewableItems, setReviewableItems] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  // Form state for each product
  const [reviewForms, setReviewForms] = useState({});
  const [expandedForm, setExpandedForm] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'reviewable') {
        const result = await getReviewableProducts();
        if (result.success) {
          setReviewableItems(result.data);
        }
      } else {
        const result = await getMyReviews();
        if (result.success) {
          setMyReviews(result.data.reviews);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormChange = (productId, field, value) => {
    setReviewForms(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleImageChange = (productId, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }
    setReviewForms(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        imageFiles: files,
        imagePreviews: files.map(f => URL.createObjectURL(f))
      }
    }));
  };

  const removeImage = (productId, index) => {
    setReviewForms(prev => {
      const current = prev[productId] || {};
      const newFiles = [...(current.imageFiles || [])];
      const newPreviews = [...(current.imagePreviews || [])];
      URL.revokeObjectURL(newPreviews[index]);
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      return {
        ...prev,
        [productId]: { ...current, imageFiles: newFiles, imagePreviews: newPreviews }
      };
    });
  };

  const handleSubmitReview = async (item) => {
    const productId = item.product._id;
    const form = reviewForms[productId] || {};

    if (!form.rating) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    if (!form.comment || form.comment.trim().length < 10) {
      toast.error('Bình luận phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setSubmitting(productId);
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('orderId', item.order._id);
      formData.append('rating', form.rating);
      formData.append('comment', form.comment.trim());

      if (form.imageFiles) {
        form.imageFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      await createReview(formData);
      toast.success('🎉 Đánh giá đã được gửi và đang chờ duyệt!');

      // Cleanup previews
      if (form.imagePreviews) {
        form.imagePreviews.forEach(url => URL.revokeObjectURL(url));
      }

      setReviewForms(prev => {
        const newForms = { ...prev };
        delete newForms[productId];
        return newForms;
      });
      setExpandedForm(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmitting(null);
    }
  };

  const renderStars = (rating, onSelect, size = 24) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onSelect && onSelect(star)}
            className={`transition-all duration-200 ${onSelect ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          >
            <FiStar
              size={size}
              className={star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
              }
            />
          </button>
        ))}
      </div>
    );
  };

  const REVIEW_STATUS = {
    pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800', icon: <FiClock /> },
    approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: <FiCheck /> },
    rejected: { label: 'Bị từ chối', color: 'bg-red-100 text-red-800', icon: <FiAlertCircle /> },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link to="/orders" className="text-green-600 hover:text-green-700 flex items-center">
            <FiArrowLeft className="mr-1" /> Đơn hàng
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Đánh giá sản phẩm</h1>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('reviewable')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
              activeTab === 'reviewable'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
            }`}
          >
            🛍️ Chờ đánh giá
          </button>
          <button
            onClick={() => setActiveTab('my-reviews')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
              activeTab === 'my-reviews'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
            }`}
          >
            ⭐ Đánh giá của tôi
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải...</p>
          </div>
        ) : activeTab === 'reviewable' ? (
          /* Reviewable Products */
          reviewableItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FiShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Không có sản phẩm nào cần đánh giá</p>
              <p className="text-sm text-gray-400 mb-4">Hãy mua sắm và nhận hàng để có thể đánh giá sản phẩm</p>
              <Link to="/" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewableItems.map((item) => {
                const productId = item.product._id;
                const form = reviewForms[productId] || {};
                const isExpanded = expandedForm === productId;

                return (
                  <div key={productId} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Product Info */}
                    <div className="p-5 flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image ? (
                          <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FiShoppingBag size={28} />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.product.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-500">
                            {[item.variant.size && `Size: ${item.variant.size}`, item.variant.weight && `${item.variant.weight}g`, item.variant.volume].filter(Boolean).join(' - ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Đơn hàng: <span className="font-medium">{item.order.orderNumber}</span>
                          {item.order.deliveredAt && ` • Giao ngày ${formatDate(item.order.deliveredAt)}`}
                        </p>
                        <p className="text-green-600 font-semibold mt-1">{formatPrice(item.product.finalPrice)}</p>
                      </div>
                      <button
                        onClick={() => setExpandedForm(isExpanded ? null : productId)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition flex-shrink-0 ${
                          isExpanded
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                        }`}
                      >
                        {isExpanded ? 'Thu gọn' : '✍️ Viết đánh giá'}
                      </button>
                    </div>

                    {/* Review Form */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-5 space-y-4">
                        {/* Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Đánh giá chung <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-3">
                            {renderStars(form.rating || 0, (star) => handleFormChange(productId, 'rating', star), 32)}
                            <span className="text-sm text-gray-500">
                              {form.rating === 1 && 'Rất tệ'}
                              {form.rating === 2 && 'Tệ'}
                              {form.rating === 3 && 'Bình thường'}
                              {form.rating === 4 && 'Tốt'}
                              {form.rating === 5 && 'Tuyệt vời'}
                            </span>
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bình luận <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={form.comment || ''}
                            onChange={(e) => handleFormChange(productId, 'comment', e.target.value)}
                            rows={4}
                            maxLength={1000}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (tối thiểu 10 ký tự)"
                          />
                          <p className="text-xs text-gray-400 mt-1 text-right">
                            {(form.comment || '').length}/1000
                          </p>
                        </div>

                        {/* Image Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📷 Hình ảnh (tối đa 5 ảnh)
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {(form.imagePreviews || []).map((preview, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-green-200">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(productId, idx)}
                                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                            ))}
                            {(form.imageFiles || []).length < 5 && (
                              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
                                <FiImage className="text-gray-400" size={20} />
                                <span className="text-xs text-gray-400 mt-1">Thêm</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  multiple
                                  onChange={(e) => handleImageChange(productId, e)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSubmitReview(item)}
                            disabled={submitting === productId}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-md"
                          >
                            {submitting === productId ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Đang gửi...
                              </>
                            ) : (
                              <>
                                <FiCheck /> Gửi đánh giá
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* My Reviews */
          myReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FiStar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Bạn chưa có đánh giá nào</p>
              <button
                onClick={() => setActiveTab('reviewable')}
                className="mt-3 inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Đánh giá sản phẩm ngay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((review) => {
                const statusConfig = REVIEW_STATUS[review.status] || {};
                const productImage = review.product?.images?.[0]?.url;

                return (
                  <div key={review._id} className="bg-white rounded-lg shadow-md p-5">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {productImage ? (
                          <img src={productImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FiShoppingBag size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        {/* Product Name + Status */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-gray-900 truncate">{review.product?.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 flex items-center gap-1 ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating, null, 16)}
                          <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                          {review.verifiedPurchase && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Đã mua</span>
                          )}
                        </div>

                        {/* Comment */}
                        <p className="text-gray-700 mt-2 text-sm leading-relaxed">{review.comment}</p>

                        {/* Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.images.map((img, idx) => (
                              <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Admin Note (if rejected) */}
                        {review.status === 'rejected' && review.adminNote && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700">
                              <strong>Lý do từ chối:</strong> {review.adminNote}
                            </p>
                          </div>
                        )}

                        {/* Order info */}
                        {review.order && (
                          <p className="text-xs text-gray-400 mt-2">
                            Đơn hàng: {review.order.orderNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReviewProduct;
