import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart as getCartApi,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeCartItem as removeCartItemApi,
  clearCart as clearCartApi,
} from '../services/cartService';

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  item_count: 0,
  subtotal: 0,
  discount: 0,
  delivery_fee: 0,
  total: 0,
};

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function sync() {
      setLoading(true);
      try {
        const res = await getCartApi();
        if (!cancelled) {
          setCart(res.data.data || res.data || EMPTY_CART);
        }
      } catch {
        if (!cancelled) setCart(EMPTY_CART);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  async function loadCart() {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    try {
      const res = await getCartApi();
      setCart(res.data.data || res.data || EMPTY_CART);
    } catch {
      setCart(EMPTY_CART);
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
    setCart(EMPTY_CART);
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
    itemCount: cart.item_count ?? (cart.items ? cart.items.length : 0),
    cartTotal: cart.total ?? 0,
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
