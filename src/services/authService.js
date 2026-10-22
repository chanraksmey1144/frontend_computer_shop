import api, { setAccessToken } from './api';

export function login(credentials) {
  return api.post('/login', credentials);
}

export function register(data) {
  return api.post('/register', data);
}

export function sendOtp(payload) {
  return api.post('/otp/send', payload);
}

export function verifyOtp(payload) {
  return api.post('/otp/verify', payload);
}

export function forgotPassword(data) {
  return api.post('/password/email', data);
}

export function resetPassword(data) {
  return api.post('/password/reset', data);
}

export function logout() {
  return api.post('/logout').finally(() => {
    setAccessToken(null);
    localStorage.removeItem('auth_token');
  });
}

export function getProfile() {
  return api.get('/user');
}

export function updateProfile(data) {
  return api.put('/user', data);
}

export function changePassword(data) {
  return api.post('/user/password', data);
}
