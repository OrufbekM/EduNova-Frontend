import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import Login from './pages/Auth'
import ClassPage from './pages/ClassPage/ClassPage'
import './App.css'
import ClassManagement from './pages/ClassManagement/ClassManagement'
import { isAuthenticated } from './services/token'

const RequireAuth = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
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
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ClassManagementRoute />} />
        <Route path="/management" element={<ClassManagementRoute />} />
        <Route path="/class/:classId" element={<ClassPageRoute />} />
        <Route
          path="/"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}

export default App
