import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMyOrders, getMyOrderDetail, cancelMyOrder } from '../api/orderApi';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiPackage, FiTruck, FiCheck, FiX, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Status config
const STATUS_CONFIG = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: <FiClock /> },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: <FiCheck /> },
  processing: { label: 'Đang xử lý', color: 'bg-indigo-100 text-indigo-800', icon: <FiPackage /> },
  shipping: { label: 'Đang giao hàng', color: 'bg-purple-100 text-purple-800', icon: <FiTruck /> },
  delivered: { label: 'Đã giao hàng', color: 'bg-green-100 text-green-800', icon: <FiCheck /> },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: <FiX /> },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-800', icon: <FiX /> },
};

const PAYMENT_STATUS = {
  pending: { label: 'Chưa thanh toán', color: 'text-yellow-600' },
  paid: { label: 'Đã thanh toán', color: 'text-green-600' },
  failed: { label: 'Thất bại', color: 'text-red-600' },
  refunded: { label: 'Đã hoàn tiền', color: 'text-gray-600' },
};

// Status timeline steps
const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const result = await getMyOrders(params);
      if (result.success) {
        setOrders(result.data.orders);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      toast.error('Lỗi khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExpandOrder = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderDetail(null);
      return;
    }

    try {
      const result = await getMyOrderDetail(orderId);
      if (result.success) {
        setOrderDetail(result.data);
        setExpandedOrder(orderId);
      }
    } catch (error) {
      toast.error('Lỗi khi tải chi tiết đơn hàng');
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Vui lòng cho biết lý do hủy đơn:');
    if (!reason && reason !== '') return;

    try {
      setCancelLoading(orderId);
      await cancelMyOrder(orderId, reason || 'Khách hàng hủy đơn');
      toast.success('Đã hủy đơn hàng thành công');
      fetchOrders();
      setExpandedOrder(null);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi hủy đơn hàng');
    } finally {
      setCancelLoading(null);
    }
  };

  // Status timeline component
  const StatusTimeline = ({ currentStatus, statusHistory }) => {
    if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
      return (
        <div className="flex items-center space-x-2 text-red-500">
          <FiX />
          <span className="font-medium">
            {currentStatus === 'cancelled' ? 'Đơn hàng đã bị hủy' : 'Đơn hàng đã được hoàn tiền'}
          </span>
        </div>
      );
    }

    const currentIndex = STATUS_STEPS.indexOf(currentStatus);

    return (
      <div className="relative">
        <div className="flex justify-between items-center">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <div key={step} className="flex flex-col items-center flex-1">
                {/* Connector line */}
                {index < STATUS_STEPS.length - 1 && (
                  <div
                    className={`absolute h-0.5 top-4 ${
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{
                      left: `${(index + 0.5) * (100 / STATUS_STEPS.length)}%`,
                      width: `${100 / STATUS_STEPS.length}%`
                    }}
                  />
                )}
                {/* Circle */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                >
                  {isCompleted ? <FiCheck size={14} /> : index + 1}
                </div>
                {/* Label */}
                <span className={`mt-2 text-xs text-center ${
                  isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'
                }`}>
                  {STATUS_CONFIG[step]?.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'processing', label: 'Đang xử lý' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

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
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-green-600">Trang chủ</Link>
              <Link to="/cart" className="text-gray-700 hover:text-green-600">Giỏ hàng</Link>
              <Link to="/profile" className="text-gray-700 hover:text-green-600">
                {user?.username}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link to="/" className="text-green-600 hover:text-green-700 flex items-center">
            <FiArrowLeft className="mr-1" /> Trang chủ
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Đơn hàng của tôi</h1>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Không có đơn hàng nào</p>
            <Link
              to="/"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => handleExpandOrder(order._id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Order info */}
                    <div className="flex-grow">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[order.status]?.color}`}>
                          {STATUS_CONFIG[order.status]?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>📅 {formatDate(order.createdAt)}</span>
                        <span className={PAYMENT_STATUS[order.paymentStatus]?.color}>
                          💳 {PAYMENT_STATUS[order.paymentStatus]?.label}
                        </span>
                        <span>📦 {order.items?.length || 0} sản phẩm</span>
                      </div>
                    </div>

                    {/* Right: Total & Actions */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-400">{order.paymentMethod}</p>
                      </div>
                      {expandedOrder === order._id ? (
                        <FiChevronUp className="text-gray-400" />
                      ) : (
                        <FiChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="mt-3 flex -space-x-2">
                    {order.items?.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white overflow-hidden">
                        {item.productImage ? (
                          <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                            {item.productName?.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedOrder === order._id && orderDetail && (
                  <div className="border-t bg-gray-50 p-4 sm:p-6">
                    {/* Status Timeline */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Trạng thái đơn hàng</h4>
                      <StatusTimeline
                        currentStatus={orderDetail.order?.status || order.status}
                        statusHistory={orderDetail.order?.statusHistory}
                      />
                    </div>

                    {/* Order Items Detail */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Chi tiết sản phẩm</h4>
                      <div className="space-y-3">
                        {(orderDetail.order?.items || order.items)?.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.productImage ? (
                                <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200"></div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span>{formatPrice(item.finalPrice)} × {item.quantity}</span>
                                {item.discount > 0 && (
                                  <span className="ml-2 text-red-500">(-{item.discount}%)</span>
                                )}
                              </div>
                            </div>
                            <p className="font-medium text-gray-900 flex-shrink-0">
                              {formatPrice(item.subtotal)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping & Payment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Shipping */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">📍 Thông tin giao hàng</h4>
                        <p className="text-sm text-gray-700">{order.shippingAddress?.fullName}</p>
                        <p className="text-sm text-gray-500">{order.shippingAddress?.phone}</p>
                        <p className="text-sm text-gray-500">
                          {[order.shippingAddress?.address, order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.city]
                            .filter(Boolean).join(', ')}
                        </p>
                      </div>

                      {/* Price Summary */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">💰 Tổng thanh toán</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tạm tính</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Phí vận chuyển</span>
                            <span>
                              {order.shippingCost === 0 ? 'Miễn phí' : formatPrice(order.shippingCost)}
                            </span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-red-500">
                              <span>Giảm giá</span>
                              <span>-{formatPrice(order.discount)}</span>
                            </div>
                          )}
                          <hr />
                          <div className="flex justify-between font-bold text-base">
                            <span>Tổng cộng</span>
                            <span className="text-green-600">{formatPrice(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status History */}
                    {orderDetail.order?.statusHistory?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">📋 Lịch sử trạng thái</h4>
                        <div className="space-y-2">
                          {orderDetail.order.statusHistory.map((history, idx) => (
                            <div key={idx} className="flex items-start space-x-3 text-sm">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                              <div>
                                <span className="font-medium">{STATUS_CONFIG[history.status]?.label}</span>
                                {history.note && <span className="text-gray-500"> — {history.note}</span>}
                                <p className="text-xs text-gray-400">{formatDate(history.updatedAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cancel Button */}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <div className="text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order._id);
                          }}
                          disabled={cancelLoading === order._id}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {cancelLoading === order._id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => fetchOrders(page)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  page === pagination.currentPage
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2024 Zero-Waste Store. All rights reserved.</p>
            <p className="mt-2 text-gray-400 text-sm">
              Sản phẩm đồ án niên luận ngành Kỹ thuật phần mềm
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrderHistory;
