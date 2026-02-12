const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Configuration
 * Upload và quản lý hình ảnh trên cloud
 * 
 * HƯỚNG DẪN:
 * 1. Tạo tài khoản miễn phí tại: https://cloudinary.com/users/register/free
 * 2. Lấy thông tin từ Dashboard:
 *    - Cloud Name
 *    - API Key
 *    - API Secret
 * 3. Thêm vào file .env:
 *    CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    CLOUDINARY_API_KEY=your_api_key
 *    CLOUDINARY_API_SECRET=your_api_secret
 */

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo-cloud',
    api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'abcdefghijklmnopqrstuvwxyz'
});

/**
 * Upload ảnh lên Cloudinary
 * @param {string} filePath - Đường dẫn file tạm
 * @param {string} folder - Folder trên Cloudinary (categories/products)
 * @returns {Promise<Object>} - {url, publicId}
 */
const uploadImage = async (filePath, folder = 'zero-waste') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' }, // Giới hạn kích thước
                { quality: 'auto' }, // Tự động tối ưu chất lượng
                { fetch_format: 'auto' } // Tự động chọn format tốt nhất
            ]
        });

        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Lỗi khi upload hình ảnh');
    }
};

/**
 * Xóa ảnh từ Cloudinary
 * @param {string} publicId - Public ID của ảnh
 * @returns {Promise<Object>}
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
        throw new Error('Lỗi khi xóa hình ảnh');
    }
};

/**
 * Xóa nhiều ảnh cùng lúc
 * @param {Array<string>} publicIds - Mảng public IDs
 * @returns {Promise<Object>}
 */
const deleteMultipleImages = async (publicIds) => {
    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Cloudinary Delete Multiple Error:', error);
        throw new Error('Lỗi khi xóa nhiều hình ảnh');
    }
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage,
    deleteMultipleImages
};