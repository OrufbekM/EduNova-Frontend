import React, { useEffect, useRef, useState } from 'react'
import './WhyEduBoard.css'

const features = [
  {
    id: 1,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'AI-Powered Lesson Creation',
    description: 'Create structured, professional lessons in minutes using AI assistance — or manually — with a super compatible and intuitive UI/UX.',
  },
  {
    id: 2,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0" />
        <path d="M12 13v3" />
        <path d="M9 19h6" />
      </svg>
    ),
    title: 'Educator-First Design',
    description: 'Built specifically for teachers — clean, focused, and distraction-free.',
  },
  {
    id: 3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    title: 'One Place for Everything',
    description: 'Lessons, structure, and clarity — no more scattered documents.',
  },
]

function FeatureCard({ feature, index, isVisible }) {
  return (
    <div className={`feature-card ${isVisible ? 'visible' : ''}`} style={{ animationDelay: `${index * 150}ms` }}>
      <div className="card-glow"></div>
      <div className="feature-icon">{feature.icon}</div>
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-description">{feature.description}</p>
      <div className="card-shine"></div>
    </div>
  )
}

function WhyEduBoard() {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true)
    }, { threshold: 0.2 })

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="why-section" ref={sectionRef}>
      <div className="why-container">
        <div className={`section-header ${isVisible ? 'visible' : ''}`}>
          <span className="section-label">Why EduBoard</span>
          <h2 className="section-title">
            We're working closely with teachers and education centers to shape the future of <span className="highlight">EduBoard</span>.
          </h2>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} isVisible={isVisible} />
          ))}
        </div>

        <div className={`callout-cta ${isVisible ? 'visible' : ''}`}>
          <div className="callout-content">
            <p className="callout-text">Get started free — no credit card needed</p>
            <button className="btn btn-outline">
              Start Teaching
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyEduBoard
