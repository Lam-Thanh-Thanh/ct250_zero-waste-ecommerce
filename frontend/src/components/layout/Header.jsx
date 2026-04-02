import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();
  const { cartItemCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/Zero-Waste Store.png" alt="Logo" className="h-8 sm:h-10 w-auto object-contain" />
            <span className="ml-2 text-lg sm:text-xl font-bold text-gray-800 hidden sm:inline">Zero-Waste Store</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {loading ? (
              <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-md" title="Đang tải..." />
            ) : isAuthenticated ? (
              <>
                <span className="text-gray-700 text-sm hidden lg:inline">
                  Xin chào, <strong>{user?.username}</strong>
                </span>
                <Link to="/" className={`text-sm transition-colors ${isActive('/') ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`}>Trang chủ</Link>
                <Link to="/productlist" className={`text-sm transition-colors ${isActive('/productlist') ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`}>Sản phẩm</Link>
                <Link to="/promotions" className={`text-sm transition-colors ${isActive('/promotions') ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`}>Khuyến mãi</Link>
                <Link to="/orders" className={`text-sm transition-colors ${isActive('/orders') ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`}>Đơn hàng</Link>
                <Link to="/profile" className={`text-sm transition-colors ${isActive('/profile') ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`}>Tài khoản</Link>
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
                  <Link to="/admin/dashboard" className="text-sm text-gray-700 hover:text-green-600">Quản trị</Link>
                )}
                <button onClick={logout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md text-sm transition-colors">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/" className={`text-sm transition-colors ${isActive('/') ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`}>Trang chủ</Link>
                <Link to="/productlist" className={`text-sm transition-colors ${isActive('/productlist') ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`}>Sản phẩm</Link>
                <Link to="/login" className="text-sm text-gray-700 hover:text-green-600">Đăng nhập</Link>
                <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors">Đăng ký</Link>
              </>
            )}
          </nav>

          {/* Mobile: Cart + Hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            {isAuthenticated && (
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
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 pb-4 animate-fadeIn">
            {loading ? (
              <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md mt-3" />
            ) : isAuthenticated ? (
              <div className="space-y-1 pt-3">
                <p className="text-sm text-gray-600 px-3 pb-2 border-b border-gray-100 mb-2">
                  Xin chào, <strong>{user?.username}</strong>
                </p>
                {[
                  { to: '/', label: 'Trang chủ' },
                  { to: '/productlist', label: 'Sản phẩm' },
                  { to: '/promotions', label: 'Khuyến mãi' },
                  { to: '/orders', label: 'Đơn hàng' },
                  { to: '/profile', label: 'Tài khoản' },
                  { to: '/cart', label: `Giỏ hàng${cartItemCount > 0 ? ` (${cartItemCount})` : ''}` },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(item.to) ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && isAdmin() && (
                  <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Quản trị</Link>
                )}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">Đăng xuất</button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 pt-3">
                {[
                  { to: '/', label: 'Trang chủ' },
                  { to: '/productlist', label: 'Sản phẩm' },
                ].map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(item.to) ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>{item.label}</Link>
                ))}
                <div className="flex gap-2 px-3 pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Đăng nhập</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Đăng ký</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;