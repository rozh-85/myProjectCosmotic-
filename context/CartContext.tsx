
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ProductVariant } from '../types';

interface CartContextType {
    cart: CartItem[];
    addToBag: (product: Product, selectedVariants?: ProductVariant[]) => void;
    removeFromCart: (productId: string, variantIds?: string) => void;
    updateQuantity: (productId: string, delta: number, variantIds?: string) => void;
    cartCount: number;
    cartTotal: number;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Initialize from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('luxe_cart');
        if (saved) {
            try {
                setCart(JSON.parse(saved));
            } catch (e) {
                console.error("Cart init error", e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }, [cart]);

    const addToBag = (product: Product, variants?: ProductVariant[]) => {
        const variantIds = variants?.map(v => v.id).sort().join(',') || '';

        setCart(prev => {
            const existing = prev.find(item =>
                item.product.id === product.id &&
                (item.selectedVariants?.map(v => v.id).sort().join(',') || '') === variantIds
            );

            if (existing) {
                return prev.map(item =>
                    (item.product.id === product.id && (item.selectedVariants?.map(v => v.id).sort().join(',') || '') === variantIds)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1, selectedVariants: variants }];
        });
    };

    const removeFromCart = (productId: string, variantIds: string = '') => {
        setCart(prev => prev.filter(item =>
            !(item.product.id === productId && (item.selectedVariants?.map(v => v.id).sort().join(',') || '') === variantIds)
        ));
    };

    const updateQuantity = (productId: string, delta: number, variantIds: string = '') => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId && (item.selectedVariants?.map(v => v.id).sort().join(',') || '') === variantIds) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartTotal = cart.reduce((sum, item) => {
        const variantTotal = (item.selectedVariants || []).reduce((s, v) => s + (v.price_override || 0), 0);
        return sum + ((item.product.price + variantTotal) * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{ cart, addToBag, removeFromCart, updateQuantity, cartCount, cartTotal, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
