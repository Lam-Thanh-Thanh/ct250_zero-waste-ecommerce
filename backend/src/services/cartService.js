const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

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
            })
            .populate({
                path: 'items.variant'
            });

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
            cart = await Cart.findById(cart._id)
                .populate({
                    path: 'items.product',
                    select: 'name slug price discount finalPrice stock inStock images isActive'
                })
                .populate({
                    path: 'items.variant'
                });
        }

        // Tính toán thông tin giỏ hàng
        const cartData = this._calculateCartSummary(cart);
        return cartData;
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     */
    async addItem(userId, productId, quantity = 1, variantId = null) {
        // 1. Kiểm tra sản phẩm tồn tại và còn active
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Sản phẩm không tồn tại');
        }
        if (!product.isActive) {
            throw new Error('Sản phẩm đã ngừng kinh doanh');
        }
        if (!product.inStock || product.stock < 1) {
            // If it's a base product without variants, throw error
            if (!variantId) {
                throw new Error('Sản phẩm đã hết hàng');
            }
        }

        // 1.5 Kiểm tra variant
        let variant = null;
        if (variantId) {
            variant = await ProductVariant.findById(variantId);
            if (!variant) throw new Error('Biến thể sản phẩm không tồn tại');
            if (variant.stockQuantity < 1) throw new Error('Biến thể này đã hết hàng');
        }

        // 2. Lấy hoặc tạo cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        // 3. Kiểm tra sản phẩm đã có trong giỏ chưa
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString() && (item.variant ? item.variant.toString() : null) === (variantId ? variantId.toString() : null)
        );

        const checkStock = variant ? variant.stockQuantity : product.stock;

        if (existingItemIndex > -1) {
            // Đã có → tăng số lượng
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > checkStock) {
                throw new Error(`Chỉ còn ${checkStock} sản phẩm trong kho`);
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Chưa có → thêm mới
            if (quantity > checkStock) {
                throw new Error(`Chỉ còn ${checkStock} sản phẩm trong kho`);
            }
            cart.items.push({ product: productId, quantity, variant: variantId });
        }

        await cart.save();

        // Populate và trả về
        return this.getCart(userId);
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ
     */
    async updateItemQuantity(userId, productId, quantity, variantId = null) {
        if (quantity < 1) {
            throw new Error('Số lượng tối thiểu là 1');
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error('Giỏ hàng không tồn tại');
        }

        // Tìm item trong giỏ
        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString() && (item.variant ? item.variant.toString() : null) === (variantId ? variantId.toString() : null)
        );

        if (itemIndex === -1) {
            throw new Error('Sản phẩm không có trong giỏ hàng');
        }

        // Kiểm tra tồn kho
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Sản phẩm không tồn tại');
        }

        let variant = null;
        if (variantId) {
            variant = await ProductVariant.findById(variantId);
            if (!variant) throw new Error('Biến thể sản phẩm không tồn tại');
        }

        const checkStock = variant ? variant.stockQuantity : product.stock;

        if (quantity > checkStock) {
            throw new Error(`Chỉ còn ${checkStock} sản phẩm trong kho`);
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        return this.getCart(userId);
    }

    /**
     * Xóa sản phẩm khỏi giỏ hàng
     */
    async removeItem(userId, productId, variantId = null) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error('Giỏ hàng không tồn tại');
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString() && (item.variant ? item.variant.toString() : null) === (variantId ? variantId.toString() : null)
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
                const variant = item.variant; // This will be populated object or null
                const basePrice = product.price || 0;
                const priceModifier = variant ? (variant.priceModifier || 0) : 0;
                const totalBasePrice = basePrice + priceModifier;
                const discount = product.discount || 0;
                
                // If variant exists, we recalculate finalPrice based on modifier
                const finalPrice = totalBasePrice - (totalBasePrice * discount / 100);
                const subtotal = finalPrice * item.quantity;

                return {
                    _id: item._id,
                    product: {
                        _id: product._id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        discount: product.discount,
                        finalPrice: finalPrice, // Correctly applies variant pricing
                        stock: product.stock,
                        inStock: product.inStock,
                        isActive: product.isActive,
                        image: product.images && product.images.length > 0
                            ? (product.images.find(img => img.isMain) || product.images[0]).url
                            : null
                    },
                    variant: variant ? {
                        _id: variant._id,
                        size: variant.size,
                        weight: variant.weight,
                        volume: variant.volume,
                        stockQuantity: variant.stockQuantity,
                        priceModifier: variant.priceModifier
                    } : null,
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
