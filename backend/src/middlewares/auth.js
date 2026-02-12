const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware xác thực JWT token
 * Kiểm tra token trong header Authorization: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Token không hợp lệ'
      });
    }
    
    // 3. Kiểm tra user còn tồn tại không
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }
    
    // 4. Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.'
      });
    }
    
    // 5. Gán user vào req để sử dụng ở các middleware/controller tiếp theo
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực người dùng'
    });
  }
};

/**
 * Middleware kiểm tra quyền admin
 * Sử dụng sau authMiddleware
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập chức năng này'
    });
  }
  
  next();
};

/**
 * Middleware kiểm tra quyền (linh hoạt hơn)
 * @param {Array} roles - Mảng các role được phép
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập chức năng này'
      });
    }
    
    next();
  };
};

/**
 * Middleware optional auth (không bắt buộc đăng nhập)
 * Nếu có token thì verify, không có thì vẫn cho qua
 * Hữu ích cho các endpoint public nhưng có thể hiển thị thông tin cá nhân nếu đã đăng nhập
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Không có token, vẫn cho qua
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (error) {
      // Token không hợp lệ, vẫn cho qua nhưng không có user
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional Auth Error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  protect: authMiddleware, // Alias để dùng trong routes
  adminMiddleware,
  admin: adminMiddleware, // Alias để dùng trong routes
  authorize,
  optionalAuth
};