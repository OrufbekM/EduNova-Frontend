import React, { Component } from 'react'
import { IconPlus, IconFolder, IconX, IconCheck, IconPanelLeft, IconSettings, IconHome } from '../../icons.jsx'
import ThemeToggle from '../../assets/ThemeToggle'
import FolderItem from './FolderItem'
import LessonItem from './LessonItem'
import styles from '../ClassPage.module.css'

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
          <button className={styles.sidebarToggleBtn} onClick={onToggle}>
            <IconPanelLeft size={18} />
          </button>
        )}

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
          {/* Header */}
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLogo}></div>
            <span className={styles.sidebarTitle}>EduNova</span>
            <div className={styles.sidebarHeaderRight}>
              <button className={styles.sidebarHomeBtn} onClick={() => onNavigate && onNavigate('/dashboard')} title="Home">
                <IconHome size={16} />
              </button>
              <ThemeToggle />
              <button className={styles.sidebarCloseBtn} onClick={onToggle}>
                <IconPanelLeft size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.sidebarActions}>
            {addingType ? (
              <div className={styles.sidebarAddInputRow}>
                <input
                  type="text"
                  className={styles.sidebarAddInput}
                  placeholder={addingType === 'lesson' ? 'Lesson name' : 'Folder name'}
                  value={newName}
                  onChange={(e) => this.setState({ newName: e.target.value })}
                  onKeyDown={this.handleKeyDown}
                  autoFocus
                />
                <button className={`${styles.sidebarActionIconBtn} ${styles.cancel}`} onClick={this.handleCancelAdd}>
                  <IconX size={14} />
                </button>
                <button className={`${styles.sidebarActionIconBtn} ${styles.confirm}`} onClick={this.handleConfirmAdd}>
                  <IconCheck size={14} />
                </button>
              </div>
            ) : (
              <>
                <button className={styles.sidebarAddBtn} onClick={() => this.setState({ addingType: 'lesson' })}>
                  <IconPlus size={14} />
                  <span>Add Lesson</span>
                </button>
                <button className={styles.sidebarAddIconBtn} onClick={() => this.setState({ addingType: 'folder' })} title="Add Folder">
                  <IconFolder size={14} />
                </button>
              </>
            )}
          </div>

          {/* Lesson Container */}
          <div
            className={`${styles.sidebarContent} ${dragOverId === 'sidebar-content' ? styles.dragOverSidebar : ''}`}
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
              <div className={styles.sidebarEmpty}>No lessons yet</div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.sidebarFooter}>
            <button
              type="button"
              className={`${styles.sidebarEditModeBtn} ${editMode ? styles.active : ''}`}
              onClick={() => onToggleEditMode && onToggleEditMode()}
            >
              <IconSettings size={14} />
              <span>Edit Mode</span>
            </button>
          </div>
        </aside>
      </>
    )
  }
}

export default Sidebar
