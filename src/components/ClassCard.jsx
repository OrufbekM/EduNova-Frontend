import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ClassCard.module.css'

/**
 * ClassCard Component
 * Displays a single class card with name, description, and action buttons
 * Supports drag and drop functionality via move button only
 */
function ClassCard({ classData, onEdit, onDelete, onMoveStart, draggedClass }) {
  const navigate = useNavigate()

  // Handle click on class card - navigate to class page
  const handleCardClick = () => {
    navigate(`/class/${classData.id}`)
  }

  // Handle move button drag start - only move button can drag
  const handleMoveDragStart = (e) => {
    e.stopPropagation() // Prevent card click
    // Set the dragged class data
    onMoveStart(classData)
    // Set drag data
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(classData))
    // Make the card appear dragged
    e.currentTarget.closest(`.${styles.classCard}`).style.opacity = '0.5'
  }

  // Handle drag end - reset opacity
  const handleDragEnd = (e) => {
    e.currentTarget.closest(`.${styles.classCard}`).style.opacity = '1'
  }

  // Handle edit button click
  const handleEditClick = (e) => {
    e.stopPropagation() // Prevent card click
    onEdit(classData)
  }

  // Handle delete button click
  const handleDeleteClick = (e) => {
    e.stopPropagation() // Prevent card click
    onDelete(classData)
  }

  // Check if this card is being dragged
  const isDragging = draggedClass && draggedClass.id === classData.id

  return (
    <div 
      className={`${styles.classCard} ${isDragging ? styles.dragging : ''}`}
      onClick={handleCardClick}
    >
      {/* Action buttons container - hide edit/delete for "Demo class" */}
      <div className={styles.actionButtons}>
        {classData.name !== 'Demo class' && (
          <>
            <button 
              className={styles.editBtn}
              onClick={handleEditClick}
              title="Edit class"
            >
              ✏️
            </button>
            <button 
              className={styles.deleteBtn}
              onClick={handleDeleteClick}
              title="Delete class"
            >
              🗑️
            </button>
          </>
        )}
        <button 
          className={styles.moveBtn}
          draggable="true"
          onDragStart={handleMoveDragStart}
          onDragEnd={handleDragEnd}
          title="Move class (drag this button)"
        >
          ⚡
        </button>
      </div>

      {/* Class content */}
      <div className={styles.classContent}>
        <h3 className={styles.className}>{classData.name}</h3>
        <p className={styles.classDescription}>{classData.description}</p>
      </div>
    </div>
  )
}

export default ClassCard
