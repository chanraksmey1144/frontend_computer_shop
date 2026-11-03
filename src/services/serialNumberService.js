import api from './api';

export function getSerialNumbers(params = {}) {
  return api.get('/product-serial-numbers', { params });
}

export function getSerialNumber(id) {
  return api.get(`/product-serial-numbers/${id}`);
}

export function createSerialNumber(data) {
  return api.post('/product-serial-numbers', data);
}

export function updateSerialNumber(id, data) {
  return api.put(`/product-serial-numbers/${id}`, data);
}

export function deleteSerialNumber(id) {
  return api.delete(`/product-serial-numbers/${id}`);
}
