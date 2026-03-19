import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';

const Cart = () => {
  const { user } = useAuth();
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (productId, productName) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${productName}" khỏi giỏ hàng?`)) {
      try {
        await removeItem(productId);
        toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
      } catch (error) {
        toast.error(error.message || 'Lỗi khi xóa sản phẩm');
      }
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      try {
        await clearCart();
        toast.success('Đã xóa toàn bộ giỏ hàng');
      } catch (error) {
        toast.error(error.message || 'Lỗi khi xóa giỏ hàng');
      }
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Tính phí vận chuyển dự kiến
  const estimatedShipping = cart.subtotal >= 500000 ? 0 : 30000;
  const estimatedTotal = cart.subtotal + estimatedShipping;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center">
              <img src="/Zero-Waste Store.png" alt="Logo" className="h-10 w-auto object-contain" />
              <span className="ml-2 text-xl font-bold text-gray-800">Zero-Waste Store</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-green-600">Trang chủ</Link>
              <Link to="/orders" className="text-gray-700 hover:text-green-600">Đơn hàng</Link>
              <Link to="/profile" className="text-gray-700 hover:text-green-600">
                Xin chào, <strong>{user?.username}</strong>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Cart Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link to="/" className="text-green-600 hover:text-green-700 flex items-center">
            <FiArrowLeft className="mr-1" /> Tiếp tục mua sắm
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Giỏ hàng {cart.totalItems > 0 && <span className="text-lg text-gray-500 font-normal">({cart.totalItems} sản phẩm)</span>}
        </h1>

        {loading && cart.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải giỏ hàng...</p>
          </div>
        ) : cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FiShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Giỏ hàng của bạn đang trống</p>
            <Link
              to="/"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          /* Cart with items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
                  <span className="font-medium text-gray-700">Sản phẩm</span>
                  <button
                    onClick={handleClearCart}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center"
                  >
                    <FiTrash2 className="mr-1" /> Xóa tất cả
                  </button>
                </div>

                {/* Items List */}
                <div className="divide-y">
                  {cart.items.map((item) => (
                    <div key={item._id} className="p-6 flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FiShoppingBag size={32} />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h3>

                        {/* Price */}
                        <div className="mt-1">
                          {item.product.discount > 0 ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 font-semibold">
                                {formatPrice(item.product.finalPrice)}
                              </span>
                              <span className="text-gray-400 line-through text-sm">
                                {formatPrice(item.product.price)}
                              </span>
                              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                                -{item.product.discount}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-green-600 font-semibold">
                              {formatPrice(item.product.price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="mt-3 flex items-center space-x-4">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || loading}
                              className="px-3 py-1 text-gray-600 hover:text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition"
                            >
                              <FiMinus size={14} />
                            </button>
                            <span className="px-4 py-1 text-center min-w-[40px] font-medium border-x border-gray-300">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock || loading}
                              className="px-3 py-1 text-gray-600 hover:text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition"
                            >
                              <FiPlus size={14} />
                            </button>
                          </div>

                          {item.product.stock <= 5 && (
                            <span className="text-orange-500 text-xs">
                              Còn {item.product.stock} sản phẩm
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subtotal & Remove */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.subtotal)}
                        </p>
                        <button
                          onClick={() => handleRemoveItem(item.product._id, item.product.name)}
                          className="mt-2 text-red-400 hover:text-red-600 transition"
                          title="Xóa"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tổng đơn hàng</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính ({cart.totalItems} sản phẩm)</span>
                    <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển (dự kiến)</span>
                    <span className="font-medium">
                      {estimatedShipping === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatPrice(estimatedShipping)
                      )}
                    </span>
                  </div>
                  {estimatedShipping > 0 && (
                    <p className="text-xs text-green-600">
                      🎉 Mua thêm {formatPrice(500000 - cart.subtotal)} để được miễn phí vận chuyển!
                    </p>
                  )}
                  <hr className="my-3" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-green-600">{formatPrice(estimatedTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                >
                  Tiến hành đặt hàng
                </button>

                <div className="mt-4 text-center">
                  <Link to="/" className="text-sm text-green-600 hover:text-green-700">
                    ← Tiếp tục mua sắm
                  </Link>
                </div>

                {/* Benefits */}
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🚚</span> Miễn phí ship đơn từ 500.000đ
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🌱</span> Tích điểm xanh mỗi đơn hàng
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📦</span> Bao bì thân thiện môi trường
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
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

export default Cart;
