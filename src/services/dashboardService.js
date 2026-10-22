import api from './api';

export function getDashboardMetrics() {
  return api.get('/admin/dashboard');
}

export function getAdminOrders(params = {}) {
  return api.get('/admin/orders', { params });
}

export function getAdminProducts(params = {}) {
  return api.get('/admin/products', { params });
}

export function getAdminCustomers(params = {}) {
  return api.get('/admin/customers', { params });
}
