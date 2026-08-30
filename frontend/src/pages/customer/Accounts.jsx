import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { accountAPI, transactionAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  CreditCard, Plus, ArrowLeftRight, CheckCircle, XCircle, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Lock, Unlock, Eye, EyeOff, Loader
} from 'lucide-react'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNumbers, setShowNumbers] = useState({})
  
  // Deposit modal state
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAcc, setDepositAcc] = useState(null)
  const [amount, setAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await accountAPI.list()
      setAccounts(res.data.accounts || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    if (!amount || amount <= 0) { setError('Enter a valid amount.'); return }
    setActionLoading(true); setError('')
    try {
      await accountAPI.deposit(depositAcc.id, Number(amount))
      setShowDeposit(false)
      setAmount('')
      await loadAccounts()
    } catch (err) {
      setError(err.userMessage || 'Deposit failed.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0a3161]">My Accounts</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your balances, limits, and perform quick actions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">{acc.account_type} Account</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-4xl font-extrabold text-[#0a3161]">{fmt(acc.balance)}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  acc.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                  acc.status === 'locked' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {acc.status.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Account Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-800 font-mono font-bold text-sm tracking-widest mt-1">
                      {showNumbers[acc.id] ? acc.account_number : acc.masked_number}
                    </p>
                    <button onClick={() => setShowNumbers(p => ({ ...p, [acc.id]: !p[acc.id] }))} className="text-slate-400 hover:text-[#0a3161] mt-1 transition-colors">
                      {showNumbers[acc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Routing Number (IFSC)</p>
                  <p className="text-slate-800 font-mono font-bold text-sm mt-1">GDBN0001234</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">SWIFT / BIC</p>
                  <p className="text-slate-800 font-mono font-bold text-sm mt-1">GDBNINBBXXX</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Daily Limit Used</p>
                  <p className="text-slate-800 font-bold text-sm mt-1">{fmt(acc.daily_withdrawn)} <span className="text-slate-400">/ 50k</span></p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setDepositAcc(acc); setShowDeposit(true) }}
                  disabled={acc.status !== 'active'}
                  className="flex-1 bg-[#0a3161] hover:bg-[#134987] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowDownLeft className="w-4 h-4" /> Deposit
                </button>
                <Link to="/transfer" className={`flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#0a3161] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${acc.status !== 'active' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <ArrowUpRight className="w-4 h-4" /> Transfer
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deposit Modal */}
      {showDeposit && depositAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-extrabold text-[#0a3161]">Deposit Funds</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">To: {depositAcc.masked_number} ({depositAcc.account_type})</p>
            </div>
            
            <form onSubmit={handleDeposit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-sm flex gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount (₹)</label>
                <input 
                  type="number" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a3161] focus:border-[#0a3161]" autoFocus
                  placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} 
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDeposit(false)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="flex-1 bg-[#e4002b] hover:bg-[#c20024] text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center">
                  {actionLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
