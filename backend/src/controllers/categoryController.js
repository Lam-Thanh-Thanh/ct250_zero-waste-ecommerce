const Category = require('../models/Category');
const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { cleanupTempFile } = require('../middlewares/upload');

/**
 * @route   GET /api/categories
 * @desc    Lấy danh sách tất cả categories (có phân trang, tìm kiếm)
 * @access  Public
 */
exports.getAllCategories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            isActive
        } = req.query;

        // Build query
        const query = {};

        // Tìm kiếm theo tên
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Lọc theo trạng thái
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute queries
        const [categories, total] = await Promise.all([
            Category.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Category.countDocuments(query)
        ]);

        // Tính productCount thực tế từ Product collection
        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const realCount = await Product.countDocuments({ category: cat._id });
                const catObj = cat.toObject();
                catObj.productCount = realCount;
                return catObj;
            })
        );

        res.status(200).json({
            success: true,
            data: {
                categories: categoriesWithCount,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalCategories: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get All Categories Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách danh mục'
        });
    }
};

/**
 * @route   GET /api/categories/all
 * @desc    Lấy tất cả categories không phân trang (cho dropdown)
 * @access  Public
 */
exports.getAllCategoriesNoPagination = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .select('_id name slug productCount')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get All Categories (No Pagination) Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách danh mục'
        });
    }
};

/**
 * @route   GET /api/categories/:id
 * @desc    Lấy thông tin chi tiết 1 category
 * @access  Public
 */
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Get Category By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin danh mục'
        });
    }
};

/**
 * @route   POST /api/categories
 * @desc    Tạo category mới (có upload ảnh)
 * @access  Private/Admin
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;

        // Kiểm tra tên category đã tồn tại chưa
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục đã tồn tại'
            });
        }

        // Tạo category object
        const categoryData = {
            name,
            description,
            isActive: isActive !== undefined ? isActive : true
        };

        // Upload ảnh nếu có
        if (req.file) {
            try {
                const imageResult = await uploadImage(req.file.path, 'zero-waste/categories');
                categoryData.image = {
                    url: imageResult.url,
                    publicId: imageResult.publicId
                };
                // Xóa file tạm
                cleanupTempFile(req.file.path);
            } catch (uploadError) {
                cleanupTempFile(req.file.path);
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi upload hình ảnh'
                });
            }
        }

        // Tạo category
        const category = await Category.create(categoryData);

        res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: category
        });
    } catch (error) {
        console.error('Create Category Error:', error);
        // Xóa file tạm nếu có lỗi
        if (req.file) {
            cleanupTempFile(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo danh mục'
        });
    }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Cập nhật category (có thể upload ảnh mới)
 * @access  Private/Admin
 */
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            if (req.file) cleanupTempFile(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        // Kiểm tra tên unique (nếu thay đổi)
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({
                name,
                _id: { $ne: req.params.id }
            });

            if (existingCategory) {
                if (req.file) cleanupTempFile(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Tên danh mục đã tồn tại'
                });
            }
        }

        // Cập nhật fields
        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        // Upload ảnh mới nếu có
        if (req.file) {
            try {
                // Xóa ảnh cũ trên Cloudinary
                if (category.image && category.image.publicId) {
                    await deleteImage(category.image.publicId);
                }

                // Upload ảnh mới
                const imageResult = await uploadImage(req.file.path, 'zero-waste/categories');
                category.image = {
                    url: imageResult.url,
                    publicId: imageResult.publicId
                };

                // Xóa file tạm
                cleanupTempFile(req.file.path);
            } catch (uploadError) {
                cleanupTempFile(req.file.path);
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi upload hình ảnh'
                });
            }
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: category
        });
    } catch (error) {
        console.error('Update Category Error:', error);
        if (req.file) cleanupTempFile(req.file.path);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật danh mục'
        });
    }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Xóa category (kiểm tra còn sản phẩm không)
 * @access  Private/Admin
 */
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        // Kiểm tra xem còn sản phẩm trong category không
        const productsCount = await Product.countDocuments({ category: req.params.id });

        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa danh mục vì còn ${productsCount} sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác.`
            });
        }

        // Xóa ảnh trên Cloudinary nếu có
        if (category.image && category.image.publicId) {
            try {
                await deleteImage(category.image.publicId);
            } catch (error) {
                console.error('Error deleting category image:', error);
            }
        }

        // Xóa category
        await Category.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Xóa danh mục thành công'
        });
    } catch (error) {
        console.error('Delete Category Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa danh mục'
        });
    }
};

/**
 * @route   DELETE /api/categories/:id/image
 * @desc    Xóa ảnh của category
 * @access  Private/Admin
 */
exports.deleteCategoryImage = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        if (!category.image || !category.image.publicId) {
            return res.status(400).json({
                success: false,
                message: 'Danh mục chưa có hình ảnh'
            });
        }

        // Xóa ảnh trên Cloudinary
        await deleteImage(category.image.publicId);

        // Xóa ảnh trong database
        category.image = { url: null, publicId: null };
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Xóa hình ảnh thành công'
        });
    } catch (error) {
        console.error('Delete Category Image Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hình ảnh'
        });
    }
};