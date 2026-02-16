import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../services/token'

/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to={{ pathname: '/', search: '?auth=login' }} replace />
  }

  return children
}

export default ProtectedRoute
