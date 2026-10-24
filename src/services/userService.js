import api from './api';

export function getAddresses(params = {}) {
  return api.get('/user/addresses', { params });
}

export function createAddress(data) {
  return api.post('/user/addresses', data);
}

export function updateAddress(id, data) {
  return api.put(`/user/addresses/${id}`, data);
}

export function deleteAddress(id) {
  return api.delete(`/user/addresses/${id}`);
}
