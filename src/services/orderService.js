import api from './api';

export function createOrder(payload) {
  return api.post('/orders', payload);
}

export function getOrders(params = {}) {
  return api.get('/orders', { params });
}

export function getOrder(id) {
  return api.get(`/orders/${id}`);
}

export function updateOrderStatus(id, data) {
  return api.patch(`/orders/${id}/status`, data);
}
