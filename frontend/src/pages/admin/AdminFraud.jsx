import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { 
  AlertTriangle, Shield, CheckCircle, XCircle, ArrowLeft,
  User, CreditCard, Activity, Loader
} from 'lucide-react'

export default function AdminFraud() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    adminAPI.fraudAlert(id)
      .then(res => setData(res.data.alert))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleResolve = async (resolution) => {
    if (!notes && resolution === 'false_positive') {
      alert('Please provide notes for false positives.'); return;
    }
    setResolving(true)
    try {
      await adminAPI.resolveAlert(id, { resolution, notes })
      navigate('/admin/dashboard')
    } catch (err) {
      alert(err.userMessage || 'Failed to resolve alert.')
      setResolving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="text-center py-24">Alert not found.</div>

  const { alert, transaction, account, customer, related_alerts } = data
  const isOpen = alert.status === 'open'

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/admin/dashboard" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
            Fraud Investigation
            {isOpen ? (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Action Required</span>
            ) : (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Resolved</span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">Alert ID: {alert.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investigation Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Risk Scoring Panel */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600"></div>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg">Risk Assessment</h2>
                  <p className="text-sm text-slate-500 font-medium">Ensemble ML + Rule Engine</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold font-mono text-red-600">{alert.risk_score} <span className="text-lg text-slate-400">/100</span></p>
                <p className="text-xs uppercase font-extrabold tracking-wider text-red-600">{alert.risk_level}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trigger Signals</p>
              <ul className="space-y-2">
                {alert.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                    <span className="text-red-600 mt-0.5 flex-shrink-0">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Isolation Forest (ML Score)</p>
                <p className="font-mono text-sm font-bold text-slate-800">{alert.ml_score}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Deterministic Rule Score</p>
                <p className="font-mono text-sm font-bold text-slate-800">{alert.rule_score}</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {transaction && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0a3161]" /> Flagged Transaction
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Amount</p><p className="font-extrabold text-xl text-red-600">₹{transaction.amount.toLocaleString()}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Status</p><p className="font-bold text-slate-800 capitalize">{transaction.status}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Type</p><p className="font-bold text-slate-800 capitalize">{transaction.type.replace('_', ' ')}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Description</p><p className="font-medium text-slate-800">{transaction.description}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Counterparty Acc.</p><p className="font-mono font-bold text-slate-800">{transaction.counterparty_account_number || 'N/A'}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Time</p><p className="text-slate-700 font-medium">{new Date(transaction.created_at).toLocaleString()}</p></div>
              </div>
              
              {transaction.metadata_ && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Device & Location Telemetry</p>
                  <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">
                    {JSON.stringify(transaction.metadata_, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          
          {/* Action Panel */}
          {isOpen && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Resolution Decision</h3>
              <textarea 
                className="input bg-slate-50 focus:bg-white min-h-[100px] mb-4 text-sm font-medium" 
                placeholder="Investigation notes (required for false positives)..."
                value={notes} onChange={e => setNotes(e.target.value)}
              />
              <div className="space-y-3">
                <button onClick={() => handleResolve('confirmed_fraud')} disabled={resolving} className="w-full bg-[#e4002b] hover:bg-[#c20024] text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm">
                  {resolving ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Confirm Fraud (Lock Account)
                </button>
                <button onClick={() => handleResolve('false_positive')} disabled={resolving} className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                  {resolving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  False Positive (Release Txn)
                </button>
              </div>
            </div>
          )}

          {!isOpen && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-2">Resolution Log</h3>
              <p className="text-sm text-slate-600 font-medium">Resolved at: <span className="font-bold text-slate-900">{new Date(alert.resolved_at).toLocaleString()}</span></p>
              {alert.resolution_notes && (
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 italic">
                  "{alert.resolution_notes}"
                </div>
              )}
            </div>
          )}

          {/* Customer Context */}
          {customer && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#0a3161]" /> Customer Profile
              </h3>
              <div className="space-y-3 text-sm">
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Name</p><p className="font-bold text-slate-900">{customer.full_name}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Email</p><p className="font-medium text-slate-800">{customer.email}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Joined</p><p className="font-medium text-slate-800">{new Date(customer.created_at).toLocaleDateString()}</p></div>
              </div>
            </div>
          )}

          {account && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0a3161]" /> Account Status
              </h3>
              <div className="space-y-3 text-sm">
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Status</p>
                  <p className={`font-bold ${account.status === 'locked' ? 'text-red-600' : 'text-emerald-600'} uppercase`}>{account.status}</p>
                </div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Balance</p><p className="font-extrabold text-slate-900">₹{account.balance.toLocaleString()}</p></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
