import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-800">
                Zero-Waste Store
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700">
                    Xin chào, <strong>{user?.username}</strong>
                  </span>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-green-600"
                  >
                    Tài khoản
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/admin/dashboard"
                      className="text-gray-700 hover:text-green-600"
                    >
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-green-600"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-green-100 rounded-full p-6">
              <svg
                className="h-16 w-16 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Chào mừng đến với
            <span className="text-green-600"> Zero-Waste Store</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Cửa hàng sản phẩm thân thiện với môi trường, giúp bạn sống xanh và
            bảo vệ hành tinh
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center space-x-4">
            {!isAuthenticated && (
              <>
                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-200"
                >
                  Bắt đầu ngay
                </Link>
                <Link
                  to="/login"
                  className="bg-white hover:bg-gray-50 text-green-600 font-semibold px-8 py-3 rounded-lg border-2 border-green-600 transition duration-200"
                >
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 mb-4">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Sản phẩm xanh</h3>
            <p className="text-gray-600">
              100% sản phẩm thân thiện môi trường, có chứng nhận bền vững
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 mb-4">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Chatbot AI</h3>
            <p className="text-gray-600">
              Trợ lý AI tư vấn lối sống xanh và gợi ý sản phẩm phù hợp
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 mb-4">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Tích điểm xanh</h3>
            <p className="text-gray-600">
              Nhận điểm thưởng khi mua sắm và đổi quà hấp dẫn
            </p>
          </div>
        </div>
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

export default Home;