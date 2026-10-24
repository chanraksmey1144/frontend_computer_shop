import api from './api';

export function getWarehouses(params = {}) {
  return api.get('/warehouses', { params });
}

export function createWarehouse(data) {
  return api.post('/warehouses', data);
}

export function updateWarehouse(id, data) {
  return api.put(`/warehouses/${id}`, data);
}

export function deleteWarehouse(id) {
  return api.delete(`/warehouses/${id}`);
}
