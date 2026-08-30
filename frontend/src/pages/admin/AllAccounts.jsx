import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import { toast } from '../../components/Toast'
import { PageLoader } from '../../components/LoadingSpinner'
import { ConfirmDialog } from '../../components/Modal'
import { Users, Search, Lock, Unlock } from 'lucide-react'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Accounts' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'locked', label: 'Locked' },
]

export default function AllAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [unlockTarget, setUnlockTarget] = useState(null)
  const [unlocking, setUnlocking] = useState(false)

  const load = (f = filter) => {
    setLoading(true)
    adminAPI.accounts(f).then(r => setAccounts(r.data.accounts || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleUnlock = async () => {
    setUnlocking(true)
    try {
      await adminAPI.unlock(unlockTarget.account_number)
      toast.success(`Account ${unlockTarget.account_number} unlocked!`)
      setUnlockTarget(null)
      load()
    } catch (err) {
      toast.error(err.userMessage || 'Unlock failed.')
    } finally {
      setUnlocking(false) }
  }

  const filtered = search.trim()
    ? accounts.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        String(a.account_number).includes(search))
    : accounts

  return (
    <div>
      <div className="page-header">
        <h1>All Accounts</h1>
        <p>View and manage all customer accounts.</p>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              placeholder="Search by name or account number..."
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value}
                className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
          {loading ? 'Loading...' : `${filtered.length} account${filtered.length !== 1 ? 's' : ''}`}
        </div>

        {loading ? <PageLoader text="Loading accounts..." /> : (
          <div className="table-wrapper" style={{ boxShadow: 'none', border: '1px solid var(--gray-200)' }}>
            <table>
              <thead>
                <tr>
                  <th>A/C No.</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Locked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
                    <Users size={32} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    No accounts found.
                  </td></tr>
                ) : filtered.map(acc => (
                  <tr key={acc.account_number}>
                    <td style={{ fontWeight: 700, color: 'var(--blue)' }}>#{acc.account_number}</td>
                    <td style={{ fontWeight: 600 }}>{acc.name}</td>
                    <td>{acc.age}</td>
                    <td><span className={`badge ${acc.account_type === 'Savings' ? 'badge-blue' : 'badge-purple'}`}>{acc.account_type}</span></td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(acc.balance)}</td>
                    <td><span className={`badge ${acc.status === 'active' ? 'badge-green' : 'badge-red'}`}>{acc.status}</span></td>
                    <td>
                      {acc.is_locked ? (
                        <span className="badge badge-red"><Lock size={11} /> Yes</span>
                      ) : (
                        <span className="badge badge-green">No</span>
                      )}
                    </td>
                    <td>
                      {acc.is_locked && (
                        <button className="btn btn-sm btn-primary" onClick={() => setUnlockTarget(acc)}>
                          <Unlock size={13} /> Unlock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!unlockTarget}
        onClose={() => setUnlockTarget(null)}
        onConfirm={handleUnlock}
        title="Unlock Account"
        message={`Are you sure you want to unlock account #${unlockTarget?.account_number} (${unlockTarget?.name})? This will reset the failed login attempts to 0.`}
        confirmText="Unlock Account"
        loading={unlocking}
      />
    </div>
  )
}
