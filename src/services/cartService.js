import api from './api';

export function getCart() {
  return api.get('/cart');
}

export function addToCart(payload) {
  return api.post('/cart/items', payload);
}

export function updateCartItem(itemId, payload) {
  return api.patch(`/cart/items/${itemId}`, payload);
}

export function removeCartItem(itemId) {
  return api.delete(`/cart/items/${itemId}`);
}

export function clearCart() {
  return api.delete('/cart');
}
