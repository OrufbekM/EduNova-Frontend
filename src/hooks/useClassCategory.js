import { useState } from 'react'
import apiClient from '../services/api-Client'

export const useClassCategory = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/class-category')
      setLoading(false)
      return response?.data ?? response
    } catch (err) {
      setError(err.message || 'Failed to fetch categories')
      setLoading(false)
      throw err
    }
  }

  const createCategory = async (name) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.post('/class-category/create', { name })
      setLoading(false)
      return response?.data ?? response
    } catch (err) {
      setError(err.message || 'Failed to create category')
      setLoading(false)
      throw err
    }
  }

  const updateCategory = async (id, name) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.put(`/class-category/${id}/update`, { name })
      setLoading(false)
      return response?.data ?? response
    } catch (err) {
      setError(err.message || 'Failed to update category')
      setLoading(false)
      throw err
    }
  }

  const deleteCategory = async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.delete(`/class-category/${id}/delete`)
      setLoading(false)
      return response?.data ?? response
    } catch (err) {
      setError(err.message || 'Failed to delete category')
      setLoading(false)
      throw err
    }
  }

  return {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error
  }
}
