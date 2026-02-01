import React from 'react'
import ClassCard from './ClassCard'
import styles from './ClassCategory.module.css'

/**
 * ClassCategory Component
 * Displays a category with its classes
 * Supports drag and drop of classes into this category
 */
function ClassCategory({ 
  category, 
  onEditCategory, 
  onDeleteCategory, 
  onEditClass, 
  onDeleteClass,
  onMoveClass,
  draggedClass,
  onDropClass
}) {
  const [isDragOver, setIsDragOver] = React.useState(false)

  // Handle drag over - show drop indicator
  const handleDragOver = (e) => {
    if (draggedClass) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)
      e.currentTarget.classList.add(styles.dragOver)
    }
  }

  // Handle drag leave - remove drop indicator
  const handleDragLeave = (e) => {
    // Only remove if we're actually leaving the category container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
      e.currentTarget.classList.remove(styles.dragOver)
    }
  }

  // Handle drop - move class to this category
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    e.currentTarget.classList.remove(styles.dragOver)
    
    // Get class data from drag data
    try {
      const classData = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (onDropClass) {
        onDropClass(category.id, classData)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  return (
    <div 
      className={styles.categoryCard}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Category header */}
      <div className={styles.categoryHeader}>
        {/* Only show edit/delete buttons if category is not "Uncategorized" */}
        {category.name !== 'Uncategorized' && (
          <div className={styles.categoryActions}>
            <button 
              className={styles.editBtn}
              onClick={() => onEditCategory(category)}
              title="Edit category"
            >
              ✏️
            </button>
            <button 
              className={styles.deleteBtn}
              onClick={() => onDeleteCategory(category)}
              title="Delete category"
            >
              🗑️
            </button>
          </div>
        )}
        <h2 className={styles.categoryName}>{category.name}</h2>
      </div>

      {/* Drop indicator text - only show when dragging over this category */}
      {isDragOver && draggedClass && (
        <div className={styles.dropIndicator}>
          Drop here
        </div>
      )}

      {/* Classes container */}
      <div className={styles.classesContainer}>
        {console.log('Category:', category.name, 'Classes:', category.classes)}
        {category.classes && category.classes.length > 0 ? (
          category.classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classData={classItem}
              onEdit={onEditClass}
              onDelete={onDeleteClass}
              onMoveStart={onMoveClass}
              draggedClass={draggedClass}
            />
          ))
        ) : (
          <div className={styles.emptyCategory}>
            No classes in this category
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassCategory
