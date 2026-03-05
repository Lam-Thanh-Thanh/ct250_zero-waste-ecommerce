const cartService = require('../services/cartService');

/**
 * Cart Controller
 * API endpoints cho giỏ hàng
 */

/**
 * @route   GET /api/cart
 * @desc    Lấy giỏ hàng của user hiện tại
 * @access  Private
 */
exports.getCart = async (req, res) => {
    try {
        const cart = await cartService.getCart(req.user._id);
        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy giỏ hàng'
        });
    }
};

/**
 * @route   POST /api/cart/items
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @access  Private
 */
exports.addItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp productId'
            });
        }

        const cart = await cartService.addItem(
            req.user._id,
            productId,
            quantity || 1
        );

        res.status(200).json({
            success: true,
            message: 'Đã thêm sản phẩm vào giỏ hàng',
            data: cart
        });
    } catch (error) {
        console.error('Add Item Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm sản phẩm vào giỏ hàng'
        });
    }
};

/**
 * @route   PUT /api/cart/items/:productId
 * @desc    Cập nhật số lượng sản phẩm trong giỏ
 * @access  Private
 */
exports.updateItemQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải >= 1'
            });
        }

        const cart = await cartService.updateItemQuantity(
            req.user._id,
            productId,
            quantity
        );

        res.status(200).json({
            success: true,
            message: 'Đã cập nhật số lượng',
            data: cart
        });
    } catch (error) {
        console.error('Update Item Quantity Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật số lượng'
        });
    }
};

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @access  Private
 */
exports.removeItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const cart = await cartService.removeItem(req.user._id, productId);

        res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            data: cart
        });
    } catch (error) {
        console.error('Remove Item Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa sản phẩm'
        });
    }
};

/**
 * @route   DELETE /api/cart
 * @desc    Xóa toàn bộ giỏ hàng
 * @access  Private
 */
exports.clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCart(req.user._id);

        res.status(200).json({
            success: true,
            message: 'Đã xóa toàn bộ giỏ hàng',
            data: cart
        });
    } catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa giỏ hàng'
        });
    }
};
