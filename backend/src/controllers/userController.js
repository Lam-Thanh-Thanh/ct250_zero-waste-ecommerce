const User = require('../models/User');

/**
 * @route   GET /api/users
 * @desc    Lấy danh sách tất cả users (có phân trang, tìm kiếm)
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '',
      isActive 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Tìm kiếm theo username hoặc email
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Lọc theo role
    if (role) {
      query.role = role;
    }
    
    // Lọc theo trạng thái active
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    console.log('getAllUsers - Query params:', { page, limit, search, role, isActive });
    console.log('getAllUsers - Built query:', query);
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute queries
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    
    console.log('getAllUsers - Found users:', users.length, 'Total:', total);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Lấy thông tin chi tiết 1 user
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng'
    });
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Cập nhật thông tin user (admin)
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { username, email, phone, address, role, isActive, ecoPoints } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Kiểm tra email unique (nếu thay đổi)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }
    
    // Kiểm tra username unique (nếu thay đổi)
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ 
        username, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập đã được sử dụng'
        });
      }
    }
    
    // Cập nhật các field
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (ecoPoints !== undefined) user.ecoPoints = ecoPoints;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin người dùng'
    });
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Xóa user (soft delete)
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Không cho phép admin tự xóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể xóa chính tài khoản của mình'
      });
    }
    
    // Soft delete
    user.isActive = false;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng'
    });
  }
};

/**
 * @route   PUT /api/users/:id/toggle-status
 * @desc    Khóa/Mở khóa tài khoản user
 * @access  Private/Admin
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Không cho phép admin tự khóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể khóa chính tài khoản của mình'
      });
    }
    
    // Toggle trạng thái
    user.isActive = !user.isActive;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `${user.isActive ? 'Mở khóa' : 'Khóa'} tài khoản thành công`,
      data: {
        userId: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái người dùng'
    });
  }
};

/**
 * @route   GET /api/users/stats
 * @desc    Thống kê người dùng (tổng số, mới trong tháng...)
 * @access  Private/Admin
 */
exports.getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      totalUsers,
      totalActiveUsers,
      totalInactiveUsers,
      newUsersThisMonth,
      usersByRole
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        newUsersThisMonth,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê người dùng'
    });
  }
};