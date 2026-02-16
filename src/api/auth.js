import apiClient from '../services/api-Client';
import { setToken, deleteToken, isAuthenticated as hasToken } from '../services/token';

const USER_STORAGE_KEY = 'user';

const normalizeUser = (payload = {}) => {
  const user = payload?.user ?? payload ?? {};
  return {
    id: user?.id ?? null,
    email: user?.email ?? '',
    username: user?.username ?? '',
    name: user?.fullName ?? user?.name ?? '',
    fullName: user?.fullName ?? user?.name ?? '',
    phoneNumber: user?.phoneNumber ?? ''
  };
};

const saveUser = (user) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Ignore logout API errors and clear local session anyway.
  }
  deleteToken();
  localStorage.removeItem(USER_STORAGE_KEY);
  return { success: true };
};

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  if (response?.accessToken) {
    setToken(response.accessToken);
  }
  saveUser(normalizeUser(response));
  return { success: true, data: response };
};

export const signup = async (email, username, password, confirmPassword) => {
  const payload = { email, username, password, confirmPassword: confirmPassword || password };
  const response = await apiClient.post('/auth/signup', payload);
  if (response?.accessToken) {
    setToken(response.accessToken);
  }
  saveUser(normalizeUser(response));
  return { success: true, data: response };
};

export const getProfile = async () => {
  const response = await apiClient.get('/auth/profile');
  saveUser(normalizeUser(response));
  return { success: true, data: response };
};

export const updateUserProfile = async (profile) => {
  const payload = {
    username: profile?.username ?? null,
    fullName: profile?.fullName ?? null,
    phoneNumber: profile?.phoneNumber ?? null
  };
  const response = await apiClient.put('/auth/profile', payload);
  const normalized = normalizeUser(response);
  saveUser(normalized);
  return { success: true, data: normalized };
};

export const resetPassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await apiClient.post('/auth/reset-password', {
    currentPassword,
    newPassword,
    confirmPassword: confirmPassword || newPassword
  });
  return { success: true, data: response };
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => hasToken();
