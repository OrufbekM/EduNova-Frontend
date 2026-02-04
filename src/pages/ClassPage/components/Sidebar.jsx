import React, { Component } from 'react'
import { Plus, Folder, X, Check, PanelLeft, Settings, Home } from 'lucide-react'
import ThemeToggle from '../../assets/ThemeToggle'
import FolderItem from './FolderItem'
import LessonItem from './LessonItem'

class Sidebar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      addingType: null,
      newName: ''
    }
  }

  handleConfirmAdd = () => {
    const { addingType, newName } = this.state
    const { onAddLesson, onAddFolder } = this.props

    if (newName.trim()) {
      if (addingType === 'lesson' && onAddLesson) {
        onAddLesson(newName.trim())
      } else if (addingType === 'folder' && onAddFolder) {
        onAddFolder(newName.trim())
      }
    }

    this.setState({ newName: '', addingType: null })
  }

  handleCancelAdd = () => {
    this.setState({ newName: '', addingType: null })
  }

  handleKeyDown = (e) => {
    if (e.key === 'Enter') this.handleConfirmAdd()
    if (e.key === 'Escape') this.handleCancelAdd()
  }

  render() {
    const {
      isOpen,
      onToggle,
      items,
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
      onNavigate,
      editMode,
      onToggleEditMode
    } = this.props

    const { addingType, newName } = this.state

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
                  onChange={(e) => this.setState({ newName: e.target.value })}
                  onKeyDown={this.handleKeyDown}
                  autoFocus
                />
                <button className="sidebar-action-icon-btn cancel" onClick={this.handleCancelAdd}>
                  <X size={14} />
                </button>
                <button className="sidebar-action-icon-btn confirm" onClick={this.handleConfirmAdd}>
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <button className="sidebar-add-btn" onClick={() => this.setState({ addingType: 'lesson' })}>
                  <Plus size={14} />
                  <span>Add Lesson</span>
                </button>
                <button className="sidebar-add-icon-btn" onClick={() => this.setState({ addingType: 'folder' })} title="Add Folder">
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
              if (onDragOver) {
                onDragOver(e, null, 'root')
              }
            }}
            onDragLeave={onDragLeave}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
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
            <button
              className={`sidebar-edit-mode-btn ${editMode ? 'active' : ''}`}
              onClick={() => onToggleEditMode && onToggleEditMode()}
            >
              <Settings size={14} />
              <span>Edit Mode</span>
            </button>
          </div>
        </aside>
      </>
    )
  }
}

export default Sidebar
