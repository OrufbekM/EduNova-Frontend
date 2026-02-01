import React, { useState, useEffect } from 'react'
import styles from './EditCategoryModal.module.css'

/**
 * EditCategoryModal Component
 * Custom modal for editing category name (not browser default)
 */
function EditCategoryModal({ category, onSave, onCancel }) {
  const [categoryName, setCategoryName] = useState('')

  // Set initial value when category changes
  useEffect(() => {
    if (category) {
      setCategoryName(category.name || '')
    }
  }, [category])

  // Handle save
  const handleSave = () => {
    if (categoryName.trim()) {
      onSave(categoryName.trim())
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setCategoryName('')
    onCancel()
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Edit Category</h2>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Category Name</label>
          <input
            type="text"
            className={styles.input}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter category name"
            autoFocus
          />
        </div>

        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={!categoryName.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditCategoryModal
