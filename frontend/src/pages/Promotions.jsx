import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAvailablePromotions } from '../api/promotionApi';
import { toast } from 'react-toastify';
import { FiTag, FiClock, FiInfo, FiCopy, FiCheck, FiArrowLeft } from 'react-icons/fi';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const Promotions = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const result = await getAvailablePromotions();
        if (result.success) {
          setPromotions(result.data);
        }
      } catch (error) {
        console.error('Không thể tải danh sách khuyến mãi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Đã sao chép mã!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link to="/" className="text-green-600 hover:text-green-700 flex items-center">
            <FiArrowLeft className="mr-1" /> Trang chủ
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-green-700">
            Khuyến Mãi & Ưu Đãi
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Sử dụng các mã giảm giá dưới đây để tiết kiệm hơn cho đơn hàng của bạn
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center bg-white rounded-2xl shadow-sm p-12">
            <FiTag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có khuyến mãi nào</h3>
            <p className="text-gray-500">
              Hiện tại chúng tôi chưa có chương trình khuyến mãi nào. Vui lòng quay lại sau!
            </p>
            <div className="mt-6">
              <Link to="/" className="text-green-600 font-medium hover:text-green-500">
                Tiếp tục mua sắm &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5 text-center relative">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white opacity-10 rounded-full blur-lg"></div>
                  <h3 className="text-3xl font-bold mb-1">
                    {promo.type === 'percentage' ? `${promo.discountValue}%` : formatPrice(promo.discountValue)}
                  </h3>
                  <p className="text-green-50 font-medium text-sm">GIẢM GIÁ</p>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow flex flex-col">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{promo.name}</h4>
                  {promo.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{promo.description}</p>
                  )}

                  <div className="space-y-2 mt-auto">
                    {promo.minOrderAmount > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiInfo className="mr-2 text-blue-500" />
                        Đơn tối thiểu: <strong className="ml-1">{formatPrice(promo.minOrderAmount)}</strong>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <FiClock className="mr-2 text-orange-500" />
                      Hạn sử dụng: <strong className="ml-1 text-red-600">{formatDate(promo.endDate)}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 border-dashed bg-gray-50 flex items-center justify-between">
                  <div className="font-mono font-bold text-lg text-green-700 tracking-wider bg-green-100 px-3 py-1 rounded-md border border-green-200">
                    {promo.code}
                  </div>
                  <button
                    onClick={() => copyToClipboard(promo.code)}
                    className="flex items-center text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 px-3 py-2 rounded-lg transition-colors"
                  >
                    {copiedCode === promo.code ? (
                      <><FiCheck className="mr-1" /> Đã chép</>
                    ) : (
                      <><FiCopy className="mr-1" /> Sao chép</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;
