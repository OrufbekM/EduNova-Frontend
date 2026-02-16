import React from 'react'
import { IconX } from '../../icons.jsx'
import styles from '../ClassPage.module.css'

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className={styles.cpModalOverlay} onClick={onCancel}>
      <div className={styles.cpModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cpModalHeader}>
          <h2 className={styles.cpModalTitle}>{title}</h2>
          <button className={styles.cpModalClose} onClick={onCancel}>
            <IconX size={18} />
          </button>
        </div>
        <div className={styles.cpModalBody}>
          <p className={styles.cpModalMessage}>{message}</p>
        </div>
        <div className={styles.cpModalFooter}>
          <button className={`${styles.cpModalBtn} ${styles.cpModalBtnCancel}`} onClick={onCancel}>Cancel</button>
          <button className={`${styles.cpModalBtn} ${styles.cpModalBtnDelete}`} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
