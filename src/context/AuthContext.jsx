import { createContext, useContext, useEffect, useState } from 'react';
import { setAccessToken } from '../services/api';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getProfile as getProfileApi,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setAccessToken(token || null);
    if (token) {
      getProfileApi()
        .then((res) => setUser(res.data.data || res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleLogout = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('auth_token');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    const data = res.data.data || res.data;
    setAccessToken(data.token || data.access_token || data.accessToken);
    if (data.token || data.access_token || data.accessToken) {
      localStorage.setItem('auth_token', data.token || data.access_token || data.accessToken);
    }
    setUser(data.user || null);
    return res;
  };

  const register = async (data) => {
    const res = await registerApi(data);
    const d = res.data.data || res.data;
    if (d.token || d.access_token || d.accessToken) {
      setAccessToken(d.token || d.access_token || d.accessToken);
      localStorage.setItem('auth_token', d.token || d.access_token || d.accessToken);
    }
    setUser(d.user || null);
    return res;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('auth_token');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user && user.role && user.role.name === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
