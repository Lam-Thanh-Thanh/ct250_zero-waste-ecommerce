import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMyOrders, getMyOrderDetail, cancelMyOrder, requestReturn } from '../api/orderApi';
import { retryVNPayPayment } from '../api/vnpayApi';
import { retryMoMoPayment } from '../api/momoApi';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiPackage, FiTruck, FiCheck, FiX, FiClock, FiChevronDown, FiChevronUp, FiCreditCard, FiRefreshCw, FiStar } from 'react-icons/fi';

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
  const [retryLoading, setRetryLoading] = useState(null);

  // Return Request Modal State
  const [returnModalState, setReturnModalState] = useState({
    isOpen: false,
    order: null,
    items: [], // [{ product, variant, quantity, reason, selected }]
    overallReason: ''
  });

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

  // Xử lý thanh toán lại VNPay
  const handleRetryPayment = async (orderId, paymentMethod) => {
    try {
      setRetryLoading(orderId);
      let result;
      if (paymentMethod === 'Momo') {
        result = await retryMoMoPayment({ orderId });
        if (result.success && result.data.paymentUrl) {
          toast.info('Đang chuyển hướng đến cổng thanh toán MoMo...');
          window.location.href = result.data.paymentUrl;
        } else {
          toast.error('Không thể tạo link thanh toán MoMo');
        }
      } else {
        result = await retryVNPayPayment({ orderId });
        if (result.success && result.data.paymentUrl) {
          toast.info('Đang chuyển hướng đến cổng thanh toán VNPay...');
          window.location.href = result.data.paymentUrl;
        } else {
          toast.error('Không thể tạo link thanh toán');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi khi tạo thanh toán lại');
    } finally {
      setRetryLoading(null);
    }
  };

  // Mở Modal Trả Hàng
  const handleOpenReturnModal = (orderId) => {
    // Nếu chưa load detail thì load
    if (expandedOrder !== orderId || !orderDetail) {
      toast.info('Vui lòng mở rộng xem chi tiết đơn hàng trước khi yêu cầu trả hàng.');
      handleExpandOrder(orderId);
      return;
    }

    const order = orderDetail.order;
    
    // Tự động map items sang state form của modal
    const itemsState = order.items.map(item => ({
      product: item.product,
      productName: item.productName,
      productImage: item.productImage,
      variant: item.variant || null,
      maxQuantity: item.quantity,
      quantity: 1, // Mặc định trả 1
      reason: '',
      selected: false
    }));

    setReturnModalState({
      isOpen: true,
      order: order,
      items: itemsState,
      overallReason: ''
    });
  };

  // Đóng Modal Trả hàng
  const handleCloseReturnModal = () => {
    setReturnModalState({
      isOpen: false,
      order: null,
      items: [],
      overallReason: ''
    });
  };

  // Submit Yêu cầu trả hàng từ Modal con
  const handleSubmitReturnWrapper = async (localItems, localOverallReason) => {
    const { order } = returnModalState;
    const selectedItems = localItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để trả lại');
      return;
    }

    const hasInvalidItem = selectedItems.some(item => !item.reason || !item.reason.trim());
    if (hasInvalidItem) {
      toast.error('Vui lòng nhập lý do cho tất cả sản phẩm đã chọn');
      return;
    }

    try {
      setCancelLoading(order._id);
      
      const payload = {
        items: selectedItems.map(item => ({
          product: item.product,
          productName: item.productName,
          productImage: item.productImage,
          variant: item.variant,
          quantity: item.quantity,
          reason: item.reason
        })),
        overallReason: localOverallReason
      };

      await requestReturn(order._id, payload);
      toast.success('Đã gửi yêu cầu trả hàng thành công!');
      fetchOrders();
      setExpandedOrder(null);
      handleCloseReturnModal();
    } catch (error) {
      toast.error(error.message || 'Lỗi khi gửi yêu cầu trả hàng');
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
              <img src="/Zero-Waste Store.png" alt="Logo" className="h-10 w-auto object-contain" />
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
                              {(item.variantSize || item.variantWeight || item.variantVolume) && (
                                <p className="text-xs text-gray-500 mb-1">
                                  Phân loại: {[item.variantSize && `Size: ${item.variantSize}`, item.variantWeight, item.variantVolume].filter(Boolean).join(' - ')}
                                </p>
                              )}
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

                    {/* Action Buttons */}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <div className="flex items-center justify-end gap-3">
                        {/* Nút Thanh toán lại: hiển thị khi VNPay/MoMo + chưa thanh toán/thất bại */}
                        {['VNPay', 'Momo'].includes(order.paymentMethod) && 
                         ['pending', 'failed'].includes(order.paymentStatus) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryPayment(order._id, order.paymentMethod);
                            }}
                            disabled={retryLoading === order._id}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <FiCreditCard />
                            {retryLoading === order._id ? 'Đang xử lý...' : `Thanh toán lại (${order.paymentMethod})`}
                          </button>
                        )}

                        {/* Nút Hủy đơn */}
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

                    {/* Action Buttons cho đơn đã giao */}
                    {order.status === 'delivered' && (
                      <div className="space-y-3">
                        {/* Return Request Status */}
                        {order.returnRequest && order.returnRequest.status !== 'none' && (
                          <div className={`p-3 rounded-lg text-sm ${
                            order.returnRequest.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                            order.returnRequest.status === 'approved' ? 'bg-green-50 border border-green-200' :
                            'bg-red-50 border border-red-200'
                          }`}>
                            <div className="flex items-center gap-2 font-medium">
                              <FiRefreshCw size={14} />
                              <span>
                                {order.returnRequest.status === 'pending' && '⏳ Yêu cầu trả hàng đang chờ xử lý'}
                                {order.returnRequest.status === 'approved' && '✅ Yêu cầu trả hàng đã được chấp nhận'}
                                {order.returnRequest.status === 'rejected' && '❌ Yêu cầu trả hàng bị từ chối'}
                              </span>
                            </div>
                            <div className="mt-2 text-gray-700">
                              <p className="font-medium mb-1">Chi tiết yêu cầu:</p>
                              {order.returnRequest.items && order.returnRequest.items.length > 0 && (
                                <ul className="list-disc list-inside ml-1 text-xs text-gray-600 mb-2">
                                  {order.returnRequest.items.map((rtnItem, idx) => (
                                    <li key={idx}>Trẩ <strong>{rtnItem.quantity}</strong> sản phẩm - Lý do: {rtnItem.reason}</li>
                                  ))}
                                </ul>
                              )}
                              {order.returnRequest.overallReason && (
                                <p className="text-xs text-gray-600"><strong>Ghi chú thêm:</strong> {order.returnRequest.overallReason}</p>
                              )}
                            </div>
                            {order.returnRequest.adminNote && (
                              <p className="text-gray-600 mt-2 bg-white bg-opacity-50 p-2 rounded text-xs border border-gray-100">
                                <b className="text-red-500">Phản hồi từ shop:</b> {order.returnRequest.adminNote}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3">
                          {/* Nút Đánh giá sản phẩm */}
                          <Link
                            to="/reviews"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FiStar /> Đánh giá sản phẩm
                          </Link>

                          {/* Nút Yêu cầu trả hàng (chỉ hiện khi chưa có yêu cầu) */}
                          {(!order.returnRequest || order.returnRequest.status === 'none') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReturnModal(order._id);
                              }}
                              disabled={cancelLoading === order._id}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                            >
                              <FiRefreshCw />
                              {cancelLoading === order._id ? 'Đang mở...' : 'Yêu cầu trả hàng'}
                            </button>
                          )}
                        </div>
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

        {/* Return Request Modal */}
        {returnModalState.isOpen && (
          <ReturnOrderModalComponent 
            initialState={returnModalState} 
            onClose={handleCloseReturnModal} 
            onSubmit={handleSubmitReturnWrapper}
            isSubmitting={cancelLoading}
          />
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

export default OrderHistory;

/** 
 * Separate components to prevent re-rendering the whole OrderHistory
 * when user types into inner textboxes.
 */
const ReturnOrderModalComponent = ({ initialState, onClose, onSubmit, isSubmitting }) => {
  const [items, setItems] = useState(initialState.items || []);
  const [overallReason, setOverallReason] = useState(initialState.overallReason || '');

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiRefreshCw className="text-orange-500" /> Chọn sản phẩm đổi trả
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto bg-gray-50">
          <p className="text-sm text-gray-600 mb-4">Vui lòng chọn các sản phẩm bạn muốn đổi trả và điền lý do chi tiết cho từng sản phẩm.</p>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className={`bg-white rounded-xl border-2 transition-all p-4 ${item.selected ? 'border-orange-500 shadow-md' : 'border-gray-200'}`}>
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <div className="pt-2">
                    <input 
                      type="checkbox" 
                      checked={item.selected}
                      onChange={(e) => handleItemChange(index, 'selected', e.target.checked)}
                      className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                    />
                  </div>
                  
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.productImage ? (
                      <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200"></div>
                    )}
                  </div>

                  {/* Details & Form */}
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-2">{item.productName}</p>
                    <p className="text-sm text-gray-500 mb-2">Số lượng mua: {item.maxQuantity}</p>
                    
                    {item.selected && (
                      <div className="mt-3 space-y-3 p-3 bg-orange-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng trả lại</label>
                          <select 
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            className="w-full sm:w-32 border border-gray-300 rounded-md p-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none"
                          >
                            {Array.from({ length: item.maxQuantity }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Lý do trả lại <span className="text-red-500">*</span></label>
                          <input 
                            type="text"
                            value={item.reason}
                            onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                            placeholder="Ví dụ: Sản phẩm bị lỗi, sai màu sắc..."
                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Reason */}
          <div className="mt-6 bg-white p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-2">Ghi chú thêm cho shop (Tùy chọn)</label>
            <textarea
              value={overallReason}
              onChange={(e) => setOverallReason(e.target.value)}
              rows={2}
              placeholder="Điền thêm thông tin để shop hỗ trợ bạn tốt hơn..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 transition"
            disabled={!!isSubmitting}
          >
            Hủy
          </button>
          <button 
            onClick={() => onSubmit(items, overallReason)}
            className="px-5 py-2 rounded-lg text-white font-medium bg-orange-500 hover:bg-orange-600 transition flex items-center gap-2 disabled:bg-orange-300"
            disabled={!!isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent flex-shrink-0 rounded-full animate-spin"></div>
                Đang gửi...
              </>
            ) : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
};

