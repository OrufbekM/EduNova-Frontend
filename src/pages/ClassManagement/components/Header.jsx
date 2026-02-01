import React from 'react'
import { Plus, LogOut } from 'lucide-react'
import ThemeToggle from '../../assets/ThemeToggle'

function Header({ showInput, inputValue, onInputChange, onInputKeyDown, onCancel, onAddClick, onLogout }) {
  return (
    <header className="cm-header">
      <div className="cm-header-left">
        <div className="cm-logo"></div>
        <span className="cm-title">EduNova / <span>Class Management</span></span>
      </div>

      <div className="cm-header-right">
        <ThemeToggle />
        <button className="cm-logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={16} />
        </button>
        <div className={`cm-add-category-wrapper ${showInput ? 'active' : ''}`}>
          {showInput && (
            <>
              <input
                type="text"
                className="cm-category-input"
                placeholder="Category name"
                value={inputValue}
                onChange={onInputChange}
                onKeyDown={onInputKeyDown}
                autoFocus
              />
              <button className="cm-cancel-btn" onClick={onCancel}>Cancel</button>
            </>
          )}
          <button className="cm-add-category-btn" onClick={onAddClick}>
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
