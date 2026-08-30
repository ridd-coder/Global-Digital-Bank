import React, { useState } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from '../../components/Toast'
import { formatCurrency } from '../../utils/formatters'
import { ConfirmDialog } from '../../components/Modal'
import { Search, Lock, Unlock, AlertCircle } from 'lucide-react'

export default function UnlockAccount() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [target, setTarget] = useState(null)
  const [unlocking, setUnlocking] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await adminAPI.search(query)
      setResults(res.data.accounts || [])
      setSearched(true)
    } catch {
      toast.error('Search failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    setUnlocking(true)
    try {
      await adminAPI.unlock(target.account_number)
      toast.success(`Account #${target.account_number} unlocked successfully!`)
      // Update local results
      setResults(r => r.map(a => a.account_number === target.account_number
        ? { ...a, is_locked: false, failed_login_attempts: 0 }
        : a))
      setTarget(null)
    } catch (err) {
      toast.error(err.userMessage || 'Unlock failed.')
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Unlock Account</h1>
        <p>Search for a locked account and unlock it for the customer.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, background: '#FEF3C7', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Unlock size={22} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ marginBottom: 0 }}>Find Account to Unlock</h3>
              <p className="text-sm text-muted">Search by name or account number</p>
            </div>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                placeholder="Name or account number..."
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner spinner-sm" /> : <Search size={16} />}
              Search
            </button>
          </form>

          {searched && results.length === 0 && (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <Search size={32} />
              <p>No accounts found for "{query}"</p>
            </div>
          )}

          {results.map(acc => (
            <div key={acc.account_number} style={{
              border: `1.5px solid ${acc.is_locked ? 'var(--amber)' : 'var(--gray-200)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '0.75rem',
              background: acc.is_locked ? '#FFFBEB' : 'var(--white)',
            }}>
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{acc.name}</div>
                  <div className="text-sm text-muted">#{acc.account_number} · {acc.account_type}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className={`badge ${acc.is_locked ? 'badge-red' : 'badge-green'}`}>
                      {acc.is_locked ? <><Lock size={11} /> Locked</> : 'Unlocked'}
                    </span>
                    <span className="badge badge-gray" style={{ marginLeft: '0.5rem' }}>
                      {acc.failed_login_attempts} failed attempt{acc.failed_login_attempts !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm" style={{ marginTop: '0.35rem' }}>
                    Balance: <strong>{formatCurrency(acc.balance)}</strong>
                  </div>
                </div>
                {acc.is_locked && (
                  <button className="btn btn-primary btn-sm" onClick={() => setTarget(acc)}>
                    <Unlock size={14} /> Unlock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #FCD34D' }}>
            <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertCircle size={20} color="#92400E" />
              <h4 style={{ color: '#92400E', marginBottom: 0 }}>Account Locking Policy</h4>
            </div>
            <p className="text-sm" style={{ color: '#78350F', lineHeight: 1.6 }}>
              Accounts are automatically locked after <strong>3 consecutive failed login attempts</strong>.
              Locked accounts cannot be accessed even with the correct PIN.
            </p>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '0.75rem' }}>What happens on unlock?</h4>
            {[
              '✓ Account lock is removed',
              '✓ Failed login attempts reset to 0',
              '✓ Customer can login again immediately',
              '✓ Action is logged for audit purposes',
            ].map(s => (
              <div key={s} className="text-sm" style={{ color: 'var(--gray-600)', padding: '0.3rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!target}
        onClose={() => setTarget(null)}
        onConfirm={handleUnlock}
        title="Confirm Unlock Account"
        message={`Unlock account #${target?.account_number} (${target?.name})? Failed attempts will be reset to 0.`}
        confirmText="Yes, Unlock Account"
        loading={unlocking}
      />
    </div>
  )
}
