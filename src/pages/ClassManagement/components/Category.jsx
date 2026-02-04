import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import ClassCard from './ClassCard'

function Category({
  category,
  onAddClass,
  onEditCategory,
  onEditClass,
  onRequestDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverTarget,
  onClassDoubleClick
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)

  const handleSave = () => {
    if (editName.trim()) {
      onEditCategory(category.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(category.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const isCategoryDragOver = dragOverTarget?.categoryId === category.id && !dragOverTarget?.classId

  return (
    <div className="category">
      <div
        className="category-header"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="category-header-left">
          {isHovered && !isEditing && (
            <div className="category-header-actions">
              <button className="category-action-btn" onClick={() => setIsEditing(true)}>
                <Pencil size={14} />
              </button>
              <button className="category-action-btn delete" onClick={() => onRequestDelete('category', category.id, null, category.name)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
          {isEditing ? (
            <div className="category-edit-wrapper">
              <input
                type="text"
                className="category-edit-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <div className="category-edit-actions">
                <button className="category-action-btn confirm" onClick={handleSave}>
                  <Check size={14} />
                </button>
                <button className="category-action-btn cancel" onClick={handleCancel}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <span className="category-name">{category.name}</span>
          )}
        </div>
        <span className="category-count">{category.classes.length}</span>
      </div>

      <div
        className={`category-body ${isCategoryDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDragOver(e, category.id, null, category.classes.length)
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDrop(e, category.id, category.classes.length)
        }}
      >
        {category.classes.map((cls, index) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            index={index}
            categoryId={category.id}
            onEdit={onEditClass}
            onRequestDelete={onRequestDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            dragOverTarget={dragOverTarget}
            onClassDoubleClick={onClassDoubleClick}
          />
        ))}
        {category.classes.length === 0 && (
          <div className="category-empty">Drop here or add class</div>
        )}
      </div>

      <button className="category-add-btn" onClick={() => onAddClass(category.id)}>
        <Plus size={16} />
        <span>Add Class</span>
      </button>
    </div>
  )
}

export default Category
