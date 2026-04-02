import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <img src="/Zero-Waste Store.png" alt="Logo" className="h-8 w-auto object-contain" />
              <span className="ml-2 text-lg font-bold">Zero-Waste Store</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Cửa hàng sản phẩm thân thiện với môi trường, giúp bạn sống xanh và bảo vệ hành tinh.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">Trang chủ</Link></li>
              <li><Link to="/productlist" className="text-gray-400 hover:text-white text-sm transition-colors">Sản phẩm</Link></li>
              <li><Link to="/promotions" className="text-gray-400 hover:text-white text-sm transition-colors">Khuyến mãi</Link></li>
              <li><Link to="/orders" className="text-gray-400 hover:text-white text-sm transition-colors">Đơn hàng</Link></li>
            </ul>
          </div>

          {/* Tài khoản */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Tài khoản</h3>
            <ul className="space-y-2">
              <li><Link to="/profile" className="text-gray-400 hover:text-white text-sm transition-colors">Thông tin cá nhân</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-white text-sm transition-colors">Giỏ hàng</Link></li>
              <li><Link to="/reviews" className="text-gray-400 hover:text-white text-sm transition-colors">Đánh giá</Link></li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Khu II, Đ. 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>zerowaste@ctu.edu.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">&copy; 2026 Zero-Waste Store. All rights reserved.</p>
          <p className="mt-1 text-gray-500 text-xs">Sản phẩm đồ án niên luận ngành Kỹ thuật phần mềm</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
