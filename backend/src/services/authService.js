const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

class AuthService {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} userData - Thông tin user { username, email, password, phone, address }
   * @returns {Object} { user, token }
   */
  async register(userData) {
    const { username, email, password, phone, address } = userData;
    
    // 1. Kiểm tra email đã tồn tại chưa
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new Error('Email đã được sử dụng');
    }
    
    // 2. Kiểm tra username đã tồn tại chưa
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new Error('Tên đăng nhập đã được sử dụng');
    }
    
    // 3. Tạo user mới
    const user = await User.create({
      username,
      email,
      password, // Password sẽ được hash tự động trong model (pre save hook)
      phone: phone || undefined,
      address: address || undefined,
      role: 'user', // Mặc định role là user
      isActive: true,
      ecoPoints: 0
    });
    
    // 4. Tạo JWT token
    const token = generateToken({
      userId: user._id,
      role: user.role
    });
    
    // 5. Trả về user (không bao gồm password) và token
    return {
      user: user.toPublicJSON(),
      token
    };
  }
  
  /**
   * Đăng nhập
   * @param {String} email 
   * @param {String} password 
   * @returns {Object} { user, token }
   */
  async login(email, password) {
    // 1. Tìm user theo email (bao gồm password để so sánh)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    // 2. Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ admin.');
    }
    
    // 3. So sánh password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    // 4. Cập nhật thời gian đăng nhập cuối
    user.lastLogin = new Date();
    await user.save();
    
    // 5. Tạo JWT token
    const token = generateToken({
      userId: user._id,
      role: user.role
    });
    
    // 6. Trả về user (không bao gồm password) và token
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return {
      user: userResponse,
      token
    };
  }
  
  /**
   * Lấy thông tin user hiện tại
   * @param {String} userId 
   * @returns {Object} user
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }
    
    if (!user.isActive) {
      throw new Error('Tài khoản đã bị khóa');
    }
    
    return user;
  }
  
  /**
   * Cập nhật thông tin cá nhân
   * @param {String} userId 
   * @param {Object} updateData - { username, phone, address }
   * @returns {Object} user đã cập nhật
   */
  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }
    
    // Kiểm tra nếu update username thì phải unique
    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await User.findOne({ 
        username: updateData.username,
        _id: { $ne: userId } // Không tính user hiện tại
      });
      
      if (existingUsername) {
        throw new Error('Tên đăng nhập đã được sử dụng');
      }
    }
    
    // Cập nhật các field được phép
    const allowedUpdates = ['username', 'phone', 'address', 'avatar'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });
    
    await user.save();
    
    return user.toPublicJSON();
  }
  
  /**
   * Đổi mật khẩu
   * @param {String} userId 
   * @param {String} currentPassword 
   * @param {String} newPassword 
   * @returns {Object} success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Lấy user kèm password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }
    
    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }
    
    // Kiểm tra mật khẩu mới không giống mật khẩu cũ
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new Error('Mật khẩu mới không được giống mật khẩu cũ');
    }
    
    // Cập nhật mật khẩu mới (sẽ được hash tự động)
    user.password = newPassword;
    await user.save();
    
    return { message: 'Đổi mật khẩu thành công' };
  }
  
  /**
   * Xóa tài khoản (soft delete - chỉ set isActive = false)
   * @param {String} userId 
   * @returns {Object} success message
   */
  async deleteAccount(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }
    
    // Soft delete - chỉ set isActive = false
    user.isActive = false;
    await user.save();
    
    return { message: 'Xóa tài khoản thành công' };
  }
}

module.exports = new AuthService();