import api from './api';

export function getCoupons(params = {}) {
  return api.get('/coupons', { params });
}

export function getCoupon(id) {
  return api.get(`/coupons/${id}`);
}

export function createCoupon(data) {
  return api.post('/coupons', data);
}

export function updateCoupon(id, data) {
  return api.put(`/coupons/${id}`, data);
}

export function deleteCoupon(id) {
  return api.delete(`/coupons/${id}`);
}

export function validateCoupon(payload) {
  return api.post('/coupons/validate', payload);
}
