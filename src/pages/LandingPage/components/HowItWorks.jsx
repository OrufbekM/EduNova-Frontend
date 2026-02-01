import React, { useEffect, useRef, useState } from 'react'
import './HowItWorks.css'

const steps = [
  { number: '01', title: 'Create a class in Class Management', description: 'Set up your classes with ease and organize your teaching workflow.' },
  { number: '02', title: 'Open the lesson builder', description: 'Access our intuitive lesson builder designed for educators.' },
  { number: '03', title: 'Enjoy AI assistance and focus on teaching', description: 'Let AI handle the heavy lifting while you focus on what matters.' },
]

function StepCard({ step, index, isVisible }) {
  return (
    <div className={`step-card ${isVisible ? 'visible' : ''}`} style={{ animationDelay: `${index * 200}ms` }}>
      <div className="step-number"><span>{step.number}</span></div>
      <div className="step-content">
        <h3 className="step-title">{step.title}</h3>
        <p className="step-description">{step.description}</p>
      </div>
    </div>
  )
}

function HowItWorks() {
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
    <section className="how-section" ref={sectionRef}>
      <div className="how-background">
        <div className="grid-pattern"></div>
      </div>

      <div className="how-container">
        <div className={`how-header ${isVisible ? 'visible' : ''}`}>
          <span className="section-label">How It Works</span>
          <h2 className="how-title">No complication.<br /><span className="highlight">Just teaching.</span></h2>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
