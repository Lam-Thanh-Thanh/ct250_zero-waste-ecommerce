const Promotion = require('../models/Promotion');

/**
 * @route   GET /api/promotions
 * @desc    Lấy danh sách promotion (Admin)
 * @access  Private/Admin
 */
exports.getAllPromotions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            status,
            type,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // Lọc theo trạng thái (AND với các điều kiện khác)
        const now = new Date();
        if (status === 'qua_han') {
            query.endDate = { $lt: now };
        } else if (status === 'het_luot') {
            query.endDate = { $gte: now };
            query.usageLimit = { $ne: null };
            query.$expr = { $gte: ['$usedCount', '$usageLimit'] };
        } else if (status === 'con_luot') {
            query.endDate = { $gte: now };
            query.$and = [
                {
                    $or: [
                        { usageLimit: null },
                        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
                    ]
                }
            ];
        }

        // Lọc theo loại giảm giá (AND với trạng thái)
        if (type && type !== 'all') {
            query.type = type;
        }

        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [promotions, total] = await Promise.all([
            Promotion.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Promotion.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                promotions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalPromotions: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get All Promotions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách khuyến mãi'
        });
    }
};

/**
 * @route   GET /api/promotions/:id
 * @desc    Lấy chi tiết promotion (Admin)
 * @access  Private/Admin
 */
exports.getPromotionById = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        res.status(200).json({
            success: true,
            data: promotion
        });
    } catch (error) {
        console.error('Get Promotion By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin khuyến mãi'
        });
    }
};

/**
 * @route   POST /api/promotions
 * @desc    Tạo promotion mới (Admin)
 * @access  Private/Admin
 */
exports.createPromotion = async (req, res) => {
    try {
        const {
            code, name, description, discountValue, type,
            applicableTo, minOrderAmount, startDate, endDate,
            isActive, usageLimit
        } = req.body;

        // Kiểm tra code đã tồn tại
        const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
        if (existingPromotion) {
            return res.status(400).json({
                success: false,
                message: 'Mã khuyến mãi đã tồn tại'
            });
        }

        const promotion = await Promotion.create({
            code,
            name,
            description,
            discountValue: parseFloat(discountValue),
            type: type || 'percentage',
            applicableTo: applicableTo || 'all',
            minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
            startDate,
            endDate,
            isActive: isActive !== undefined ? isActive : true,
            usageLimit: usageLimit ? parseInt(usageLimit) : null
        });

        res.status(201).json({
            success: true,
            message: 'Tạo khuyến mãi thành công',
            data: promotion
        });
    } catch (error) {
        console.error('Create Promotion Error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: errors.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo khuyến mãi'
        });
    }
};

/**
 * @route   PUT /api/promotions/:id
 * @desc    Cập nhật promotion (Admin)
 * @access  Private/Admin
 */
exports.updatePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        const {
            code, name, description, discountValue, type,
            applicableTo, minOrderAmount, startDate, endDate,
            isActive, usageLimit
        } = req.body;

        // Kiểm tra code trùng nếu thay đổi
        if (code && code.toUpperCase() !== promotion.code) {
            const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
            if (existingPromotion) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã khuyến mãi đã tồn tại'
                });
            }
            promotion.code = code;
        }

        if (name !== undefined) promotion.name = name;
        if (description !== undefined) promotion.description = description;
        if (discountValue !== undefined) promotion.discountValue = parseFloat(discountValue);
        if (type !== undefined) promotion.type = type;
        if (applicableTo !== undefined) promotion.applicableTo = applicableTo;
        if (minOrderAmount !== undefined) promotion.minOrderAmount = parseFloat(minOrderAmount);
        if (startDate !== undefined) promotion.startDate = startDate;
        if (endDate !== undefined) promotion.endDate = endDate;
        if (isActive !== undefined) promotion.isActive = isActive;
        if (usageLimit !== undefined) promotion.usageLimit = usageLimit ? parseInt(usageLimit) : null;

        await promotion.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật khuyến mãi thành công',
            data: promotion
        });
    } catch (error) {
        console.error('Update Promotion Error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: errors.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật khuyến mãi'
        });
    }
};

/**
 * @route   DELETE /api/promotions/:id
 * @desc    Xóa promotion (Admin)
 * @access  Private/Admin
 */
exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        await Promotion.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Xóa khuyến mãi thành công'
        });
    } catch (error) {
        console.error('Delete Promotion Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khuyến mãi'
        });
    }
};

/**
 * @route   GET /api/promotions/available
 * @desc    Lấy danh sách promotion khả dụng cho user (để hiển thị trên trang Khuyến mãi và Checkout)
 * @access  Public
 */
exports.getAvailablePromotions = async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            usedBy: { $ne: req.user._id },
            $and: [
                {
                    $or: [
                        { usageLimit: null },
                        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
                    ]
                }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: promotions
        });
    } catch (error) {
        console.error('Get Available Promotions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách khuyến mãi khả dụng'
        });
    }
};

/**
 * @route   POST /api/promotions/validate
 * @desc    Validate mã giảm giá (User nhập code khi checkout)
 * @access  Private (user đã đăng nhập)
 */
exports.validatePromotionCode = async (req, res) => {
    try {
        const { code, orderSubtotal } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã giảm giá'
            });
        }

        const promotion = await Promotion.findOne({ code: code.toUpperCase() });

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Mã giảm giá không tồn tại'
            });
        }

        // Kiểm tra isActive
        if (!promotion.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã bị vô hiệu hóa'
            });
        }

        // Kiểm tra thời hạn
        const now = new Date();
        if (now < promotion.startDate) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá chưa đến thời gian áp dụng'
            });
        }
        if (now > promotion.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết hạn'
            });
        }

        // Kiểm tra người dùng đã sử dụng chưa
        if (promotion.usedBy && promotion.usedBy.includes(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã sử dụng mã giảm giá này rồi'
            });
        }

        // Kiểm tra số lần sử dụng
        if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết lượt sử dụng'
            });
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderSubtotal && orderSubtotal < promotion.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${promotion.minOrderAmount.toLocaleString('vi-VN')}₫ để sử dụng mã này`
            });
        }

        // Tính giá trị giảm
        let discountAmount = 0;
        if (promotion.type === 'percentage') {
            discountAmount = orderSubtotal ? Math.round(orderSubtotal * promotion.discountValue / 100) : 0;
        } else {
            discountAmount = promotion.discountValue;
        }

        // Đảm bảo không giảm quá tổng đơn
        if (orderSubtotal && discountAmount > orderSubtotal) {
            discountAmount = orderSubtotal;
        }

        res.status(200).json({
            success: true,
            message: 'Mã giảm giá hợp lệ',
            data: {
                promotion: {
                    _id: promotion._id,
                    code: promotion.code,
                    name: promotion.name,
                    type: promotion.type,
                    discountValue: promotion.discountValue,
                    minOrderAmount: promotion.minOrderAmount
                },
                discountAmount
            }
        });
    } catch (error) {
        console.error('Validate Promotion Code Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra mã giảm giá'
        });
    }
};
