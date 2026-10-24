import api from './api';

export function getInventory(params = {}) {
  return api.get('/inventories', { params });
}

export function createInventory(data) {
  return api.post('/inventories', data);
}

export function adjustInventory(id, data) {
  return api.patch(`/inventories/${id}`, data);
}
