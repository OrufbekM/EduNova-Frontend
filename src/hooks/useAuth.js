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
      const response = await apiClient.post('/auth/signup', {
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
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });
      
      console.log('API Response:', response);
      console.log('Response accessToken:', response.accessToken);
      
      if (response.accessToken) {
        setToken(response.accessToken);
        setSuccess('Login successful!');
        console.log('Token saved to localStorage');
      } else {
        console.error('No accessToken found in response');
      }
      
      return response;
    } catch (err) {
      console.error('Login error:', err);
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
      await apiClient.post('/auth/logout');
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
