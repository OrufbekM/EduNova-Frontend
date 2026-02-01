import React, { useState } from 'react'
import { Folder, FolderOpen, ChevronRight, ChevronDown, GripVertical, Pencil, Trash2, Check, X } from 'lucide-react'
import LessonItem from './LessonItem'

function FolderItem({ folder, onEdit, onRequestDelete, onEditLesson, onRequestDeleteLesson, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, dragOverId, onLessonDoubleClick, selectedLessonId }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const [isHovered, setIsHovered] = useState(false)

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(folder.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(folder.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const isDragOver = dragOverId === folder.id

  return (
    <div className="folder-wrapper">
      <div
        className={`folder-item ${isDragOver ? 'drag-over' : ''}`}
        data-id={folder.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => onDragOver(e, folder.id, 'folder')}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, folder.id, 'folder')}
        onClick={(e) => {
          // Don't toggle if clicking on action buttons, edit input, drag handle, or toggle button
          if (e.target.closest('.folder-actions') || 
              e.target.closest('.folder-edit-input') || 
              e.target.closest('.folder-handle') ||
              e.target.closest('.folder-toggle')) {
            return
          }
          setIsOpen(!isOpen)
        }}
        style={{ cursor: 'pointer' }}
      >
        <div
          className="folder-handle"
          draggable={true}
          onDragStart={(e) => onDragStart(e, folder.id, 'folder')}
          onDragEnd={onDragEnd}
        >
          <GripVertical size={12} />
        </div>

        <div className="folder-icon">
          {isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
        </div>

        <button className="folder-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {isEditing ? (
          <input
            type="text"
            className="folder-edit-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className="folder-name">{folder.name}</span>
        )}

        {isHovered && !isEditing && (
          <div className="folder-actions">
            <button className="folder-action-btn" onClick={() => setIsEditing(true)}><Pencil size={12} /></button>
            <button className="folder-action-btn delete" onClick={() => onRequestDelete(folder.id, folder.name, 'folder')}><Trash2 size={12} /></button>
          </div>
        )}

        {isEditing && (
          <div className="folder-actions">
            <button className="folder-action-btn confirm" onClick={handleSave}><Check size={12} /></button>
            <button className="folder-action-btn cancel" onClick={handleCancel}><X size={12} /></button>
          </div>
        )}
      </div>

      {isOpen && (
        <div 
          className={`folder-children ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDragOver(e, folder.id, 'folder')
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDrop(e, folder.id, 'folder')
          }}
        >
          {folder.lessons && folder.lessons.length > 0 ? (
            folder.lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                depth={1}
                onEdit={onEditLesson}
                onRequestDelete={onRequestDeleteLesson}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                dragOverId={dragOverId}
                onLessonDoubleClick={onLessonDoubleClick}
                selectedLessonId={selectedLessonId}
              />
            ))
          ) : (
            <div className="folder-empty">Drop lessons here</div>
          )}
        </div>
      )}
    </div>
  )
}

export default FolderItem
