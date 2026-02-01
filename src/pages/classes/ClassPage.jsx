import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './ClassPage.module.css'

/**
 * ClassPage Component
 * Generic page for displaying individual class content
 * Dynamically loads based on class name from URL
 */
function ClassPage() {
  const { className } = useParams()
  const navigate = useNavigate()

  // Convert URL parameter back to display name
  const displayName = className
    ? className.replace(/([A-Z])/g, ' $1').trim()
    : 'Class'

  return (
    <div className={styles.classPage}>
      <button 
        className={styles.backBtn}
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>
      
      <div className={styles.content}>
        <h1 className={styles.classTitle}>{displayName}</h1>
        <p className={styles.classDescription}>
          This is the dedicated page for {displayName}.
        </p>
      </div>
    </div>
  )
}

export default ClassPage
