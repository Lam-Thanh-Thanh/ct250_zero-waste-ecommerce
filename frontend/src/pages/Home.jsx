import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { getProducts } from '../api/productApi';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiStar, FiPackage } from 'react-icons/fi';
import DynamicBanner from '../components/DynamicBanner';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';


const Home = () => {
  const { isAuthenticated, loading } = useAuth();
  const { addToCart } = useCart();
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
      {/* Shared Header */}
      <Header />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-green-100 rounded-full p-4 sm:p-6">
              <svg className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Chào mừng đến với
            <span className="text-green-600"> Zero-Waste Store</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4">
            Cửa hàng sản phẩm thân thiện với môi trường, giúp bạn sống xanh và bảo vệ hành tinh
          </p>
          {loading ? (
            <div className="flex justify-center space-x-4">
              <div className="h-[52px] w-[140px] bg-gray-200 animate-pulse rounded-lg shadow-sm"></div>
              <div className="h-[52px] w-[140px] bg-gray-200 animate-pulse rounded-lg shadow-sm"></div>
            </div>
          ) : !isAuthenticated && (
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
              <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-200 text-center">
                Bắt đầu ngay
              </Link>
              <Link to="/login" className="bg-white hover:bg-gray-50 text-green-600 font-semibold px-8 py-3 rounded-lg border-2 border-green-600 transition duration-200 text-center">
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
        <div className='flex flex-col sm:flex-row border border-gray-400'>
          {/* Hero left side */}
          <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
            <div className='text-[#414141]'>
                <div className='flex items-center gap-2'>
                    <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                    <p className='font-medium text-sm md:text-base'>OUR BESTSELLERS</p>
                </div>
                <h1 className='text-3xl sm:py-3 lg:text-5xl leading-relaxed'>Latest Arrivals</h1>
                <div className='flex items-center gap-2'>
                     <p className='font-semibold text-sm md:text-base'>SHOP NOW</p>
                     <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
                </div>
            </div>
          </div>
          {/* Hero right side */}
          <img className='w-full sm:w-1/2' src="https://joyfood.com.vn/upload/filemanager/files/zero-waste-la-gi%20(1).jpeg" alt="" />
        </div>
      </section>
      
      {/* Bottom Banner */}
      <section className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://shopequo.com/cdn/shop/articles/Zero-Waste.png?v=1701594321&width=1600"
            alt="New Collection"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center items-start text-white">
          <span className="inline-block px-3 sm:px-4 py-1 mb-3 sm:mb-4 text-xs sm:text-sm font-semibold tracking-widest uppercase bg-indigo-600 rounded-full animate-fade-in">
            New Season Arrival
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold mb-4 sm:mb-6 leading-tight max-w-2xl">
            Define Your <span className="text-indigo-400"> Zero Waste</span> life .
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-10 max-w-lg leading-relaxed">
            "Không Rác Thải" Vai Trò, Nguyên Tắc Thực Hành Không Lãng Phí <span className="text-white font-bold text-lg sm:text-2xl">bảo vệ nguồn tài nguyên, giảm ô nhiễm môi trường</span> .
          </p>
          <Link to="/productlist">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg text-sm sm:text-base">
                Shop Collection
              </button>
            </div>
          </Link>
          <div className="mt-8 sm:mt-12 flex flex-wrap gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">🌿 Sản phẩm nổi bật</h2>
          <p className="text-gray-600 text-sm sm:text-base">Khám phá các sản phẩm xanh, thân thiện với môi trường</p>
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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
                    <Link to={`/product/${product._id}`} className="block relative h-36 sm:h-48 bg-gray-100 overflow-hidden">
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
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          -{product.discount}%
                        </span>
                      )}

                      {/* Eco score */}
                      {product.ecoScore > 0 && (
                        <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center">
                          🌱 {product.ecoScore}/5
                        </span>
                      )}
                    </Link>

                    {/* Product Info */}
                    <div className="p-3 sm:p-4">
                      <Link to={`/product/${product._id}`}>
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2 min-h-[32px] sm:min-h-[40px] hover:text-green-700 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Rating */}
                      {product.rating?.count > 0 && (
                        <div className="flex items-center text-xs text-gray-500 mb-1 sm:mb-2">
                          <FiStar className="text-yellow-400 fill-current mr-1" size={12} />
                          <span>{product.rating.average.toFixed(1)}</span>
                          <span className="mx-1">·</span>
                          <span>{product.rating.count} đánh giá</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="mb-2 sm:mb-3">
                        {product.discount > 0 ? (
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <span className="text-sm sm:text-lg font-bold text-green-600">{formatPrice(finalPrice)}</span>
                            <span className="text-xs sm:text-sm text-gray-400 line-through">{formatPrice(displayPrice)}</span>
                          </div>
                        ) : (
                          <span className="text-sm sm:text-lg font-bold text-green-600">{formatPrice(displayPrice)}</span>
                        )}
                      </div>

                      {/* Stock info */}
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className={`text-[10px] sm:text-xs ${isStockAvailable ? 'text-green-600' : 'text-red-500'}`}>
                          {isStockAvailable && (!hasVariants || selectedVariant) ? `Còn ${displayStock} sản phẩm` : (!isStockAvailable ? 'Hết hàng' : '')}
                        </span>
                        {product.sold > 0 && (
                          <span className="text-[10px] sm:text-xs text-gray-400">Đã bán {product.sold}</span>
                        )}
                      </div>

                      {/* Variant Selector */}
                      {hasVariants && (
                          <div className="mb-2 sm:mb-3">
                              <select 
                                  className="w-full text-[10px] sm:text-xs p-1 sm:p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                  value={selectedVariantId || ''}
                                  onChange={(e) => handleVariantChange(product._id, e.target.value)}
                              >
                                  <option value="">Chọn phân loại...</option>
                                  {product.variants.map(v => (
                                      <option key={v._id} value={v._id} disabled={v.stockQuantity <= 0}>
                                          {v.size && `Size: ${v.size} `}{v.weight ? `${v.weight}g ` : ''}{v.volume && `${v.volume} `} 
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
                        className={`w-full py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center transition-all duration-200 ${
                          isStockAvailable && (!hasVariants || selectedVariantId)
                            ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {addingToCart === product._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <FiShoppingCart className="mr-1 sm:mr-2" size={14} />
                            <span className="hidden sm:inline">{isStockAvailable ? (hasVariants && !selectedVariantId ? 'Chọn phân loại' : 'Thêm vào giỏ') : 'Hết hàng'}</span>
                            <span className="sm:hidden">{isStockAvailable ? (hasVariants && !selectedVariantId ? 'Chọn' : 'Thêm') : 'Hết'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Products */}
            <div className="text-center mt-8 sm:mt-10">
              <Link
                to="/productlist"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-600 text-green-700 font-semibold rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200"
              >
                Xem tất cả sản phẩm
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md text-center sm:text-left">
            <div className="text-green-600 mb-3 sm:mb-4 flex justify-center sm:justify-start">
              <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Sản phẩm xanh</h3>
            <p className="text-gray-600 text-sm sm:text-base">100% sản phẩm thân thiện môi trường, có chứng nhận bền vững</p>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md text-center sm:text-left">
            <div className="text-green-600 mb-3 sm:mb-4 flex justify-center sm:justify-start">
              <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Chatbot AI</h3>
            <p className="text-gray-600 text-sm sm:text-base">Trợ lý AI tư vấn lối sống xanh và gợi ý sản phẩm phù hợp</p>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md text-center sm:text-left">
            <div className="text-green-600 mb-3 sm:mb-4 flex justify-center sm:justify-start">
              <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Tích điểm xanh</h3>
            <p className="text-gray-600 text-sm sm:text-base">Nhận điểm thưởng khi mua sắm và đổi quà hấp dẫn</p>
          </div>
        </div>
      </section>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
};

export default Home;