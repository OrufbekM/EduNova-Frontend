import React, { useState, useEffect } from 'react'
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

const SCROLL_THRESHOLD = 24

function Navbar({ onShowAuth }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    handleScroll() // init state
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
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
