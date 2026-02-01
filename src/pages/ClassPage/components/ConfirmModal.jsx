import React from 'react'
import { X } from 'lucide-react'

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="cp-modal-overlay" onClick={onCancel}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal-header">
          <h2 className="cp-modal-title">{title}</h2>
          <button className="cp-modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="cp-modal-body">
          <p className="cp-modal-message">{message}</p>
        </div>
        <div className="cp-modal-footer">
          <button className="cp-modal-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="cp-modal-btn delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
