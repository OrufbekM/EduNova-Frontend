import React, { useState } from 'react'
import { FileText, GripVertical, Pencil, Trash2, Check, X } from 'lucide-react'

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

  const handleClick = () => {
    if (onLessonDoubleClick) {
      onLessonDoubleClick(lesson.id)
    }
  }

  return (
    <div
      className={`lesson-item ${isDragOver ? 'drag-over' : ''} ${isSelected ? 'selected' : ''}`}
      data-id={lesson.id}
      style={{ paddingLeft: `${12 + depth * 16}px`, cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => onDragOver(e, lesson.id, 'lesson')}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, lesson.id, 'lesson')}
      onClick={handleClick}
    >
      <div
        className="lesson-handle"
        draggable={true}
        onDragStart={(e) => onDragStart(e, lesson.id, 'lesson')}
        onDragEnd={onDragEnd}
      >
        <GripVertical size={12} />
      </div>

      <div className="lesson-icon"><FileText size={14} /></div>

      {isEditing ? (
        <input
          type="text"
          className="lesson-edit-input"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span className="lesson-name">{lesson.name}</span>
      )}

      {isHovered && !isEditing && (
        <div className="lesson-actions">
          <button className="lesson-action-btn" onClick={() => setIsEditing(true)}><Pencil size={12} /></button>
          <button className="lesson-action-btn delete" onClick={() => onRequestDelete(lesson.id, lesson.name, 'lesson')}><Trash2 size={12} /></button>
        </div>
      )}

      {isEditing && (
        <div className="lesson-actions">
          <button className="lesson-action-btn confirm" onClick={handleSave}><Check size={12} /></button>
          <button className="lesson-action-btn cancel" onClick={handleCancel}><X size={12} /></button>
        </div>
      )}
    </div>
  )
}

export default LessonItem
