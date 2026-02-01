import React from 'react'
import styles from './ConfirmationPopup.module.css'

/**
 * ConfirmationPopup Component
 * Custom confirmation dialog (not browser default)
 */
function ConfirmationPopup({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPopup
