import api from './api';

export function createAbaPayWayPayment(orderId) {
  return api.post(`/orders/${orderId}/payments/aba`);
}

export function getAbaPayWayPaymentStatus(paymentId) {
  return api.get(`/payments/aba/${paymentId}/status`);
}
