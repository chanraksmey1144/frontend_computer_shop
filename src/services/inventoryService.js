import api from './api';

export function getInventory(params = {}) {
  return api.get('/inventory', { params });
}

export function adjustInventory(id, data) {
  return api.patch(`/inventory/${id}`, data);
}
