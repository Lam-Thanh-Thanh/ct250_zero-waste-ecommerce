import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as cartApi from '../api/cartApi';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({ items: [], totalItems: 0, subtotal: 0 });
    const [loading, setLoading] = useState(false);

    // Load giỏ hàng khi user đăng nhập
    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart({ items: [], totalItems: 0, subtotal: 0 });
            return;
        }
        try {
            setLoading(true);
            const response = await cartApi.getCart();
            if (response.success) {
                setCart(response.data);
            }
        } catch (error) {
            console.error('Fetch cart error:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Thêm sản phẩm vào giỏ
    const addToCart = async (productId, quantity = 1) => {
        try {
            setLoading(true);
            const response = await cartApi.addToCart(productId, quantity);
            if (response.success) {
                setCart(response.data);
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật số lượng
    const updateQuantity = async (productId, quantity) => {
        try {
            setLoading(true);
            const response = await cartApi.updateCartItem(productId, quantity);
            if (response.success) {
                setCart(response.data);
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Xóa sản phẩm
    const removeItem = async (productId) => {
        try {
            setLoading(true);
            const response = await cartApi.removeCartItem(productId);
            if (response.success) {
                setCart(response.data);
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Xóa toàn bộ giỏ hàng
    const clearCartItems = async () => {
        try {
            setLoading(true);
            const response = await cartApi.clearCart();
            if (response.success) {
                setCart({ items: [], totalItems: 0, subtotal: 0 });
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Refresh cart (sau khi checkout)
    const refreshCart = () => {
        setCart({ items: [], totalItems: 0, subtotal: 0 });
    };

    const value = {
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart: clearCartItems,
        refreshCart,
        fetchCart,
        cartItemCount: cart.totalItems || 0
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;
