import { useState } from 'react'
import apiClient from '../services/api-Client'

export const useClass = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createClass = async (name, categoryId, description = '') => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.post('/class/create', { 
        name, 
        categoryId,
        description 
      })
      setLoading(false)
      return response
    } catch (err) {
      setError(err.message || 'Failed to create class')
      setLoading(false)
      throw err
    }
  }

  const getClasses = async () => {
    setLoading(true)
    setError(null)
    console.log('Fetching classes from:', '/class')
    try {
      const response = await apiClient.get('/class')
      console.log('Classes response:', response)
      setLoading(false)
      return response
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError(err.message || 'Failed to fetch classes')
      setLoading(false)
      throw err
    }
  }

  const updateClass = async (id, name, categoryId, description = '') => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.put(`/class/${id}/update`, { 
        name, 
        categoryId,
        description
      })
      setLoading(false)
      return response
    } catch (err) {
      setError(err.message || 'Failed to update class')
      setLoading(false)
      throw err
    }
  }

  const deleteClass = async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.delete(`/class/${id}/delete`)
      setLoading(false)
      return response
    } catch (err) {
      setError(err.message || 'Failed to delete class')
      setLoading(false)
      throw err
    }
  }

  return {
    getClasses,
    createClass,
    updateClass,
    deleteClass,
    loading,
    error
  }
}
