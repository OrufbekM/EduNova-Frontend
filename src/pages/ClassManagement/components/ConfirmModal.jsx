import React from 'react'
import Modal from './Modal'

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="modal-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn delete" onClick={onConfirm}>Delete</button>
        </>
      }
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  )
}

export default ConfirmModal
