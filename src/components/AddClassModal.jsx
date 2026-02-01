import React, { useState } from 'react'
import styles from './AddClassModal.module.css'

/**
 * AddClassModal Component
 * Custom modal for adding a new class (not browser default)
 */
function AddClassModal({ categories, onSave, onCancel }) {
  const [className, setClassName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  // Set default category to first category or Uncategorized
  React.useEffect(() => {
    if (categories && categories.length > 0) {
      const uncategorized = categories.find(cat => cat.name === 'Uncategorized')
      setSelectedCategoryId(uncategorized ? uncategorized.id : categories[0].id)
    }
  }, [categories])

  // Handle save
  const handleSave = () => {
    if (className.trim() && selectedCategoryId) {
      onSave({
        name: className.trim(),
        description: description.trim(),
        categoryId: selectedCategoryId
      })
      // Reset form
      setClassName('')
      setDescription('')
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
        <h2 className={styles.title}>Add New Class</h2>
        
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
            Add Class
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddClassModal
