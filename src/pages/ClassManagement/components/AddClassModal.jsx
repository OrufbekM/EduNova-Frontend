import React, { useState } from 'react'
import Modal from './Modal'
import { ChevronDown } from 'lucide-react'

function AddClassModal({ categories, defaultCategoryId, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedCategory = categories.find(c => c.id === categoryId)

  const handleSubmit = () => {
    if (name.trim() && categoryId) {
      onAdd(categoryId, name.trim(), description.trim())
      onClose()
    }
  }

  return (
    <Modal
      title="Add New Class"
      onClose={onClose}
      footer={(
        <>
          <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn done" onClick={handleSubmit}>Done</button>
        </>
      )}
    >
      <div className="modal-field">
        <label>Class Name</label>
        <input
          type="text"
          placeholder="Enter class name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="modal-field">
        <label>Description</label>
        <input
          type="text"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="modal-field">
        <label>Category</label>
        <div className="modal-dropdown">
          <button
            className="modal-dropdown-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{selectedCategory?.name || 'Select category'}</span>
            <ChevronDown size={16} />
          </button>
          {isDropdownOpen && (
            <div className="modal-dropdown-list">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`modal-dropdown-item ${cat.id === categoryId ? 'active' : ''}`}
                  onClick={() => {
                    setCategoryId(cat.id)
                    setIsDropdownOpen(false)
                  }}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default AddClassModal
