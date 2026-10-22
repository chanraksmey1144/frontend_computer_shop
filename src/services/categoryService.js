import api from './api';

export function getCategories(params = {}) {
  return api.get('/categories', { params });
}

export function getCategory(id) {
  return api.get(`/categories/${id}`);
}

export function createCategory(data) {
  return api.post('/categories', data);
}

export function updateCategory(id, data) {
  return api.put(`/categories/${id}`, data);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`);
}
