import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { accountAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import { Calculator, AlertCircle } from 'lucide-react'

export default function SimpleInterest() {
  const { user } = useAuth()
  const account = user?.account
  const [form, setForm] = useState({ rate: '', years: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCalc = async (e) => {
    e.preventDefault()
    setError('')
    const rate = parseFloat(form.rate)
    const years = parseFloat(form.years)
    if (!form.rate || isNaN(rate) || rate <= 0 || rate > 100)
      return setError('Enter a valid interest rate (1–100%).')
    if (!form.years || isNaN(years) || years <= 0)
      return setError('Enter a valid number of years.')

    setLoading(true)
    try {
      const res = await accountAPI.interest(account.account_number, rate, years)
      setResult(res.data)
    } catch (err) {
      setError(err.userMessage || 'Calculation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Simple Interest Calculator</h1>
        <p>Calculate projected interest earnings on your current balance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, background: '#FEF3C7', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={22} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ marginBottom: 0 }}>Calculate Interest</h3>
              <p className="text-sm text-muted">Formula: SI = P × R × T / 100</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCalc} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Principal (Current Balance)</label>
              <input className="form-input" value={formatCurrency(account?.balance)} disabled
                style={{ fontWeight: 700, color: 'var(--navy)' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Annual Interest Rate (%)</label>
              <input name="rate" type="number" step="0.1" min="0.1" max="100"
                placeholder="e.g. 6.5" className="form-input"
                value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
              <span className="form-hint">Common rates: Savings ~4–6%, FD ~6–8%</span>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Years</label>
              <input name="years" type="number" step="0.5" min="0.5"
                placeholder="e.g. 2" className="form-input"
                value={form.years} onChange={e => setForm(f => ({ ...f, years: e.target.value }))} />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
              style={{ marginTop: '0.5rem' }}>
              {loading ? <><div className="spinner spinner-sm" /> Calculating...</> : 'Calculate Interest'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result ? (
            <>
              <div className="card" style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)', border: 'none' }}>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,.7)', marginBottom: '0.35rem', fontWeight: 700, textTransform: 'uppercase' }}>Final Amount After {result.years} Year{result.years > 1 ? 's' : ''}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>{formatCurrency(result.final_amount)}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,.7)' }}>Interest earned: <strong style={{ color: '#86EFAC' }}>{formatCurrency(result.simple_interest)}</strong></div>
              </div>

              <div className="card">
                <h4 style={{ marginBottom: '0.75rem' }}>Calculation Breakdown</h4>
                {[
                  ['Principal (P)', formatCurrency(result.principal)],
                  ['Rate (R)', `${result.rate}% per annum`],
                  ['Time (T)', `${result.years} year${result.years > 1 ? 's' : ''}`],
                  ['Simple Interest', formatCurrency(result.simple_interest)],
                  ['Final Amount', formatCurrency(result.final_amount)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span className="text-sm text-muted">{k}</span>
                    <span className="text-sm font-semibold">{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                  SI = {formatCurrency(result.principal)} × {result.rate}% × {result.years} / 100 = <strong>{formatCurrency(result.simple_interest)}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, color: 'var(--gray-400)', gap: '0.75rem' }}>
              <Calculator size={48} strokeWidth={1} />
              <h4 style={{ color: 'var(--gray-500)' }}>Enter values to calculate</h4>
              <p className="text-sm text-center">Your interest calculation result will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
