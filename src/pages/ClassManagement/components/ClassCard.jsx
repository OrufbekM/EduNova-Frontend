import React, { useState } from 'react'
import { IconGrip, IconEdit, IconTrash, IconCheck, IconX } from '../../icons.jsx'

function ClassCard({ cls, index, categoryId, onEdit, onRequestDelete, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, dragOverTarget, onClassDoubleClick }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(cls.name)

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(categoryId, cls.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(cls.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const handleDoubleClick = () => {
    if (onClassDoubleClick && !isEditing) {
      onClassDoubleClick(cls.id)
    }
  }

  const isDragOver = dragOverTarget?.classId === cls.id

  return (
    <div
      className={`class-card ${isDragOver ? 'drag-over' : ''} ${isEditing ? 'editing' : ''}`}
      data-id={cls.id}
      draggable={false}
      onDragOver={(e) => onDragOver(e, categoryId, cls.id, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, categoryId, index)}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="class-card-handle-index">
        <div className="class-card-index">{index + 1}</div>
        <div
          className="class-card-handle"
          draggable={true}
          onDragStart={(e) => onDragStart(e, categoryId, cls.id, index)}
          onDragEnd={onDragEnd}
        >
          <IconGrip size={14} />
        </div>
      </div>

      <div className="class-card-content">
        {isEditing ? (
          <input
            type="text"
            className="class-card-edit-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <>
            <div className="class-card-name">{cls.name}</div>
            <div className="class-card-desc">{cls.description}</div>
          </>
        )}
      </div>

      <div className="class-card-actions">
        {isEditing ? (
          <>
            <button className="class-card-btn confirm" onClick={handleSave}>
              <IconCheck size={14} />
            </button>
            <button className="class-card-btn cancel" onClick={handleCancel}>
              <IconX size={14} />
            </button>
          </>
        ) : (
          <>
            <button className="class-card-btn edit" onClick={() => setIsEditing(true)}>
              <IconEdit size={14} />
            </button>
            <button className="class-card-btn delete" onClick={() => onRequestDelete('class', categoryId, cls.id, cls.name)}>
              <IconTrash size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ClassCard
