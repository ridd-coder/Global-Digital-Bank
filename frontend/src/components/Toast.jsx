import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={20} />,
  error:   <XCircle size={20} />,
  warning: <AlertCircle size={20} />,
  info:    <Info size={20} />,
}

const COLORS = {
  success: { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' },
  error:   { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' },
  warning: { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
  info:    { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' },
}

let toastContainer = null

function getOrCreateContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'gdb-toast-container'
    Object.assign(toastContainer.style, {
      position: 'fixed',
      top: '1.25rem',
      right: '1.25rem',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '380px',
      width: 'calc(100vw - 2.5rem)',
    })
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

function ToastItem({ id, type = 'info', message, onClose }) {
  const color = COLORS[type] || COLORS.info
  useEffect(() => {
    const t = setTimeout(() => onClose(id), 4000)
    return () => clearTimeout(t)
  }, [id, onClose])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: color.bg,
        border: `1.5px solid ${color.border}`,
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,.12)',
        color: color.text,
        animation: 'slideInRight 0.3s ease',
        fontSize: '0.875rem',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: '1px' }}>{ICONS[type]}</span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: color.text,
          padding: '0',
          flexShrink: 0,
          opacity: 0.6,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

// ── Toast Manager (singleton) ─────────────────────────────────────────────
let _toasts = []
let _render = null
let _idCounter = 0

function renderToasts() {
  if (!_render) return
  _render([..._toasts])
}

export function useToastSetup() {
  const [toasts, setToasts] = React.useState([])
  _render = setToasts

  const close = React.useCallback((id) => {
    _toasts = _toasts.filter(t => t.id !== id)
    renderToasts()
  }, [])

  if (toasts.length === 0) return null

  const container = getOrCreateContainer()
  return { toasts, close, container }
}

export function toast(message, type = 'info') {
  const id = ++_idCounter
  _toasts = [..._toasts, { id, type, message }]
  renderToasts()
}

toast.success = (msg) => toast(msg, 'success')
toast.error   = (msg) => toast(msg, 'error')
toast.warning = (msg) => toast(msg, 'warning')
toast.info    = (msg) => toast(msg, 'info')

// ── Toast Container Component ─────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = React.useState([])
  _render = setToasts

  const close = React.useCallback((id) => {
    _toasts = _toasts.filter(t => t.id !== id)
    setToasts([..._toasts])
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '380px',
        width: 'calc(100vw - 2.5rem)',
      }}
    >
      <style>{`@keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onClose={close} />
      ))}
    </div>
  )
}
