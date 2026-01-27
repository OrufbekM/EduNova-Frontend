import { useState, useCallback } from 'react';
import apiClient from '../services/api-Client';
import { setToken, deleteToken, isAuthenticated } from '../services/token';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const signup = useCallback(async (email, password, confirmPassword) => {
    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiClient.post('/api/auth/signup', {
        email,
        password,
        confirmPassword
      });
      
      setSuccess('Account created successfully! You can now login.');
      return response;
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      });
      
      if (response.token) {
        setToken(response.token);
        setSuccess('Login successful!');
      }
      
      return response;
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  const logout = useCallback(async () => {
    setLoading(true);
    clearMessages();
    
    try {
      await apiClient.post('/api/auth/logout');
      deleteToken();
      setSuccess('Logged out successfully');
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  return {
    signup,
    login,
    logout,
    loading,
    error,
    success,
    clearMessages,
    isAuthenticated: isAuthenticated()
  };
};
