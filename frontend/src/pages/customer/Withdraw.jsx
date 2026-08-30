import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { accountAPI } from '../../services/api'
import { toast } from '../../components/Toast'
import { formatCurrency } from '../../utils/formatters'
import { CheckCircle, ArrowUpCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function Withdraw() {
  const { user, refreshUser } = useAuth()
  const account = user?.account
  const [form, setForm] = useState({ amount: '', pin: '' })
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [limitInfo, setLimitInfo] = useState(null)

  useEffect(() => {
    if (account?.account_number) {
      accountAPI.withdrawalLimit(account.account_number)
        .then(r => setLimitInfo(r.data)).catch(() => {})
    }
  }, [account?.account_number])

  const minBalance = account?.account_type === 'Savings' ? 1000 : 5000

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) return setError('Enter a valid withdrawal amount.')
    if (!form.pin || form.pin.length !== 4) return setError('PIN must be exactly 4 digits.')

    setLoading(true)
    try {
      const prev = account.balance
      const res = await accountAPI.withdraw(account.account_number, amt, form.pin)
      await refreshUser()
      setResult({ prev, withdrawn: amt, newBal: res.data.account.balance })
      setForm({ amount: '', pin: '' })
      // Refresh limit info
      accountAPI.withdrawalLimit(account.account_number).then(r => setLimitInfo(r.data)).catch(() => {})
      toast.success(`₹${amt.toLocaleString('en-IN')} withdrawn successfully!`)
    } catch (err) {
      setError(err.userMessage || 'Withdrawal failed.')
    } finally {
      setLoading(false)
    }
  }

  const usedPct = limitInfo ? Math.min(100, (limitInfo.used / limitInfo.limit) * 100) : 0

  return (
    <div>
      <div className="page-header">
        <h1>Withdraw Money</h1>
        <p>Withdraw funds from your account with PIN verification.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, background: '#FEE2E2', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpCircle size={22} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ marginBottom: 0 }}>Withdraw Funds</h3>
              <p className="text-sm text-muted">PIN verification required</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="alert alert-success" style={{ marginBottom: '1rem', flexDirection: 'column', gap: '0.25rem' }}>
              <div className="flex items-center" style={{ gap: '0.5rem', fontWeight: 700 }}>
                <CheckCircle size={16} /> Withdrawal Successful!
              </div>
              <div className="text-sm">Previous: {formatCurrency(result.prev)}</div>
              <div className="text-sm">− Withdrawn: <strong>{formatCurrency(result.withdrawn)}</strong></div>
              <div className="text-sm">New Balance: <strong style={{ color: '#065F46' }}>{formatCurrency(result.newBal)}</strong></div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input className="form-input" value={account?.account_number} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input name="amount" type="number" step="0.01" min="1"
                placeholder="Enter amount" className="form-input"
                value={form.amount} onChange={handleChange} disabled={loading}
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">4-Digit PIN</label>
              <div style={{ position: 'relative' }}>
                <input name="pin" type={showPin ? 'text' : 'password'} maxLength={4}
                  placeholder="••••" className="form-input pin-input"
                  value={form.pin} onChange={handleChange} disabled={loading} />
                <button type="button" onClick={() => setShowPin(!showPin)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0 }}>
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-danger btn-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner spinner-sm" /> Processing...</> : 'Withdraw Money'}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))', border: 'none' }}>
            <div className="text-xs" style={{ color: 'var(--gray-400)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 700 }}>Available Balance</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{formatCurrency(account?.balance)}</div>
            <div className="text-xs" style={{ color: 'var(--gray-400)', marginTop: '0.25rem' }}>
              Min. required: {formatCurrency(minBalance)}
            </div>
          </div>

          {limitInfo && (
            <div className="card">
              <h4 style={{ marginBottom: '0.75rem' }}>Daily Withdrawal Limit</h4>
              <div className="progress-bar-wrapper" style={{ marginBottom: '0.5rem' }}>
                <div className={`progress-bar ${usedPct > 80 ? 'progress-bar-red' : 'progress-bar-blue'}`}
                  style={{ width: `${usedPct}%` }} />
              </div>
              {[
                ['Daily Limit', formatCurrency(limitInfo.limit)],
                ['Used Today', formatCurrency(limitInfo.used)],
                ['Remaining', formatCurrency(limitInfo.remaining)],
                ['Min. Balance', formatCurrency(minBalance)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between" style={{ padding: '0.3rem 0' }}>
                  <span className="text-sm text-muted">{k}</span>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
