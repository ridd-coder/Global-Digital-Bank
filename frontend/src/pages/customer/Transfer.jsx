import React, { useState, useEffect } from 'react'
import { transferAPI, beneficiaryAPI, accountAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  ArrowLeftRight, AlertTriangle, CheckCircle, XCircle, Shield,
  Users, ChevronDown, Loader, ChevronRight, Info, Eye, EyeOff, Zap
} from 'lucide-react'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const RISK_COLORS = {
  low: 'text-emerald-700 border-emerald-200 bg-emerald-50',
  medium: 'text-amber-700 border-amber-200 bg-amber-50',
  high: 'text-orange-700 border-orange-200 bg-orange-50',
  critical: 'text-red-700 border-red-200 bg-red-50',
}

const RISK_BAR_COLORS = {
  low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-orange-500', critical: 'bg-red-500'
}

function RiskScoreDisplay({ score, level, reasons, recommendedAction }) {
  return (
    <div className={`rounded-xl border p-5 ${RISK_COLORS[level]} animate-slide-up`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Risk Assessment</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono">{score} / 100</p>
          <p className="text-xs uppercase font-bold tracking-wider">{level}</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-white/50 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${RISK_BAR_COLORS[level]}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {reasons && reasons.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Risk Signals Detected</p>
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex-shrink-0 opacity-80">•</span>
              <span className="font-medium opacity-90">{r}</span>
            </div>
          ))}
        </div>
      )}

      {recommendedAction && (
        <div className="p-3 bg-black/5 border border-black/5 rounded-lg text-sm">
          <span className="font-bold">Recommended Action: </span>
          <span className="font-medium opacity-90">{recommendedAction}</span>
        </div>
      )}
    </div>
  )
}

