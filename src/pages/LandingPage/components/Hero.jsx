import React, { useEffect, useState } from 'react'
import './Hero.css'
import { ArrowRight } from 'lucide-react'

function FloatingShapes() {
  return (
    <div className="floating-shapes">
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
      <div className="shape shape-4"></div>
    </div>
  )
}

function Hero({ onShowAuth }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="hero">
      <FloatingShapes />
      <div className="hero-gradient"></div>

      <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
        <div className="mvp-badge">
          <span className="badge-dot"></span>
          <span>MVP Version — Big updates coming weekly</span>
        </div>

        <h1 className="hero-title">
          Create professional lessons<br />
          with <span className="highlight">AI</span> — in minutes
        </h1>

        <p className="hero-subtitle">Everything you need to teach smarter, faster</p>
        <p className="hero-support">This is just our MVP — big updates are coming week by week</p>

        <div className="hero-buttons">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => onShowAuth && onShowAuth('signup')}
          >
            <span>Sign Up Free</span>
            <ArrowRight size={20} />
          </button>
          <button 
            className="btn btn-secondary btn-large"
            onClick={() => onShowAuth && onShowAuth('login')}
          >
            Login
          </button>
        </div>
      </div>

      <div className="scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span>Scroll to explore</span>
      </div>
    </section>
  )
}

export default Hero
