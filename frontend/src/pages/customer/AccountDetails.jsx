import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { accountAPI } from '../../services/api'
import { toast } from '../../components/Toast'
import { formatCurrency, formatDate } from '../../utils/formatters'
import Modal from '../../components/Modal'
import { AlertCircle, Eye, EyeOff, User, CreditCard, Shield, Edit2, XCircle, CheckCircle } from 'lucide-react'

export default function AccountDetails() {
  const { user, refreshUser } = useAuth()
  const account = user?.account

  const [modal, setModal] = useState(null)
  const [pin, setPin] = useState('')
  const [newName, setNewName] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openModal = (type) => {
    setModal(type); setPin(''); setNewName(account?.name || ''); setError('')
  }
  const closeModal = () => { setModal(null); setPin(''); setError(''); setLoading(false) }

  const handleRename = async () => {
    if (!newName.trim()) return setError('Name cannot be empty.')
    if (!pin || pin.length !== 4) return setError('PIN required.')
    setLoading(true)
    try {
      await accountAPI.rename(account.account_number, newName, pin)
      await refreshUser(); closeModal()
      toast.success('Account renamed successfully!')
    } catch (err) { setError(err.userMessage || 'Rename failed.') }
    finally { setLoading(false) }
  }

  const handleClose = async () => {
    if (!pin || pin.length !== 4) return setError('PIN required.')
    setLoading(true)
    try {
      await accountAPI.close(account.account_number, pin)
      await refreshUser(); closeModal()
      toast.success('Account closed successfully.')
    } catch (err) { setError(err.userMessage || 'Close failed.') }
    finally { setLoading(false) }
  }

  const handleReopen = async () => {
    if (!pin || pin.length !== 4) return setError('PIN required.')
    setLoading(true)
    try {
      await accountAPI.reopen(account.account_number, pin)
      await refreshUser(); closeModal()
      toast.success('Account reopened successfully!')
    } catch (err) { setError(err.userMessage || 'Reopen failed.') }
    finally { setLoading(false) }
  }

  const PinField = () => (
    <div className="form-group" style={{ marginTop: '1rem' }}>
      <label className="form-label">Your PIN</label>
      <div style={{ position: 'relative' }}>
        <input type={showPin ? 'text' : 'password'} maxLength={4}
          placeholder="••••" className="form-input pin-input"
          value={pin} onChange={e => setPin(e.target.value)} />
        <button type="button" onClick={() => setShowPin(!showPin)} style={{
          position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0 }}>
          {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Account Details</h1>
        <p>View and manage your account information.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Account Info */}
        <div className="card">
          <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--blue), var(--blue-dark))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.3rem' }}>
              {account?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 style={{ marginBottom: '0.2rem' }}>{account?.name}</h3>
              <span className={`badge ${account?.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                {account?.status}
              </span>
            </div>
          </div>

          {[
            ['Account Number', account?.account_number],
            ['Account Holder', account?.name],
            ['Age', account?.age + ' years'],
            ['Account Type', account?.account_type],
            ['Balance', formatCurrency(account?.balance)],
            ['Account Status', account?.status],
            ['Opened On', formatDate(account?.created_at)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span className="text-sm text-muted">{k}</span>
              <span className="text-sm font-semibold">{v}</span>
            </div>
          ))}
        </div>

        {/* Security + Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
              <Shield size={20} color="var(--blue)" />
              <h3 style={{ marginBottom: 0, fontSize: '1rem' }}>Security Status</h3>
            </div>
            {[
              ['PIN Security', <span className="badge badge-green">Protected</span>],
              ['Failed Login Attempts', <span className={`badge ${account?.failed_login_attempts > 0 ? 'badge-amber' : 'badge-green'}`}>{account?.failed_login_attempts}</span>],
              ['Account Locked', <span className={`badge ${account?.is_locked ? 'badge-red' : 'badge-green'}`}>{account?.is_locked ? 'Yes' : 'No'}</span>],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span className="text-sm text-muted">{k}</span>
                {v}
              </div>
            ))}
            <p className="text-xs text-muted" style={{ marginTop: '0.75rem' }}>
              Your PIN is stored as a secure bcrypt hash and is never displayed.
            </p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Account Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button className="btn btn-secondary btn-full" onClick={() => openModal('rename')}>
                <Edit2 size={16} /> Rename Account
              </button>
              {account?.status === 'active' ? (
                <button className="btn btn-danger btn-full" onClick={() => openModal('close')}>
                  <XCircle size={16} /> Close Account
                </button>
              ) : (
                <button className="btn btn-success btn-full" onClick={() => openModal('reopen')}>
                  <CheckCircle size={16} /> Reopen Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <Modal isOpen={modal === 'rename'} onClose={closeModal} title="Rename Account">
        <div className="form-group">
          <label className="form-label">New Name</label>
          <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter new name" />
        </div>
        <PinField />
        <div className="flex" style={{ gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={closeModal} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleRename} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" /> Saving...</> : 'Rename'}
          </button>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal isOpen={modal === 'close'} onClose={closeModal} title="Close Account">
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>Closing your account will make it inactive. You can reopen it later with your PIN.</span>
        </div>
        <PinField />
        <div className="flex" style={{ gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={closeModal} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={handleClose} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" /> Closing...</> : 'Close Account'}
          </button>
        </div>
      </Modal>

      {/* Reopen Modal */}
      <Modal isOpen={modal === 'reopen'} onClose={closeModal} title="Reopen Account">
        <p style={{ marginBottom: '1rem', color: 'var(--gray-600)' }}>Enter your PIN to reactivate your account.</p>
        <PinField />
        <div className="flex" style={{ gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={closeModal} disabled={loading}>Cancel</button>
          <button className="btn btn-success" onClick={handleReopen} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" /> Reopening...</> : 'Reopen Account'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
