import React, { useState } from 'react'
import { IconFolder, IconFolderOpen, IconChevronRight, IconChevronDown, IconGrip, IconEdit, IconTrash, IconCheck, IconX } from '../../icons.jsx'
import LessonItem from './LessonItem'
import styles from '../ClassPage.module.css'

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
    <div className={styles.folderWrapper}>
      <div
        className={`${styles.folderItem} ${isDragOver ? styles.dragOver : ''}`}
        data-id={folder.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => onDragOver(e, folder.id, 'folder')}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, folder.id, 'folder')}
        onClick={(e) => {
          if (e.target.closest(`.${styles.folderActions}`) ||
              e.target.closest(`.${styles.folderEditInput}`) ||
              e.target.closest(`.${styles.folderHandle}`) ||
              e.target.closest(`.${styles.folderToggle}`)) {
            return
          }
          setIsOpen(!isOpen)
        }}
        style={{ cursor: 'pointer' }}
      >
        <div
          className={styles.folderHandle}
          draggable={true}
          onDragStart={(e) => onDragStart(e, folder.id, 'folder')}
          onDragEnd={onDragEnd}
        >
          <IconGrip size={12} />
        </div>

        <div className={styles.folderIcon}>
          {isOpen ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
        </div>

        <button className={styles.folderToggle} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </button>

        {isEditing ? (
          <input
            type="text"
            className={styles.folderEditInput}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className={styles.folderName}>{folder.name}</span>
        )}

        {isHovered && !isEditing && (
          <div className={styles.folderActions}>
            <button className={styles.folderActionBtn} onClick={() => setIsEditing(true)}><IconEdit size={12} /></button>
            <button className={`${styles.folderActionBtn} ${styles.delete}`} onClick={() => onRequestDelete(folder.id, folder.name, 'folder')}><IconTrash size={12} /></button>
          </div>
        )}

        {isEditing && (
          <div className={styles.folderActions}>
            <button className={`${styles.folderActionBtn} ${styles.confirm}`} onClick={handleSave}><IconCheck size={12} /></button>
            <button className={`${styles.folderActionBtn} ${styles.cancel}`} onClick={handleCancel}><IconX size={12} /></button>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className={`${styles.folderChildren} ${isDragOver ? styles.dragOverFolderChildren : ''}`}
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
            <div className={styles.folderEmpty}>Drop lessons here</div>
          )}
        </div>
      )}
    </div>
  )
}

export default FolderItem
