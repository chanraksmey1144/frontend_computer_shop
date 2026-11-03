import api from './api';

export function getInventoryMovements(params = {}) {
  return api.get('/inventory-movements', { params });
}

export function getInventoryMovement(id) {
  return api.get(`/inventory-movements/${id}`);
}

export function createInventoryMovement(data) {
  return api.post('/inventory-movements', data);
}
