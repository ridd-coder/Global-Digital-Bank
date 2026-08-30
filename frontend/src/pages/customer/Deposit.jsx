import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { accountAPI } from '../../services/api'
import { toast } from '../../components/Toast'
import { formatCurrency } from '../../utils/formatters'
import { CheckCircle, ArrowDownCircle, AlertCircle } from 'lucide-react'

export default function Deposit() {
  const { user, refreshUser } = useAuth()
  const account = user?.account
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const PRESETS = [500, 1000, 2000, 5000, 10000, 25000]

  const handleDeposit = async (e) => {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0)
      return setError('Please enter a valid deposit amount.')

    setLoading(true)
    try {
      const prev = account.balance
      const res = await accountAPI.deposit(account.account_number, amt)
      await refreshUser()
      setResult({ prev, deposited: amt, newBal: res.data.account.balance })
      setAmount('')
      toast.success(`₹${amt.toLocaleString('en-IN')} deposited successfully!`)
    } catch (err) {
      setError(err.userMessage || 'Deposit failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Deposit Money</h1>
        <p>Add funds to your account instantly.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Form */}
        <div className="card">
          <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, background: '#D1FAE5', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownCircle size={22} color="#10B981" />
            </div>
            <div>
              <h3 style={{ marginBottom: 0 }}>Make a Deposit</h3>
              <p className="text-sm text-muted">Current Balance: <strong style={{ color: 'var(--navy)' }}>{formatCurrency(account?.balance)}</strong></p>
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
                <CheckCircle size={16} /> Deposit Successful!
              </div>
              <div className="text-sm">Previous: {formatCurrency(result.prev)}</div>
              <div className="text-sm">+ Deposited: <strong>{formatCurrency(result.deposited)}</strong></div>
              <div className="text-sm">New Balance: <strong style={{ color: '#065F46' }}>{formatCurrency(result.newBal)}</strong></div>
            </div>
          )}

          <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input className="form-input" value={account?.account_number} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number" step="0.01" min="1" placeholder="Enter amount"
                className="form-input" value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={loading}
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
              />
            </div>

            {/* Quick amounts */}
            <div>
              <div className="form-label" style={{ marginBottom: '0.5rem' }}>Quick Amount</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {PRESETS.map(p => (
                  <button key={p} type="button"
                    className={`btn btn-sm ${amount == p ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setAmount(String(p))}
                  >
                    ₹{p.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-success btn-full btn-lg" disabled={loading || !account?.is_active?.()}>
              {loading ? <><div className="spinner spinner-sm" /> Processing...</> : 'Deposit Money'}
            </button>

            {account?.status === 'inactive' && (
              <div className="alert alert-warning">
                <AlertCircle size={16} />
                <span>Account is inactive. Reopen it first to make deposits.</span>
              </div>
            )}
          </form>
        </div>

        {/* Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)', border: 'none' }}>
            <div className="text-xs" style={{ color: 'var(--gray-400)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 700 }}>Current Balance</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
              {formatCurrency(account?.balance)}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{account?.account_type} · #{account?.account_number}</div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '0.75rem' }}>Deposit Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                ['Account Holder', account?.name],
                ['Account Type', account?.account_type],
                ['Account Status', account?.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-sm text-muted">{k}</span>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--green-bg)', border: '1px solid #A7F3D0' }}>
            <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={18} color="var(--green)" />
              <span style={{ fontWeight: 700, color: '#065F46' }}>Instant Deposit</span>
            </div>
            <p className="text-sm" style={{ color: '#047857' }}>
              Deposits are credited to your account immediately and appear in transaction history.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
