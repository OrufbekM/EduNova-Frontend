import React from 'react'
import { IconPlus, IconLogout, IconUser, IconEdit } from '../../icons.jsx'
import ThemeToggle from '../../assets/ThemeToggle'

function Header({ showInput, inputValue, onInputChange, onInputKeyDown, onCancel, onAddClick, onLogout, profileOpen, onProfileToggle, onProfileClickOutside }) {
  return (
    <header className="cm-header">
      <div className="cm-header-left">
        <div className="cm-logo">
          <img src="/logoLight.png" alt="EduNova" className="logo-light" />
          <img src="/logoDark.png" alt="EduNova" className="logo-dark" />
        </div>
        <span className="cm-title">
          <span className="cm-title-edu">Edu</span><span className="cm-title-nova">Nova</span><span className="cm-title-rest"> / Class Management</span>
        </span>
      </div>

      <div className="cm-header-right">
        <ThemeToggle />
        <div className="cm-profile-wrapper">
          <button className="cm-profile-toggle" onClick={onProfileToggle} title="Profile">
            <IconUser size={18} />
          </button>
        </div>
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
            <IconPlus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
