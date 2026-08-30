import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { accountAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import { TrendingUp, RefreshCw } from 'lucide-react'

export default function WithdrawalLimit() {
  const { user } = useAuth()
  const account = user?.account
  const [limitInfo, setLimitInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!account) return
    setLoading(true)
    accountAPI.withdrawalLimit(account.account_number)
      .then(r => setLimitInfo(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [account?.account_number])

  const usedPct = limitInfo ? Math.min(100, (limitInfo.used / limitInfo.limit) * 100) : 0

  return (
    <div>
      <div className="page-header">
        <h1>Daily Withdrawal Limit</h1>
        <p>Monitor your daily withdrawal usage and remaining allowance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Main card */}
        <div className="card" style={{ gridColumn: loading ? '1' : '1 / -1' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <div className="flex items-center" style={{ gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, background: '#CFFAFE', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={22} color="#06B6D4" />
              </div>
              <div>
                <h3 style={{ marginBottom: 0 }}>Daily Limit Overview</h3>
                <p className="text-sm text-muted">Resets automatically at midnight</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : limitInfo ? (
            <>
              {/* Big progress */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '1.1rem' }}>
                    {formatCurrency(limitInfo.used)} used
                  </span>
                  <span className="text-sm text-muted">of {formatCurrency(limitInfo.limit)}</span>
                </div>
                <div className="progress-bar-wrapper" style={{ height: 16 }}>
                  <div className={`progress-bar ${usedPct > 80 ? 'progress-bar-red' : usedPct > 50 ? 'progress-bar-amber' : 'progress-bar-blue'}`}
                    style={{ width: `${usedPct}%` }} />
                </div>
                <div className="flex justify-between" style={{ marginTop: '0.4rem' }}>
                  <span className="text-xs text-muted">{usedPct.toFixed(1)}% used</span>
                  <span className="text-xs text-muted">{(100 - usedPct).toFixed(1)}% remaining</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid-3">
                {[
                  { label: 'Daily Limit', value: formatCurrency(limitInfo.limit), bg: '#DBEAFE', color: '#3B82F6' },
                  { label: 'Used Today', value: formatCurrency(limitInfo.used), bg: '#FEE2E2', color: '#EF4444' },
                  { label: 'Remaining', value: formatCurrency(limitInfo.remaining), bg: '#D1FAE5', color: '#10B981' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '0.5rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>
                <strong>📋 Daily Limit Rules:</strong>
                <ul style={{ marginTop: '0.35rem', paddingLeft: '1.25rem' }}>
                  <li>The ₹50,000 daily limit applies to all withdrawals and outgoing transfers combined.</li>
                  <li>The limit automatically resets to ₹50,000 at the start of each new day.</li>
                  <li>Minimum account balance is always maintained regardless of the limit.</li>
                </ul>
              </div>
            </>
          ) : (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>Failed to load limit information.</p>
          )}
        </div>
      </div>
    </div>
  )
}
