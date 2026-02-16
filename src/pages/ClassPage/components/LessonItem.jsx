import React, { useState } from 'react'
import { IconFile, IconGrip, IconEdit, IconTrash, IconCheck, IconX } from '../../icons.jsx'
import styles from '../ClassPage.module.css'

function LessonItem({ lesson, onEdit, onRequestDelete, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, dragOverId, depth = 0, onLessonDoubleClick, selectedLessonId }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(lesson.name)
  const [isHovered, setIsHovered] = useState(false)

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(lesson.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(lesson.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const isDragOver = dragOverId === lesson.id
  const isSelected = selectedLessonId === lesson.id

  const handleDoubleClick = () => {
    if (onLessonDoubleClick) {
      onLessonDoubleClick(lesson.id)
    }
  }

  return (
    <div
      className={`${styles.lessonItem} ${isDragOver ? styles.dragOver : ''} ${isSelected ? styles.selected : ''}`}
      data-id={lesson.id}
      style={{ paddingLeft: `${12 + depth * 16}px`, cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => onDragOver(e, lesson.id, 'lesson')}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, lesson.id, 'lesson')}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={styles.lessonHandle}
        draggable={true}
        onDragStart={(e) => onDragStart(e, lesson.id, 'lesson')}
        onDragEnd={onDragEnd}
      >
        <IconGrip size={12} />
      </div>

      <div className={styles.lessonIcon}><IconFile size={14} /></div>

      {isEditing ? (
        <input
          type="text"
          className={styles.lessonEditInput}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span className={styles.lessonName}>{lesson.name}</span>
      )}

      {isHovered && !isEditing && (
        <div className={styles.lessonActions}>
          <button className={styles.lessonActionBtn} onClick={() => setIsEditing(true)}><IconEdit size={12} /></button>
          <button className={`${styles.lessonActionBtn} ${styles.delete}`} onClick={() => onRequestDelete(lesson.id, lesson.name, 'lesson')}><IconTrash size={12} /></button>
        </div>
      )}

      {isEditing && (
        <div className={styles.lessonActions}>
          <button className={`${styles.lessonActionBtn} ${styles.confirm}`} onClick={handleSave}><IconCheck size={12} /></button>
          <button className={`${styles.lessonActionBtn} ${styles.cancel}`} onClick={handleCancel}><IconX size={12} /></button>
        </div>
      )}
    </div>
  )
}

export default LessonItem
