import axios from 'axios';
import { getToken, deleteToken } from './token';

const baseURL = import.meta.env.API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data, 
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      // Token expired or invalid
      deleteToken();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return Promise.reject({ message: 'Token expired. Please login again.' });
    }
    
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: 'Network or server error' });
  }
);

export default apiClient;
