import api from './api';

export function getProducts(params = {}) {
  return api.get('/products', { params });
}

export function getProduct(id) {
  return api.get(`/products/${id}`);
}

export function createProduct(data) {
  return api.post('/products', data);
}

export function updateProduct(id, data) {
  return api.put(`/products/${id}`, data);
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}

export function getProductImages(productId) {
  return api.get(`/products/${productId}/images`);
}

export function getProductVariants(productId, params = {}) {
  return api.get(`/products/${productId}/variants`, { params });
}
