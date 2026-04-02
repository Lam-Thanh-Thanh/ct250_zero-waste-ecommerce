import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { getProducts } from '../api/productApi';
import { getAllCategories } from '../api/categoryApi';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiStar, FiPackage, FiSearch, FiFilter } from 'react-icons/fi';

const LIMIT = 12;

const ProductList = () => {
  const { user, isAuthenticated, isAdmin, logout, loading: authLoading } = useAuth();
  const { addToCart, cartItemCount } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  const [addingToCart, setAddingToCart] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getAllCategories();
        if (res.success) setCategories(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: LIMIT,
        isActive: true,
        sortBy: 'createdAt',
        order: 'desc',
      };
      if (search.trim()) params.search = search.trim();
      if (categoryId) params.category = categoryId;
      if (minPrice !== '' && !Number.isNaN(Number(minPrice))) params.minPrice = Number(minPrice);
      if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) params.maxPrice = Number(maxPrice);

      const result = await getProducts(params);
      if (result.success && result.data) {
        setProducts(result.data.products || []);
        setPagination(result.data.pagination || null);
      } else {
        setProducts([]);
        setPagination(null);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Không tải được danh sách sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  const applyPricePreset = (min, max) => {
    setMinPrice(min === '' ? '' : String(min));
    setMaxPrice(max === '' ? '' : String(max));
    setPage(1);
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }

    const hasVariants = product.variants && product.variants.length > 0;
    const selectedVariantId = selectedVariants[product._id];

    if (hasVariants && !selectedVariantId) {
      toast.warning('Vui lòng chọn phân loại sản phẩm');
      return;
    }

    try {
      setAddingToCart(product._id);
      await addToCart(product._id, 1, selectedVariantId || null);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error) {
      toast.error(error.message || 'Lỗi khi thêm vào giỏ hàng');
    } finally {
      setAddingToCart(null);
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

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
                  <Link to="/" className="text-gray-700 hover:text-green-600 hidden sm:inline">
                    Trang chủ
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
                  <Link to="/" className="text-gray-700 hover:text-green-600">
                    Trang chủ
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bộ sưu tập sản phẩm</h1>
        <p className="text-gray-600 mb-8">Tìm kiếm và lọc theo danh mục hoặc khoảng giá</p>

        {/* Bảng / khối lọc */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 text-gray-800 font-semibold mb-4">
            <FiFilter className="text-green-600" />
            Bộ lọc
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tên sản phẩm..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá từ (đ)</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="0"
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
    <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến (đ)</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Không giới hạn"
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Khoảng giá nhanh:</span>
            <button
              type="button"
              onClick={() => applyPricePreset('', 100000)}
              className="text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-800 hover:bg-green-100 border border-green-200"
            >
              Dưới 100.000đ
            </button>
            <button
              type="button"
              onClick={() => applyPricePreset(100000, 500000)}
              className="text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-800 hover:bg-green-100 border border-green-200"
            >
              100k – 500k
            </button>
            <button
              type="button"
              onClick={() => applyPricePreset(500000, '')}
              className="text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-800 hover:bg-green-100 border border-green-200"
            >
              Trên 500.000đ
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm ml-auto text-gray-600 underline hover:text-gray-900"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
            <p className="mt-4 text-gray-500">Đang tải...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Không có sản phẩm phù hợp</p>
          </div>
        ) : (
          <>
            {/* Lưới card: giống style trang Home */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];
                const hasVariants = product.variants && product.variants.length > 0;
                const selectedVariantId = selectedVariants[product._id];
                const selectedVariant = hasVariants
                  ? product.variants.find((v) => String(v._id) === String(selectedVariantId))
                  : null;

                let displayPrice = product.price;
                if (selectedVariant) displayPrice = product.price + (selectedVariant.priceModifier || 0);
                const finalPrice = displayPrice - (displayPrice * (product.discount || 0)) / 100;
                const displayStock = selectedVariant ? selectedVariant.stockQuantity : product.stock;
                const isStockAvailable = hasVariants
                  ? selectedVariant
                    ? displayStock > 0
                    : true
                  : product.inStock;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    {/* Product Image */}
                    <Link to={`/product/${product._id}`} className="block relative h-48 bg-gray-100 overflow-hidden">
                      {mainImage ? (
                        <img
                          src={mainImage.url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiPackage size={48} />
                        </div>
                      )}

                      {product.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{product.discount}%
                        </span>
                      )}

                      {/* Eco score */}
                      {product.ecoScore > 0 && (
                        <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          🌱 {product.ecoScore}/5
                        </span>
                      )}
                    </Link>

                    <div className="p-4">
                      <Link to={`/product/${product._id}`}>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[40px] hover:text-green-700">
                          {product.name}
                        </h3>
                      </Link>

                      {product.rating?.count > 0 && (
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <FiStar className="text-yellow-400 fill-current mr-1" size={12} />
                          <span>{product.rating.average.toFixed(1)}</span>
                        </div>
                      )}

                      <div className="mb-3">
                        {product.discount > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-green-600">{formatPrice(finalPrice)}</span>
                            <span className="text-sm text-gray-400 line-through">{formatPrice(displayPrice)}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-green-600">{formatPrice(displayPrice)}</span>
                        )}
                      </div>

                      {/* Stock info */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs ${isStockAvailable ? 'text-green-600' : 'text-red-500'}`}>
                          {isStockAvailable && (!hasVariants || selectedVariant)
                            ? `Còn ${displayStock} sản phẩm`
                            : !isStockAvailable
                              ? 'Hết hàng'
                              : ''}
                        </span>
                        {product.sold > 0 && <span className="text-xs text-gray-400">Đã bán {product.sold}</span>}
                      </div>

                      {hasVariants && (
                        <div className="mb-3">
                          <select
                            className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            value={selectedVariantId || ''}
                            onChange={(e) => handleVariantChange(product._id, e.target.value)}
                          >
                            <option value="">Chọn phân loại...</option>
                            {product.variants.map((v) => (
                              <option key={v._id} value={v._id} disabled={v.stockQuantity <= 0}>
                                {v.size && `Size: ${v.size} `}
                                {v.weight && `${v.weight} `}
                                {v.volume && `${v.volume} `}
                                {v.priceModifier > 0
                                  ? `(+${formatPrice(v.priceModifier)})`
                                  : v.priceModifier < 0
                                    ? `(${formatPrice(v.priceModifier)})`
                                    : ''}
                                {v.stockQuantity <= 0 ? ' - Hết' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link
                          to={`/product/${product._id}`}
                          className="flex-1 min-w-[92px] text-center py-2 text-sm border border-green-600 text-green-700 rounded-lg hover:bg-green-50 whitespace-nowrap"
                        >
                          Chi tiết
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={
                            !isStockAvailable || addingToCart === product._id || (hasVariants && !selectedVariantId)
                          }
                          className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium flex items-center justify-center ${
                            isStockAvailable && (!hasVariants || selectedVariantId)
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {addingToCart === product._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <>
                              <FiShoppingCart className="mr-1" size={14} />
                              {isStockAvailable ? (hasVariants && !selectedVariantId ? 'Chọn phân loại' : 'Thêm vào giỏ') : 'Hết hàng'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm">
          <p>&copy; 2026 Zero-Waste Store</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductList;
