const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Cart Service
 * Xử lý logic nghiệp vụ cho giỏ hàng
 */
class CartService {
    /**
     * Lấy giỏ hàng của user (tạo mới nếu chưa có)
     */
    async getCart(userId) {
        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name slug price discount finalPrice stock inStock images isActive'
            });

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
            cart = await Cart.findById(cart._id).populate({
                path: 'items.product',
                select: 'name slug price discount finalPrice stock inStock images isActive'
            });
        }

        // Tính toán thông tin giỏ hàng
        const cartData = this._calculateCartSummary(cart);
        return cartData;
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     */
    async addItem(userId, productId, quantity = 1) {
        // 1. Kiểm tra sản phẩm tồn tại và còn active
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Sản phẩm không tồn tại');
        }
        if (!product.isActive) {
            throw new Error('Sản phẩm đã ngừng kinh doanh');
        }
        if (!product.inStock || product.stock < 1) {
            throw new Error('Sản phẩm đã hết hàng');
        }

        // 2. Lấy hoặc tạo cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        // 3. Kiểm tra sản phẩm đã có trong giỏ chưa
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString()
        );

        if (existingItemIndex > -1) {
            // Đã có → tăng số lượng
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Chưa có → thêm mới
            if (quantity > product.stock) {
                throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
            }
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();

        // Populate và trả về
        return this.getCart(userId);
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ
     */
    async updateItemQuantity(userId, productId, quantity) {
        if (quantity < 1) {
            throw new Error('Số lượng tối thiểu là 1');
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error('Giỏ hàng không tồn tại');
        }

        // Tìm item trong giỏ
        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString()
        );

        if (itemIndex === -1) {
            throw new Error('Sản phẩm không có trong giỏ hàng');
        }

        // Kiểm tra tồn kho
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Sản phẩm không tồn tại');
        }
        if (quantity > product.stock) {
            throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        return this.getCart(userId);
    }

    /**
     * Xóa sản phẩm khỏi giỏ hàng
     */
    async removeItem(userId, productId) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error('Giỏ hàng không tồn tại');
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString()
        );

        if (itemIndex === -1) {
            throw new Error('Sản phẩm không có trong giỏ hàng');
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        return this.getCart(userId);
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    async clearCart(userId) {
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        return { items: [], totalItems: 0, subtotal: 0 };
    }

    /**
     * Tính toán tổng tiền giỏ hàng (private helper)
     */
    _calculateCartSummary(cart) {
        const items = cart.items
            .filter(item => item.product) // Lọc bỏ product đã bị xóa
            .map(item => {
                const product = item.product;
                const price = product.price || 0;
                const discount = product.discount || 0;
                const finalPrice = product.finalPrice || (price - (price * discount / 100));
                const subtotal = finalPrice * item.quantity;

                return {
                    _id: item._id,
                    product: {
                        _id: product._id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        discount: product.discount,
                        finalPrice: finalPrice,
                        stock: product.stock,
                        inStock: product.inStock,
                        isActive: product.isActive,
                        image: product.images && product.images.length > 0
                            ? (product.images.find(img => img.isMain) || product.images[0]).url
                            : null
                    },
                    quantity: item.quantity,
                    subtotal: subtotal
                };
            });

        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

        return {
            _id: cart._id,
            user: cart.user,
            items,
            totalItems,
            subtotal,
            updatedAt: cart.updatedAt
        };
    }
}

module.exports = new CartService();
