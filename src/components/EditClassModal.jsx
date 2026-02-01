import React, { useState, useEffect } from 'react'
import styles from './EditClassModal.module.css'

/**
 * EditClassModal Component
 * Custom modal for editing class name and description (not browser default)
 */
function EditClassModal({ classData, categories, currentCategoryId, onSave, onCancel }) {
  const [className, setClassName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  // Set initial values when classData changes
  useEffect(() => {
    if (classData) {
      setClassName(classData.name || '')
      setDescription(classData.description || '')
    }
    if (currentCategoryId) {
      setSelectedCategoryId(currentCategoryId)
    }
  }, [classData, currentCategoryId])

  // Handle save
  const handleSave = () => {
    if (className.trim() && selectedCategoryId) {
      onSave({
        name: className.trim(),
        description: description.trim(),
        categoryId: selectedCategoryId
      })
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setClassName('')
    setDescription('')
    onCancel()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Edit Class</h2>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Category</label>
          <select
            className={styles.select}
            value={selectedCategoryId || ''}
            onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
          >
            {categories && categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Class Name</label>
          <input
            type="text"
            className={styles.input}
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Enter class name"
            autoFocus
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter class description"
            rows="4"
          />
        </div>

        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={!className.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditClassModal
