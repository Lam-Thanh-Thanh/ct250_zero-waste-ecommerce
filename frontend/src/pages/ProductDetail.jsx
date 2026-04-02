import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { getProductById } from '../api/productApi';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiStar, FiPackage, FiChevronLeft } from 'react-icons/fi';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout, loading: authLoading } = useAuth();
  const { addToCart, cartItemCount } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center">
              <img src="/Zero-Waste Store.png" alt="Logo" className="h-10 w-auto object-contain" />
              <span className="ml-2 text-xl font-bold text-gray-800">Zero-Waste Store</span>
            </Link>

            <nav className="flex items-center space-x-4">
              {authLoading ? (
                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-md" />
              ) : isAuthenticated ? (
                <>
                  <span className="text-gray-700 hidden sm:inline">
                    Xin chào, <strong>{user?.username}</strong>
                  </span>
                  <Link to="/productlist" className="text-gray-700 hover:text-green-600">
                    Sản phẩm
                  </Link>
                  <Link to="/cart" className="text-gray-700 hover:text-green-600 relative" title="Giỏ hàng">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                      />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {cartItemCount > 9 ? '9+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                  {isAdmin && isAdmin() && (
                    <Link to="/admin/dashboard" className="text-gray-700 hover:text-green-600">
                      Quản trị
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/productlist" className="text-gray-700 hover:text-green-600">
                    Sản phẩm
                  </Link>
                  <Link to="/login" className="text-gray-700 hover:text-green-600">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-600 mb-6 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-green-700">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/productlist" className="hover:text-green-700">
            Sản phẩm
          </Link>
          <span>/</span>
          <span className="text-gray-900 line-clamp-1">{product.name}</span>
        </nav>

        <Link
          to="/productlist"
          className="inline-flex items-center text-green-700 hover:underline mb-8 text-sm font-medium"
        >
          <FiChevronLeft className="mr-1" />
          Quay lại danh sách
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
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
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.category && (
              <p className="text-green-700 font-medium mb-4">
                {product.category.name}
              </p>
            )}

            {product.rating?.count > 0 && (
              <div className="flex items-center text-gray-600 mb-4">
                <FiStar className="text-yellow-400 fill-current mr-1" />
                <span>{product.rating.average.toFixed(1)}</span>
                <span className="mx-2">·</span>
                <span>{product.rating.count} đánh giá</span>
              </div>
            )}

            <div className="mb-6">
              {product.discount > 0 ? (
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-green-700">{formatPrice(finalUnitPrice)}</span>
                  <span className="text-lg text-gray-400 line-through">{formatPrice(basePrice)}</span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-green-700">{formatPrice(basePrice)}</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-gray-700 mb-6 leading-relaxed">{product.shortDescription}</p>
            )}

            {product.ecoScore > 0 && (
              <p className="text-sm text-gray-600 mb-4">
                Điểm xanh: <strong className="text-green-700">{product.ecoScore}/5</strong>
              </p>
            )}

            {hasVariants && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phân loại</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full max-w-md py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Chọn phân loại...</option>
                  {product.variants.map((v) => (
                    <option key={v._id} value={v._id} disabled={v.stockQuantity <= 0}>
                      {[v.size, v.weight, v.volume].filter(Boolean).join(' · ') || 'Mặc định'}
                      {v.priceModifier
                        ? ` (${v.priceModifier > 0 ? '+' : ''}${formatPrice(v.priceModifier)})`
                        : ''}
                      {v.stockQuantity <= 0 ? ' — Hết hàng' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-lg"
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
                    className="w-16 text-center py-2 border-x border-gray-300"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-lg"
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, maxQty), q + 1))}
                    disabled={quantity >= maxQty}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 pt-8">
                {hasVariants && !selectedVariant ? (
                  <span>Chọn phân loại để xem tồn kho</span>
                ) : (
                  <span>
                    Còn lại: <strong>{stockAvailable ?? 0}</strong> sản phẩm
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAdd || adding || quantity > maxQty}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-lg font-semibold transition-all ${
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

        <section className="mt-16 border-t border-gray-200 pt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
          <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap">
            {product.description}
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm">
          <p>&copy; 2026 Zero-Waste Store</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;
