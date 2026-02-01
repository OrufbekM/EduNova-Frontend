import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../demoBackend/loginService'

/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login page
    return <Navigate to="/login" replace />
  }

  // User is authenticated, render the protected component
  return children
}

export default ProtectedRoute