function FraudPipelineTrace({ pipeline }) {
  return (
    <div className="space-y-2 animate-slide-up">
      <p className="text-sm font-semibold text-slate-600 mb-3">Fraud Detection Pipeline</p>
      {pipeline.map((step, i) => (
        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
          step.status === 'blocked' ? 'bg-red-50 border-red-200' :
          step.status === 'alert' ? 'bg-amber-50 border-amber-200' :
          'bg-slate-100 border-slate-200'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            step.status === 'blocked' ? 'bg-red-700' :
            step.status === 'alert' ? 'bg-amber-700' : 'bg-[#0a3161]'
          } text-white`}>{i + 1}</div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              step.status === 'blocked' ? 'text-red-700' :
              step.status === 'alert' ? 'text-amber-700' : 'text-slate-800'
            }`}>{step.step}</p>
            {step.details && <p className="text-xs text-slate-500 mt-0.5">{step.details}</p>}
          </div>
          {step.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
          {step.status === 'blocked' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
          {step.status === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}

export default function Transfer() {
  const [beneficiaries, setBeneficiaries] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    to_account_number: '',
    amount: '',
    pin: '',
    description: '',
    beneficiary_id: '',
  })

  useEffect(() => {
    Promise.all([beneficiaryAPI.list(), accountAPI.list()])
      .then(([benRes, accRes]) => {
        setBeneficiaries(benRes.data.beneficiaries || [])
        setAccounts(accRes.data.accounts || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectBeneficiary = (ben) => {
    update('to_account_number', ben.account_number)
    update('beneficiary_id', ben.id)
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (!form.to_account_number || !form.amount || !form.pin) { setError('All fields are required.'); return }
    if (form.to_account_number.length !== 10) { setError('Account number must be exactly 10 digits.'); return }
    setSubmitting(true); setError(''); setResult(null)
    try {
      const res = await transferAPI.initiate({
        to_account_number: form.to_account_number,
        amount: Number(form.amount),
        pin: form.pin,
        description: form.description,
        beneficiary_id: form.beneficiary_id || null,
        device_fingerprint: navigator.userAgent.substring(0, 50),
      })
      setResult(res.data)
    } catch (err) {
      setError(err.userMessage || 'Transfer failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSimulateSuspicious = async () => {
    setSimulating(true); setError(''); setResult(null)
    try {
      const res = await transferAPI.simulateSuspicious({
        amount: 85000,
        new_beneficiary: true,
        new_device: true,
        unusual_time: true,
        unusual_location: true,
      })
      setResult({
        ...res.data,
        isSimulation: true,
        status: 'blocked',
        message: 'Transaction blocked due to high fraud risk.',
        risk_score: res.data.risk_assessment?.score,
        risk_level: res.data.risk_assessment?.level,
        reasons: res.data.risk_assessment?.reasons,
        recommended_action: res.data.risk_assessment?.recommended_action
      })
    } catch (err) {
      setError(err.userMessage || 'Simulation failed.')
    } finally {
      setSimulating(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transfer Funds</h1>
          <p className="text-slate-500 text-sm mt-0.5">AI-powered fraud detection on every transaction</p>
        </div>
        <button onClick={handleSimulateSuspicious} disabled={simulating}
          className="btn bg-[#ffb81c] hover:bg-[#e6a210] text-[#0a3161] font-bold shadow-sm text-sm">
          {simulating ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {simulating ? 'Running...' : 'Simulate Fraud Demo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <div className="space-y-5">
          {/* Beneficiaries */}
          {beneficiaries.length > 0 && (
            <div>
              <p className="label mb-2">Saved Beneficiaries</p>
              <div className="flex flex-wrap gap-2">
                {beneficiaries.map(b => (
                  <button key={b.id} onClick={() => selectBeneficiary(b)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      form.beneficiary_id === b.id
                        ? 'border-[#0a3161] bg-blue-50 text-[#0a3161]'
                        : 'border-slate-200 hover:border-surface-600 text-slate-600'
                    }`}>
                    <div className="w-6 h-6 bg-surface-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {b.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-slate-400">{b.masked_account}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="label">To Account Number</label>
              <input className="input font-mono" placeholder="10-digit account number"
                maxLength={10}
                value={form.to_account_number}
                onChange={e => { update('to_account_number', e.target.value.replace(/\D/g, '').slice(0, 10)); update('beneficiary_id', '') }} />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input text-lg font-semibold" type="number" placeholder="0.00"
                min="1" value={form.amount} onChange={e => update('amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Description <span className="text-slate-400">(optional)</span></label>
              <input className="input" placeholder="e.g. Rent payment" value={form.description}
                onChange={e => update('description', e.target.value)} />
            </div>
            <div>
              <label className="label">Transaction PIN</label>
              <div className="relative">
                <input type={showPin ? 'text' : 'password'} className="input font-mono tracking-widest text-center"
                  maxLength={4} placeholder="••••" value={form.pin}
                  onChange={e => update('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                <button type="button" onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
              {submitting ? 'Processing...' : 'Transfer Funds'}
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-white rounded-lg">
            <Shield className="w-3 h-3" />
            Every transaction is analysed by our AI fraud detection engine in real time.
          </div>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {result ? (
            <div className="animate-slide-up space-y-4">
              {/* Status header */}
              <div className={`rounded-xl p-5 border ${
                result.status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                result.status === 'blocked' ? 'bg-red-50 border-red-200' :
                'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  {result.status === 'completed' && <CheckCircle className="w-8 h-8 text-emerald-600" />}
                  {result.status === 'blocked' && <XCircle className="w-8 h-8 text-red-600" />}
                  {result.status === 'step_up_required' && <Shield className="w-8 h-8 text-amber-600" />}
                  <div>
                    <p className="font-bold text-slate-900 text-lg">
                      {result.status === 'completed' ? 'Transfer Successful' :
                       result.status === 'blocked' ? '🚨 Transaction Blocked' :
                       '⚠️ Verification Required'}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{result.message}</p>
                  </div>
                </div>
                {result.isSimulation && (
                  <div className="mt-3 px-2 py-1 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800 font-semibold inline-block">
                    📊 DEMO SIMULATION — Not a real transaction
                  </div>
                )}
              </div>

              {/* Risk assessment */}
              {result.risk_score !== undefined && (
                <RiskScoreDisplay
                  score={result.risk_score}
                  level={result.risk_level}
                  reasons={result.reasons || []}
                  recommendedAction={result.recommended_action || ''}
                />
              )}

              {/* OTP for step-up */}
              {result.status === 'step_up_required' && result.otp_hint && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Demo OTP (simulated)</p>
                  <p className="text-3xl font-mono font-bold text-amber-700 tracking-widest">{result.otp_hint}</p>
                  <p className="text-xs text-amber-800/80 mt-2">{result.demo_note}</p>
                </div>
              )}

              {/* Fraud pipeline trace (for simulation) */}
              {result.pipeline && <FraudPipelineTrace pipeline={result.pipeline} />}

              {/* Transaction ref */}
              {result.transaction?.transaction_id && (
                <p className="text-xs text-slate-400 text-center">
                  Ref: <span className="font-mono text-slate-500">{result.transaction.transaction_id}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <ArrowLeftRight className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium">Transfer result will appear here</p>
              <p className="text-slate-300 text-sm mt-1">
                Try the fraud demo button to see the full AI pipeline →
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
