import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { getProducts } from '../api/productApi';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiStar, FiPackage } from 'react-icons/fi';
import DynamicBanner from '../components/DynamicBanner';


const Home = () => {
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();
  const { addToCart, cartItemCount } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});

  // Load sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getProducts({ limit: 12, isActive: true });
        if (result.success) {
          setProducts(result.data?.products || result.data || []);
        }
      } catch (error) {
        console.error('Fetch products error:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleVariantChange = (productId, variantId) => {
      setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
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
        toast.warning('Vui lòng chọn một phân loại sản phẩm!');
        return;
    }

    try {
      setAddingToCart(product._id);
      await addToCart(product._id, 1, selectedVariantId);
      toast.success('🛒 Đã thêm vào giỏ hàng!');
    } catch (error) {
      toast.error(error.message || 'Lỗi khi thêm vào giỏ hàng');
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src="/Zero-Waste Store.png" alt="Logo" className="h-10 w-auto object-contain" />
              <span className="ml-2 text-xl font-bold text-gray-800">Zero-Waste Store</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {loading ? (
                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-md" title="Đang tải..."></div>
              ) : isAuthenticated ? (
                <>
                  <span className="text-gray-700 hidden sm:inline">
                    Xin chào, <strong>{user?.username}</strong>
                  </span>
                  <Link to="/promotions" className="text-gray-700 hover:text-green-600 hidden sm:inline">
                    Khuyến mãi
                  </Link>
                  <Link to="/orders" className="text-gray-700 hover:text-green-600 hidden sm:inline">
                    Đơn hàng
                  </Link>
                  <Link to="/profile" className="text-gray-700 hover:text-green-600">
                    Tài khoản
                  </Link>
                  <Link to="/cart" className="text-gray-700 hover:text-green-600 relative" title="Giỏ hàng">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
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
                  <button onClick={logout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-green-600">Đăng nhập</Link>
                  <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Đăng ký</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-green-100 rounded-full p-6">
              <svg className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Chào mừng đến với
            <span className="text-green-600"> Zero-Waste Store</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Cửa hàng sản phẩm thân thiện với môi trường, giúp bạn sống xanh và bảo vệ hành tinh
          </p>
          {loading ? (
            <div className="flex justify-center space-x-4">
              <div className="h-[52px] w-[140px] bg-gray-200 animate-pulse rounded-lg shadow-sm"></div>
              <div className="h-[52px] w-[140px] bg-gray-200 animate-pulse rounded-lg shadow-sm"></div>
            </div>
          ) : !isAuthenticated && (
            <div className="flex justify-center space-x-4">
              <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-200">
                Bắt đầu ngay
              </Link>
              <Link to="/login" className="bg-white hover:bg-gray-50 text-green-600 font-semibold px-8 py-3 rounded-lg border-2 border-green-600 transition duration-200">
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </section>


      {/* Dynamic Banner */}
      <section>
         <div>
           <DynamicBanner/>
         </div>
      </section>

      {/* Mid Banner */}
      <section>
        <div className='flex flex-col sm:flex-row border border-gray-400 '>
          {/* Hero left side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0 '>
            <div className='text-[#414141]'>
                <div className='flex items-center gap-2'>
                    <p className='w-8 md:w-11 h-[2px] bg-[#414141] '></p>
                    <p className='font-medium text-sm md:text-base '>OUR BESTSELLERS</p>
                </div>
                <h1 className='text-3xl sm:py-3 lg:text-5xl leading-relaxed '>Latest Arrivals</h1>
                <div className='flex items-center gap-2'>
                     <p className='font-semibold text-sm md:text-base'>SHOP NN</p>
                     <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
                </div>
            </div>
        </div>
          {/* Hero right side */}
        <img className='w-full sm:w-1/2' src="https://joyfood.com.vn/upload/filemanager/files/zero-waste-la-gi%20(1).jpeg" alt="" />
    </div>
      </section>
      
      {/* Bottom Banner */}
        <section className="relative w-full h-[500 md:h-[600px] overflow-hidden bg-gray-900">
  
      <div className="absolute inset-0">
        <img
          src="https://shopequo.com/cdn/shop/articles/Zero-Waste.png?v=1701594321&width=1600"
          alt="New Collection"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-start text-white">

        <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold tracking-widest uppercase bg-indigo-600 rounded-full animate-fade-in">
          New Season Arrival
        </span>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-2xl">
          Define Your <span className="text-indigo-400"> Zero Waste</span> life .
        </h1>

        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed">
          “Không Rác Thải” Vai Trò, Nguyên Tắc Thực Hành Không Lãng Phí <span className="text-white font-bold text-2xl">bảo vệ nguồn tài nguyên, giảm ô nhiễm môi trường</span> .
        </p>
        <Link to="/productlist" >
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
            Shop Collection
          </button>
          
        </div>
        </Link>
        <div className="mt-12 flex gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold">✓</span> Free Shipping
          </div>
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold">✓</span> 30-Day Returns
          </div>
        </div>
      </div>
    </section>
       


      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🌿 Sản phẩm nổi bật</h2>
          <p className="text-gray-600">Khám phá các sản phẩm xanh, thân thiện với môi trường</p>
        </div>

        {loadingProducts ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
              const hasVariants = product.variants && product.variants.length > 0;
              const selectedVariantId = selectedVariants[product._id];
              const selectedVariant = hasVariants ? product.variants.find(v => v._id === selectedVariantId) : null;
              
              let displayPrice = product.price;
              if (selectedVariant) {
                  displayPrice = product.price + (selectedVariant.priceModifier || 0);
              }
              const finalPrice = displayPrice - (displayPrice * (product.discount || 0) / 100);
              const displayStock = selectedVariant ? selectedVariant.stockQuantity : product.stock;
              const isStockAvailable = hasVariants ? (selectedVariant ? displayStock > 0 : true) : product.inStock;

              return (
                <div key={product._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
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

                    {/* Discount badge */}
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
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[40px]">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating?.count > 0 && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <FiStar className="text-yellow-400 fill-current mr-1" size={12} />
                        <span>{product.rating.average.toFixed(1)}</span>
                        <span className="mx-1">·</span>
                        <span>{product.rating.count} đánh giá</span>
                      </div>
                    )}

                    {/* Price */}
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
                        {isStockAvailable && (!hasVariants || selectedVariant) ? `Còn ${displayStock} sản phẩm` : (!isStockAvailable ? 'Hết hàng' : '')}
                      </span>
                      {product.sold > 0 && (
                        <span className="text-xs text-gray-400">Đã bán {product.sold}</span>
                      )}
                    </div>

                    {/* Variant Selector */}
                    {hasVariants && (
                        <div className="mb-3">
                            <select 
                                className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                value={selectedVariantId || ''}
                                onChange={(e) => handleVariantChange(product._id, e.target.value)}
                            >
                                <option value="">Chọn phân loại...</option>
                                {product.variants.map(v => (
                                    <option key={v._id} value={v._id} disabled={v.stockQuantity <= 0}>
                                        {v.size && `Size: ${v.size} `}{v.weight && `${v.weight} `}{v.volume && `${v.volume} `} 
                                        {v.priceModifier > 0 ? `(+${formatPrice(v.priceModifier)})` : v.priceModifier < 0 ? `(${formatPrice(v.priceModifier)})` : ''}
                                        {v.stockQuantity <= 0 ? ' - Hết' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={!isStockAvailable || addingToCart === product._id || (hasVariants && !selectedVariantId)}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 ${
                        isStockAvailable && (!hasVariants || selectedVariantId)
                          ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {addingToCart === product._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FiShoppingCart className="mr-2" size={16} />
                          {isStockAvailable ? (hasVariants && !selectedVariantId ? 'Chọn phân loại' : 'Thêm vào giỏ') : 'Hết hàng'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Sản phẩm xanh</h3>
            <p className="text-gray-600">100% sản phẩm thân thiện môi trường, có chứng nhận bền vững</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Chatbot AI</h3>
            <p className="text-gray-600">Trợ lý AI tư vấn lối sống xanh và gợi ý sản phẩm phù hợp</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Tích điểm xanh</h3>
            <p className="text-gray-600">Nhận điểm thưởng khi mua sắm và đổi quà hấp dẫn</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2026 Zero-Waste Store. All rights reserved.</p>
            <p className="mt-2 text-gray-400 text-sm">
              Sản phẩm đồ án niên luận ngành Kỹ thuật phần mềm
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;