import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import Login from './pages/Auth'
import ClassPage from './pages/ClassPage/ClassPage'
import './App.css'
import ClassManagement from './pages/ClassManagement/ClassManagement'
import { isAuthenticated } from './services/token'
import LandingPage from './pages/LandingPage/LandingPage'

const RequireAuth = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return children
}

const LoginRoute = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login'

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  return <Login initialMode={initialMode} />
}

const LandingRoute = () => {
  const navigate = useNavigate()
  return (
    <LandingPage
      onShowAuth={(mode) => {
        const nextMode = mode === 'signup' ? 'signup' : 'login'
        navigate(`/login?mode=${nextMode}`)
      }}
    />
  )
}

const ClassPageRoute = () => {
  const { classId } = useParams()
  const navigate = useNavigate()

  return (
    <RequireAuth>
      <ClassPage
        classId={classId}
        onNavigate={(path) => navigate(path)}
      />
    </RequireAuth>
  )
}

const ClassManagementRoute = () => {
  const navigate = useNavigate()
  return (
    <RequireAuth>
      <ClassManagement
        onClassDoubleClick={(classId) => navigate(`/class/${classId}`)}
        onNavigate={(path) => navigate(path)}
      />
    </RequireAuth>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/dashboard" element={<ClassManagementRoute />} />
        <Route path="/management" element={<ClassManagementRoute />} />
        <Route path="/class/:classId" element={<ClassPageRoute />} />
        <Route path="/" element={<LandingRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}

export default App
