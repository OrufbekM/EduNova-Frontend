import apiClient from '../services/api-Client';
import { setToken, deleteToken } from '../services/token';

export const logout = async () => {
  await apiClient.post('/auth/logout');
  deleteToken();
  return { success: true };
};

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  if (response?.accessToken) {
    setToken(response.accessToken);
  }
  return { success: true, data: response };
};

export const signup = async (email, password, confirmPassword) => {
  const response = await apiClient.post('/auth/signup', { email, password, confirmPassword });
  if (response?.accessToken) {
    setToken(response.accessToken);
  }
  return { success: true, data: response };
};
