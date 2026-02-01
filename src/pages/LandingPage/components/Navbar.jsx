import React from 'react'
import ThemeToggle from '../../assets/ThemeToggle'
import './Navbar.css'

function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon"></div>
      <span className="logo-text">Edu<span className="logo-highlight">Nova</span></span>
    </div>
  )
}

function Navbar({ onShowAuth }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Logo />
        <div className="navbar-actions">
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={() => onShowAuth && onShowAuth('login')}>Login</button>
          <button className="btn btn-primary" onClick={() => onShowAuth && onShowAuth('signup')}>Sign Up</button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
