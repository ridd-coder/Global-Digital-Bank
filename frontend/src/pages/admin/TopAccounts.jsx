import React, { useState } from 'react'
import { adminAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import { PageLoader } from '../../components/LoadingSpinner'
import { Trophy } from 'lucide-react'

export default function TopAccounts() {
  const [n, setN] = useState(10)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = async (count = n) => {
    setLoading(true)
    try {
      const res = await adminAPI.topAccounts(count)
      setAccounts(res.data.accounts || [])
      setLoaded(true)
    } catch {} finally { setLoading(false) }
  }

  const MEDALS = { 0: '🥇', 1: '🥈', 2: '🥉' }

  return (
    <div>
      <div className="page-header">
        <h1>Top Accounts by Balance</h1>
        <p>Ranking of highest-balance accounts in the system.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="form-label" style={{ marginBottom: 0 }}>Show top:</span>
          {[5, 10, 20].map(num => (
            <button key={num}
              className={`btn btn-sm ${n === num ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setN(num); load(num) }}>
              Top {num}
            </button>
          ))}
          {!loaded && (
            <button className="btn btn-primary btn-sm" onClick={() => load()}>Load Rankings</button>
          )}
        </div>
      </div>

      {loading && <PageLoader text="Loading rankings..." />}

      {!loading && loaded && (
        <div className="card">
          {accounts.length === 0 ? (
            <div className="empty-state">
              <Trophy size={48} />
              <h4>No Accounts Yet</h4>
              <p>Create some accounts to see the rankings.</p>
            </div>
          ) : (
            accounts.map((acc, i) => (
              <div key={acc.account_number}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 0.75rem', borderBottom: '1px solid var(--gray-100)',
                  background: i < 3 ? `rgba(${i === 0 ? '251,191,36' : i === 1 ? '156,163,175' : '180,83,9'},.07)` : 'transparent',
                  borderRadius: i < 3 ? 'var(--radius)' : 0,
                  marginBottom: i < 3 ? '0.25rem' : 0,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: i < 3 ? 'var(--gray-100)' : 'var(--gray-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: i < 3 ? '1.3rem' : '0.9rem', fontWeight: 800,
                  color: 'var(--gray-600)', flexShrink: 0,
                }}>
                  {MEDALS[i] || `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{acc.name}</div>
                  <div className="text-xs text-muted">#{acc.account_number} · {acc.account_type} · {acc.status}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--navy)' }}>
                    {formatCurrency(acc.balance)}
                  </div>
                  <div className="text-xs text-muted">Balance</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
