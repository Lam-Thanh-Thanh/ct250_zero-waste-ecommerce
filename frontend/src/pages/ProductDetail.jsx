import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { getProductById } from '../api/productApi';
import { getProductReviews } from '../api/reviewApi';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiStar, FiPackage, FiChevronLeft, FiThumbsUp, FiCheckCircle } from 'react-icons/fi';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addToCart, cartItemCount } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewPagination, setReviewPagination] = useState(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await getProductById(id);
        if (res.success && res.data) {
          setProduct(res.data);
          setActiveImageIndex(0);
          setQuantity(1);
          setSelectedVariantId('');
        } else {
          setProduct(null);
          toast.error('Không tìm thấy sản phẩm');
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Không tải được sản phẩm');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      setLoadingReviews(true);
      try {
        const res = await getProductReviews(id, { page: reviewPage, limit: 5 });
        if (res.success && res.data) {
          setReviews(res.data.reviews || []);
          setReviewStats(res.data.stats || null);
          setReviewPagination(res.data.pagination || null);
        }
      } catch (err) {
        console.error('Load reviews error:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    loadReviews();
  }, [id, reviewPage]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const images = product?.images?.length ? product.images : [];
  const mainImage = images[activeImageIndex] || images.find((img) => img.isMain) || images[0];

  const hasVariants = product?.variants && product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => String(v._id) === String(selectedVariantId))
    : null;

  let basePrice = product?.price ?? 0;
  if (selectedVariant) basePrice = basePrice + (selectedVariant.priceModifier || 0);
  const finalUnitPrice = product
    ? basePrice - (basePrice * (product.discount || 0)) / 100
    : 0;

  const stockAvailable = hasVariants
    ? selectedVariant
      ? selectedVariant.stockQuantity
      : null
    : product?.stock ?? 0;

  const maxQty = hasVariants
    ? selectedVariant
      ? Math.max(0, selectedVariant.stockQuantity)
      : 0
    : Math.max(0, product?.stock ?? 0);

  const canAdd =
    product &&
    product.inStock !== false &&
    (!hasVariants || selectedVariant) &&
    (hasVariants ? selectedVariant && selectedVariant.stockQuantity > 0 : (product.stock ?? 0) > 0);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    if (hasVariants && !selectedVariantId) {
      toast.warning('Vui lòng chọn phân loại sản phẩm');
      return;
    }
    const q = Math.min(Math.max(1, quantity), maxQty || 1);
    if (maxQty < 1) {
      toast.warning('Sản phẩm đã hết hàng');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id, q, hasVariants ? selectedVariantId : null);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error) {
      toast.error(error.message || 'Lỗi khi thêm vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

  // Star rendering helper
  const renderStars = (rating, size = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-${size === 16 ? 4 : 5} h-${size === 16 ? 4 : 5} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="mt-4 text-gray-500">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <FiPackage className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-600 mb-6">Không tìm thấy sản phẩm</p>
        <Link to="/productlist" className="text-green-700 font-medium hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <nav className="text-sm text-gray-600 mb-4 sm:mb-6 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-green-700">Trang chủ</Link>
          <span>/</span>
          <Link to="/productlist" className="hover:text-green-700">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900 line-clamp-1">{product.name}</span>
        </nav>

        <Link
          to="/productlist"
          className="inline-flex items-center text-green-700 hover:underline mb-6 sm:mb-8 text-sm font-medium"
        >
          <FiChevronLeft className="mr-1" />
          Quay lại danh sách
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12">
          <div>
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              {mainImage ? (
                <img src={mainImage.url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FiPackage size={80} />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img._id || idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 ${
                      idx === activeImageIndex ? 'border-green-600' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.discount > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-3">
                Giảm {product.discount}%
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.category && (
              <p className="text-green-700 font-medium mb-4">{product.category.name}</p>
            )}

            {product.rating?.count > 0 && (
              <div className="flex items-center text-gray-600 mb-4 gap-2">
                {renderStars(Math.round(product.rating.average))}
                <span className="text-sm">{product.rating.average.toFixed(1)}</span>
                <span className="text-sm text-gray-400">· {product.rating.count} đánh giá</span>
              </div>
            )}

            <div className="mb-6">
              {product.discount > 0 ? (
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-bold text-green-700">{formatPrice(finalUnitPrice)}</span>
                  <span className="text-base sm:text-lg text-gray-400 line-through">{formatPrice(basePrice)}</span>
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-green-700">{formatPrice(basePrice)}</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-gray-700 mb-6 leading-relaxed text-sm sm:text-base">{product.shortDescription}</p>
            )}

            <div className="mb-6 border-t border-b border-gray-100 py-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Thông tin sản phẩm</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {hasVariants && product.variants?.length > 0 && (
                  <li className="flex items-start">
                    <span className="w-32 shrink-0 font-medium text-gray-900">Phân loại:</span>
                    <span>{product.variants.map(v => [v.size, v.weight ? `${v.weight}g` : '', v.volume].filter(Boolean).join(' · ') || 'Tuỳ chọn').join(', ')}</span>
                  </li>
                )}
                {product.materials?.length > 0 && (
                  <li className="flex items-start">
                    <span className="w-32 shrink-0 font-medium text-gray-900">Thành phần:</span>
                    <span>{product.materials.join(', ')}</span>
                  </li>
                )}
                {(product.isNaturalMaterial || product.isReusable || product.isBiodegradable || product.hasRefill) && (
                  <li className="flex items-start">
                    <span className="w-32 shrink-0 font-medium text-gray-900">Tiêu chí sinh thái:</span>
                    <span className="flex flex-wrap gap-x-3 gap-y-1">
                      {product.isNaturalMaterial && <span>• Tự nhiên</span>}
                      {product.isReusable && <span>• Tái sử dụng</span>}
                      {product.isBiodegradable && <span>• Phân hủy sinh học</span>}
                      {product.hasRefill && <span>• Có thể Refill</span>}
                    </span>
                  </li>
                )}
                {product.certificates?.length > 0 && (
                  <li className="flex items-start">
                    <span className="w-32 shrink-0 font-medium text-gray-900">Chứng nhận:</span>
                    <span className="flex flex-wrap gap-2">
                       {product.certificates.map(cert => cert?.name).join(', ')}
                    </span>
                  </li>
                )}
                {product.packaging && (
                  <li className="flex items-start">
                    <span className="w-32 shrink-0 font-medium text-gray-900">Bao bì:</span>
                    <span>{product.packaging.name} ({product.packaging.material})</span>
                  </li>
                )}
                {product.ecoScore > 0 && (
                  <li className="flex items-start mt-4 pt-3 border-t border-gray-50">
                    <span className="w-32 shrink-0 font-medium font-bold text-green-800">Điểm xanh:</span>
                    <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">{product.ecoScore}/5</span>
                  </li>
                )}
              </ul>
            </div>

            {hasVariants && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phân loại</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full max-w-md py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                >
                  <option value="">Chọn phân loại...</option>
                  {product.variants.map((v) => (
                    <option key={v._id} value={v._id} disabled={v.stockQuantity <= 0}>
                      {[v.size, v.weight ? `${v.weight}g` : '', v.volume].filter(Boolean).join(' · ') || 'Mặc định'}
                      {v.priceModifier
                        ? ` (${v.priceModifier > 0 ? '+' : ''}${formatPrice(v.priceModifier)})`
                        : ''}
                      {v.stockQuantity <= 0 ? ' — Hết hàng' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6 sm:mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                  <button
                    type="button"
                    className="px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 text-lg"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, maxQty)}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isNaN(v)) return;
                      setQuantity(Math.min(Math.max(1, v), Math.max(1, maxQty)));
                    }}
                    className="w-14 sm:w-16 text-center py-2 border-x border-gray-300"
                  />
                  <button
                    type="button"
                    className="px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 text-lg"
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, maxQty), q + 1))}
                    disabled={quantity >= maxQty}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 pt-6 sm:pt-8">
                {hasVariants && !selectedVariant ? (
                  <span>Chọn phân loại để xem tồn kho</span>
                ) : (
                  <span>Còn lại: <strong>{stockAvailable ?? 0}</strong> sản phẩm</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAdd || adding || quantity > maxQty}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold transition-all ${
                canAdd && quantity <= maxQty
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {adding ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : (
                <>
                  <FiShoppingCart size={22} />
                  Thêm vào giỏ hàng
                </>
              )}
            </button>
          </div>
        </div>

        {/* Description */}
        <section className="mt-12 sm:mt-16 border-t border-gray-200 pt-8 sm:pt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
          <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap text-sm sm:text-base">
            {product.description}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mt-12 sm:mt-16 border-t border-gray-200 pt-8 sm:pt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Đánh giá sản phẩm</h2>

          {/* Review Stats Summary */}
          {reviewStats && reviewStats.totalReviews > 0 ? (
            <>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  {/* Average Score */}
                  <div className="text-center flex-shrink-0">
                    <div className="text-4xl sm:text-5xl font-bold text-green-700">
                      {(reviewStats.averageRating || 0).toFixed(1)}
                    </div>
                    <div className="mt-1">{renderStars(Math.round(reviewStats.averageRating || 0), 20)}</div>
                    <p className="text-sm text-gray-500 mt-1">{reviewStats.totalReviews} đánh giá</p>
                  </div>

                  {/* Distribution bars */}
                  <div className="flex-1 w-full space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewStats.distribution?.[star] || 0;
                      const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm text-gray-600 w-6 sm:w-8 text-right">{star}★</span>
                          <div className="flex-1 h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-6 sm:w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-4 sm:space-y-6">
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 font-semibold text-sm">
                            {review.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Username + Badge */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm text-gray-900">{review.user?.username || 'Ẩn danh'}</span>
                            {review.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">
                                <FiCheckCircle size={10} />
                                Đã mua
                              </span>
                            )}
                          </div>

                          {/* Stars + Date */}
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                          </div>

                          {/* Comment */}
                          <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>

                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto">
                              {review.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Review ${idx + 1}`}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                />
                              ))}
                            </div>
                          )}

                          {/* Helpful */}
                          {review.helpful > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                              <FiThumbsUp size={12} />
                              <span>{review.helpful} hữu ích</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Review Pagination */}
              {reviewPagination && reviewPagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    type="button"
                    disabled={reviewPage <= 1}
                    onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-sm"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-600">
                    {reviewPagination.currentPage} / {reviewPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={reviewPage >= reviewPagination.totalPages}
                    onClick={() => setReviewPage((p) => Math.min(reviewPagination.totalPages, p + 1))}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-sm"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <FiStar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Chưa có đánh giá nào cho sản phẩm này</p>
              <p className="text-gray-400 text-xs mt-1">Hãy là người đầu tiên đánh giá!</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
