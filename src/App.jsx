import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Login from './pages/Auth'
import ClassPage from './pages/ClassPage/ClassPage'
import './App.css'
import ClassManagement from './pages/ClassManagement/ClassManagement'
import { isAuthenticated } from './services/token'
import LandingPage from './pages/LandingPage/LandingPage'

const RequireAuth = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to={{ pathname: '/', search: '?auth=login' }} replace />
  }
  return children
}

const LandingRoute = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const authParam = params.get('auth') === 'signup' ? 'signup' : (params.get('auth') === 'login' ? 'login' : null)
  const showAuth = Boolean(authParam)
  const authMode = authParam || 'login'

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleShowAuth = (mode) => {
    const nextMode = mode === 'signup' ? 'signup' : 'login'
    navigate({ pathname: '/', search: `?auth=${nextMode}` }, { replace: true })
  }

  const handleCloseAuth = () => {
    navigate('/', { replace: true })
  }

  const handleLoginSuccess = () => {
    navigate('/dashboard', { replace: true })
  }

  return (
    <>
      <LandingPage onShowAuth={handleShowAuth} />
      {showAuth && (
        <Login
          initialMode={authMode}
          inline={true}
          onClose={handleCloseAuth}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  )
}

const LoginRedirectRoute = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'
  return <Navigate to={{ pathname: '/', search: `?auth=${mode}` }} replace />
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

const TitleManager = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const pathname = location.pathname
  const authMode = params.get('auth') === 'signup' ? 'signup' : (params.get('auth') === 'login' ? 'login' : null)
  let title = 'EduNova'

  if (pathname === '/') {
    title = authMode === 'signup' ? 'EduNova Sign Up' : (authMode === 'login' ? 'EduNova Login' : 'EduNova')
  } else if (pathname.startsWith('/login')) {
    title = 'EduNova Login'
  } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/management')) {
    title = 'EduNova Class Management'
  } else if (pathname.startsWith('/class/')) {
    title = 'EduNova Class'
  }

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  )
}

function App() {
  return (
    <Router>
      <TitleManager />
      <Routes>
        <Route path="/login" element={<LoginRedirectRoute />} />
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
