import React from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  if (!isOpen) return null

  const maxW = size === 'lg' ? '640px' : size === 'sm' ? '380px' : '520px'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: maxW }}>
        {title && (
          <div className="modal-header">
            <h3 style={{ fontSize: '1.1rem' }}>{title}</h3>
            {onClose && (
              <button className="btn btn-ghost btn-icon" onClick={onClose}>
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'}>
      <p style={{ marginBottom: '1.5rem', color: 'var(--gray-600)' }}>{message}</p>
      <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <><div className="spinner spinner-sm" /> Processing...</> : confirmText}
        </button>
      </div>
    </Modal>
  )
}
