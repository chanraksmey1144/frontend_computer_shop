import api from './api';

export function getBrands(params = {}) {
  return api.get('/brands', { params });
}

export function getBrand(id) {
  return api.get(`/brands/${id}`);
}

export function createBrand(data) {
  return api.post('/brands', data);
}

export function updateBrand(id, data) {
  return api.put(`/brands/${id}`, data);
}

export function deleteBrand(id) {
  return api.delete(`/brands/${id}`);
}
