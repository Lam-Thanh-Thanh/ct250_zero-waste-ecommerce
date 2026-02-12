const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Upload Middleware
 * Sử dụng multer để xử lý multipart/form-data
 * Lưu file tạm vào memory trước khi upload lên Cloudinary
 */

// Tạo thư mục uploads nếu chưa có
const uploadDir = 'uploads/temp';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)'));
    }
};

// Multer config
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    },
    fileFilter: fileFilter
});

/**
 * Middleware xóa file tạm sau khi upload
 * Gọi sau khi đã upload lên Cloudinary
 */
const cleanupTempFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error cleaning up temp file:', error);
    }
};

/**
 * Middleware xóa nhiều file tạm
 */
const cleanupTempFiles = (filePaths) => {
    filePaths.forEach(filePath => {
        cleanupTempFile(filePath);
    });
};

module.exports = {
    upload,
    cleanupTempFile,
    cleanupTempFiles
};