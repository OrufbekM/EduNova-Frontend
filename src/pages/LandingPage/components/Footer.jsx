import React, { useEffect, useRef, useState } from 'react'
import './Footer.css'

const socialLinks = [
  {
    name: 'Twitter',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>,
    href: '#',
  },
  {
    name: 'LinkedIn',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
    href: '#',
  },
  {
    name: 'Instagram',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>,
    href: '#',
  },
]

const contactLinks = [
  {
    name: 'Email',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    href: 'mailto:hello@edunova.io',
    label: 'hello@edunova.io',
  },
  {
    name: 'Support',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    href: '#',
    label: 'Help Center',
  },
]

function Footer({ onShowAuth }) {
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
    <footer className="footer-section" ref={sectionRef}>
      <div className="footer-glow"></div>

      <div className="footer-container">
        <div className={`final-cta ${isVisible ? 'visible' : ''}`}>
          <div className="cta-badge">
            <span className="badge-icon">✨</span>
            <span>Limited Time</span>
          </div>
          <h2 className="cta-title">Free until March — <span className="highlight">take this chance</span></h2>
          <p className="cta-subtitle">Teaching is hard. Tools shouldn't be.</p>
          <button className="btn btn-primary btn-cta" onClick={() => onShowAuth && onShowAuth('signup')}>
            <span>Sign Up Free</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="footer-divider"></div>

        <div className={`footer-content ${isVisible ? 'visible' : ''}`}>
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-text">Edu<span className="logo-highlight">Nova</span></span>
            </div>
            <p className="copyright">© 2025 EduNova. All rights reserved.</p>
          </div>

          <div className="footer-socials">
            <span className="footer-label">Follow Us</span>
            <div className="social-icons">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.href} className="social-link" aria-label={social.name}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-contact">
            <span className="footer-label">Contact</span>
            <div className="contact-links">
              {contactLinks.map((contact) => (
                <a key={contact.name} href={contact.href} className="contact-link">
                  {contact.icon}
                  <span>{contact.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
