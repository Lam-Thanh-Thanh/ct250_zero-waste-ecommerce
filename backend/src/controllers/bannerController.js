const Banner = require('../models/Banner');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const fs = require('fs');

/**
 * @desc    Lấy tất cả banners (cho public)
 * @route   GET /api/banners
 * @access  Public
 */
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

/**
 * @desc    Lấy tất cả banners (cho admin - bao gồm cả inactive)
 * @route   GET /api/banners/all
 * @access  Private/Admin
 */
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find()
            .sort({ order: 1, createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

/**
 * @desc    Tạo banner mới
 * @route   POST /api/banners
 * @access  Private/Admin
 */
exports.createBanner = async (req, res) => {
    try {
        const { title, subtitle, link, buttonText, order, isActive } = req.body;

        // Upload image nếu có
        let imageUrl = '';
        if (req.file) {
            imageUrl = await uploadImage(req.file.path, 'banners');
            // Xóa file tạm
            fs.unlinkSync(req.file.path);
        }

        const banner = await Banner.create({
            title,
            subtitle,
            image: imageUrl,
            link,
            buttonText,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Tạo banner thành công',
            data: banner
        });
    } catch (error) {
        // Xóa file tạm nếu có lỗi
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Cập nhật banner
 * @route   PUT /api/banners/:id
 * @access  Private/Admin
 */
exports.updateBanner = async (req, res) => {
    try {
        let banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy banner'
            });
        }

        const { title, subtitle, link, buttonText, order, isActive } = req.body;

        // Upload image mới nếu có
        if (req.file) {
            // Xóa ảnh cũ trên Cloudinary
            if (banner.image) {
                await deleteImage(banner.image);
            }
            // Upload ảnh mới
            banner.image = await uploadImage(req.file.path, 'banners');
            // Xóa file tạm
            fs.unlinkSync(req.file.path);
        }

        // Cập nhật các fields
        banner.title = title || banner.title;
        banner.subtitle = subtitle !== undefined ? subtitle : banner.subtitle;
        banner.link = link !== undefined ? link : banner.link;
        banner.buttonText = buttonText !== undefined ? buttonText : banner.buttonText;
        banner.order = order !== undefined ? order : banner.order;
        banner.isActive = isActive !== undefined ? isActive : banner.isActive;

        await banner.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật banner thành công',
            data: banner
        });
    } catch (error) {
        // Xóa file tạm nếu có lỗi
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Xóa banner
 * @route   DELETE /api/banners/:id
 * @access  Private/Admin
 */
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy banner'
            });
        }

        // Xóa ảnh trên Cloudinary
        if (banner.image) {
            await deleteImage(banner.image);
        }

        await banner.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Xóa banner thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};
