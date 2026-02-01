import React, { useState } from 'react'
import { Plus, Folder, X, Check, PanelLeft, Settings, Home } from 'lucide-react'
import ThemeToggle from '../../assets/ThemeToggle'
import FolderItem from './FolderItem'
import LessonItem from './LessonItem'

function Sidebar({ 
  isOpen, 
  onToggle, 
  items, 
  onAddLesson, 
  onAddFolder, 
  onEditFolder, 
  onEditLesson, 
  onRequestDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverId,
  onLessonDoubleClick,
  selectedLessonId,
  onNavigate
}) {
  const [addingType, setAddingType] = useState(null) // 'lesson' | 'folder' | null
  const [newName, setNewName] = useState('')

  const handleConfirmAdd = () => {
    if (newName.trim()) {
      if (addingType === 'lesson') {
        onAddLesson(newName.trim())
      } else if (addingType === 'folder') {
        onAddFolder(newName.trim())
      }
    }
    setNewName('')
    setAddingType(null)
  }

  const handleCancelAdd = () => {
    setNewName('')
    setAddingType(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirmAdd()
    if (e.key === 'Escape') handleCancelAdd()
  }

  return (
    <>
      {/* Toggle Button (visible when sidebar closed) */}
      {!isOpen && (
        <button className="sidebar-toggle-btn" onClick={onToggle}>
          <PanelLeft size={18} />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo"></div>
          <span className="sidebar-title">EduNova</span>
          <div className="sidebar-header-right">
            <button className="sidebar-home-btn" onClick={() => onNavigate && onNavigate('/dashboard')} title="Home">
              <Home size={16} />
            </button>
            <ThemeToggle />
            <button className="sidebar-close-btn" onClick={onToggle}>
              <PanelLeft size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="sidebar-actions">
          {addingType ? (
            <div className="sidebar-add-input-row">
              <input
                type="text"
                className="sidebar-add-input"
                placeholder={addingType === 'lesson' ? 'Lesson name' : 'Folder name'}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button className="sidebar-action-icon-btn cancel" onClick={handleCancelAdd}>
                <X size={14} />
              </button>
              <button className="sidebar-action-icon-btn confirm" onClick={handleConfirmAdd}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <>
              <button className="sidebar-add-btn" onClick={() => setAddingType('lesson')}>
                <Plus size={14} />
                <span>Add Lesson</span>
              </button>
              <button className="sidebar-add-icon-btn" onClick={() => setAddingType('folder')} title="Add Folder">
                <Folder size={14} />
              </button>
            </>
          )}
        </div>

        {/* Lesson Container */}
        <div 
          className={`sidebar-content ${dragOverId === 'sidebar-content' ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Allow dropping on empty space - will add to root level at bottom
            if (onDragOver) {
              onDragOver(e, null, 'root')
            }
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Drop on empty space - add to root level at bottom
            if (onDrop) {
              onDrop(e, null, 'root')
            }
          }}
        >
          {items.map((item) => (
            item.type === 'folder' ? (
              <FolderItem
                key={item.id}
                folder={item}
                onEdit={onEditFolder}
                onRequestDelete={(id, name) => onRequestDelete(id, name, 'folder')}
                onEditLesson={onEditLesson}
                onRequestDeleteLesson={(id, name) => onRequestDelete(id, name, 'lesson')}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                dragOverId={dragOverId}
              />
            ) : (
              <LessonItem
                key={item.id}
                lesson={item}
                onEdit={onEditLesson}
                onRequestDelete={(id, name) => onRequestDelete(id, name, 'lesson')}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                dragOverId={dragOverId}
                onLessonDoubleClick={onLessonDoubleClick}
                selectedLessonId={selectedLessonId}
              />
            )
          ))}
          {items.length === 0 && (
            <div className="sidebar-empty">No lessons yet</div>
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-edit-mode-btn">
            <Settings size={14} />
            <span>Edit Mode</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
