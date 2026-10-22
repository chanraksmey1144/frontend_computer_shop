import { createContext, useContext, useEffect, useState } from 'react';
import {
  getCart as getCartApi,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeCartItem as removeCartItemApi,
  clearCart as clearCartApi,
} from '../services/cartService';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setLoading(true);
    try {
      const res = await getCartApi();
      setCart(res.data.data || res.data || { items: [], total: 0, item_count: 0 });
    } catch {
      setCart({ items: [], total: 0, item_count: 0 });
    } finally {
      setLoading(false);
    }
  }

  const addToCart = async (payload) => {
    const res = await addToCartApi(payload);
    await loadCart();
    return res;
  };

  const updateItem = async (itemId, payload) => {
    const res = await updateCartItemApi(itemId, payload);
    await loadCart();
    return res;
  };

  const removeItem = async (itemId) => {
    const res = await removeCartItemApi(itemId);
    await loadCart();
    return res;
  };

  const clearCart = async () => {
    const res = await clearCartApi();
    setCart({ items: [], total: 0, item_count: 0 });
    return res;
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateItem,
    removeItem,
    clearCart,
    refresh: loadCart,
    itemCount: cart.item_count || (cart.items ? cart.items.length : 0),
    cartTotal: cart.total || 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
