import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { createOrder } from '../api/orderApi';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiCreditCard, FiTruck, FiShield } from 'react-icons/fi';

const Checkout = () => {
  const { user } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.username || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: '',
    district: '',
    ward: '',
    note: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [customerNote, setCustomerNote] = useState('');

  // Redirect nếu giỏ hàng trống
  useEffect(() => {
    if (!cartLoading && (!cart.items || cart.items.length === 0) && !orderSuccess) {
      navigate('/cart');
    }
  }, [cart, cartLoading, navigate, orderSuccess]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleInputChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  // Tính phí vận chuyển
  const calculateShipping = () => {
    if (cart.subtotal >= 500000) return 0;
    const city = shippingAddress.city.toLowerCase();
    if (city.includes('hồ chí minh') || city.includes('hcm') || city.includes('tp.hcm')) return 25000;
    if (city.includes('hà nội') || city.includes('đà nẵng')) return 30000;
    return 35000;
  };

  const shippingCost = calculateShipping();
  const totalAmount = cart.subtotal + shippingCost;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    if (!/^[0-9]{10,11}$/.test(shippingAddress.phone)) {
      toast.error('Số điện thoại không hợp lệ (10-11 số)');
      return;
    }

    try {
      setLoading(true);
      const result = await createOrder({
        shippingAddress,
        paymentMethod,
        customerNote
      });

      if (result.success) {
        setOrderSuccess(result.data);
        refreshCart();
        toast.success('🎉 Đặt hàng thành công!');
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi khi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  // Payment methods config
  const paymentMethods = [
    { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵', description: 'Thanh toán bằng tiền mặt khi nhận hàng' },
    { value: 'Banking', label: 'Chuyển khoản ngân hàng', icon: '🏦', description: 'Chuyển khoản qua tài khoản ngân hàng' },
    { value: 'Momo', label: 'Ví MoMo', icon: '📱', description: 'Thanh toán qua ví điện tử MoMo' },
    { value: 'ZaloPay', label: 'ZaloPay', icon: '💳', description: 'Thanh toán qua ví ZaloPay' },
    { value: 'VNPay', label: 'VNPay', icon: '🔒', description: 'Thanh toán qua cổng VNPay' }
  ];

  // ===== Success Screen =====
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được ghi nhận và đang được xử lý.
          </p>

          <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">Mã đơn hàng:</p>
            <p className="text-lg font-bold text-green-600">
              {orderSuccess.order?.orderNumber || 'Đang xử lý...'}
            </p>
            <p className="text-sm text-gray-600 mt-2">Tổng tiền:</p>
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(orderSuccess.order?.totalAmount || 0)}
            </p>
            <p className="text-sm text-gray-600 mt-2">Phương thức thanh toán:</p>
            <p className="text-sm font-medium text-gray-800">
              {paymentMethods.find(m => m.value === (orderSuccess.order?.paymentMethod || 'COD'))?.label}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/orders"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Xem đơn hàng
            </Link>
            <Link
              to="/"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== Checkout Form =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-800">Zero-Waste Store</span>
            </Link>
            <div className="flex items-center space-x-4">
              <FiShield className="text-green-600" />
              <span className="text-sm text-gray-600">Thanh toán an toàn</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link to="/cart" className="text-green-600 hover:text-green-700 flex items-center">
            <FiArrowLeft className="mr-1" /> Quay lại giỏ hàng
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiTruck className="mr-2 text-green-600" />
                  Thông tin giao hàng
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="0912345678"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="Số nhà, tên đường..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="TP. Hồ Chí Minh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                    <input
                      type="text"
                      value={shippingAddress.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="Quận 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                    <input
                      type="text"
                      value={shippingAddress.ward}
                      onChange={(e) => handleInputChange('ward', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="Phường Bến Nghé"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú giao hàng</label>
                    <input
                      type="text"
                      value={shippingAddress.note}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="Giao giờ hành chính, gọi trước khi giao..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiCreditCard className="mr-2 text-green-600" />
                  Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === method.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-2xl mr-3">{method.icon}</span>
                      <div className="flex-grow">
                        <p className="font-medium text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      {paymentMethod === method.value && (
                        <FiCheck className="text-green-600 flex-shrink-0" size={20} />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Customer Note */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú đơn hàng (tùy chọn)
                </label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                  placeholder="Ghi chú thêm cho đơn hàng..."
                />
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Đơn hàng của bạn</h2>

                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item._id} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                <hr className="my-4" />

                {/* Pricing */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-green-600">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    `Đặt hàng — ${formatPrice(totalAmount)}`
                  )}
                </button>

                {/* Trust badges */}
                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>🔒 Thông tin được mã hóa và bảo mật</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
