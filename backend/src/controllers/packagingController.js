const Packaging = require('../models/Packaging');
const Product = require('../models/Product');

/**
 * @route   GET /api/packagings
 * @desc    Lấy danh sách packagings (có phân trang, tìm kiếm)
 * @access  Public
 */
exports.getAllPackagings = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            isBiodegradable,
            isActive
        } = req.query;

        // Build query
        const query = {};

        // Tìm kiếm theo tên hoặc chất liệu
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { material: { $regex: search, $options: 'i' } }
            ];
        }

        // Lọc theo khả năng phân hủy
        if (isBiodegradable !== undefined) {
            query.isBiodegradable = isBiodegradable === 'true';
        }

        // Lọc theo trạng thái
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute queries
        const [packagings, total] = await Promise.all([
            Packaging.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Packaging.countDocuments(query)
        ]);

        // Tính productCount thực tế từ Product collection
        const packagingsWithCount = await Promise.all(
            packagings.map(async (pkg) => {
                const realCount = await Product.countDocuments({ packaging: pkg._id });
                const pkgObj = pkg.toObject();
                pkgObj.productCount = realCount;
                return pkgObj;
            })
        );

        res.status(200).json({
            success: true,
            data: {
                packagings: packagingsWithCount,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalPackagings: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get All Packagings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bao bì'
        });
    }
};

/**
 * @route   GET /api/packagings/all
 * @desc    Lấy tất cả packagings không phân trang (cho dropdown)
 * @access  Public
 */
exports.getAllPackagingsNoPagination = async (req, res) => {
    try {
        const packagings = await Packaging.find({ isActive: true })
            .select('_id name material isBiodegradable ecoPoints')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: packagings
        });
    } catch (error) {
        console.error('Get All Packagings (No Pagination) Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bao bì'
        });
    }
};

/**
 * @route   GET /api/packagings/:id
 * @desc    Lấy thông tin chi tiết 1 packaging
 * @access  Public
 */
exports.getPackagingById = async (req, res) => {
    try {
        const packaging = await Packaging.findById(req.params.id);

        if (!packaging) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bao bì'
            });
        }

        res.status(200).json({
            success: true,
            data: packaging
        });
    } catch (error) {
        console.error('Get Packaging By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin bao bì'
        });
    }
};

/**
 * @route   POST /api/packagings
 * @desc    Tạo packaging mới
 * @access  Private/Admin
 */
exports.createPackaging = async (req, res) => {
    try {
        const {
            name,
            material,
            description,
            isBiodegradable,
            isReusable,
            isRecyclable,
            decompositionTime,
            ecoPoints,
            isActive
        } = req.body;

        // Kiểm tra tên packaging đã tồn tại chưa
        const existingPackaging = await Packaging.findOne({ name });
        if (existingPackaging) {
            return res.status(400).json({
                success: false,
                message: 'Tên bao bì đã tồn tại'
            });
        }

        // Tạo packaging
        const packaging = await Packaging.create({
            name,
            material,
            description,
            isBiodegradable: isBiodegradable || false,
            isReusable: isReusable || false,
            isRecyclable: isRecyclable || false,
            decompositionTime: decompositionTime ? parseInt(decompositionTime) : null,
            ecoPoints: ecoPoints ? parseFloat(ecoPoints) : 0,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Tạo bao bì thành công',
            data: packaging
        });
    } catch (error) {
        console.error('Create Packaging Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo bao bì'
        });
    }
};

/**
 * @route   PUT /api/packagings/:id
 * @desc    Cập nhật packaging
 * @access  Private/Admin
 */
exports.updatePackaging = async (req, res) => {
    try {
        const {
            name,
            material,
            description,
            isBiodegradable,
            isReusable,
            isRecyclable,
            decompositionTime,
            ecoPoints,
            isActive
        } = req.body;

        const packaging = await Packaging.findById(req.params.id);

        if (!packaging) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bao bì'
            });
        }

        // Kiểm tra tên unique (nếu thay đổi)
        if (name && name !== packaging.name) {
            const existingPackaging = await Packaging.findOne({
                name,
                _id: { $ne: req.params.id }
            });

            if (existingPackaging) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên bao bì đã tồn tại'
                });
            }
        }

        // Cập nhật fields
        if (name) packaging.name = name;
        if (material) packaging.material = material;
        if (description !== undefined) packaging.description = description;
        if (isBiodegradable !== undefined) packaging.isBiodegradable = isBiodegradable;
        if (isReusable !== undefined) packaging.isReusable = isReusable;
        if (isRecyclable !== undefined) packaging.isRecyclable = isRecyclable;
        if (decompositionTime !== undefined) packaging.decompositionTime = decompositionTime ? parseInt(decompositionTime) : null;
        if (ecoPoints !== undefined) packaging.ecoPoints = parseFloat(ecoPoints);
        if (isActive !== undefined) packaging.isActive = isActive;

        await packaging.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật bao bì thành công',
            data: packaging
        });
    } catch (error) {
        console.error('Update Packaging Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật bao bì'
        });
    }
};

/**
 * @route   DELETE /api/packagings/:id
 * @desc    Xóa packaging (kiểm tra còn sản phẩm sử dụng không)
 * @access  Private/Admin
 */
exports.deletePackaging = async (req, res) => {
    try {
        const packaging = await Packaging.findById(req.params.id);

        if (!packaging) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bao bì'
            });
        }

        // Kiểm tra xem còn sản phẩm sử dụng packaging không
        const productsCount = await Product.countDocuments({
            packaging: req.params.id
        });

        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa bao bì vì còn ${productsCount} sản phẩm đang sử dụng. Vui lòng xóa hoặc chuyển sang bao bì khác.`
            });
        }

        // Xóa packaging
        await Packaging.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Xóa bao bì thành công'
        });
    } catch (error) {
        console.error('Delete Packaging Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bao bì'
        });
    }
};