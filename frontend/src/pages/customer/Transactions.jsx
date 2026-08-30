import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { transactionAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  History, ArrowDownLeft, ArrowUpRight, TrendingUp, Plus,
  CheckCircle, XCircle, AlertTriangle, Clock, Download, FileText
} from 'lucide-react'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const TXN_CFG = {
  deposit: { icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-950/50' },
  transfer_in: { icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-950/50' },
  withdrawal: { icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-950/50' },
  transfer_out: { icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-950/50' },
  interest: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-950/50' },
  account_open: { icon: Plus, color: 'text-primary-400', bg: 'bg-primary-950/50' },
}

const STATUS_ICON = {
  completed: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  blocked: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  flagged: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  pending: <Clock className="w-3.5 h-3.5 text-slate-500" />,
}

const RISK_BADGE = {
  low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical',
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filter state
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    load()
  }, [page, filterType, filterStatus])

  const load = async () => {
    setLoading(true)
    try {
      const res = await transactionAPI.list({ page, per_page: 20, type: filterType, status: filterStatus })
      setTransactions(res.data.transactions || [])
      setTotalPages(res.data.pages || 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your complete transaction history</p>
        </div>
        
        <div className="flex gap-2">
          <select className="input py-2 text-sm w-auto" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}>
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="transfer_in">Transfers In</option>
            <option value="transfer_out">Transfers Out</option>
          </select>
          <select className="input py-2 text-sm w-auto" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="flagged">Flagged</option>
          </select>
          <Link to="/statements" className="btn-secondary py-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </Link>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading && transactions.length === 0 ? (
          <div className="py-12"><LoadingSpinner size="md" /></div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No transactions found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="table-header py-3 px-4">Date</th>
                    <th className="table-header py-3 px-4">Description</th>
                    <th className="table-header py-3 px-4">Type</th>
                    <th className="table-header py-3 px-4">Status / Risk</th>
                    <th className="table-header py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {transactions.map(t => {
                    const cfg = TXN_CFG[t.type] || TXN_CFG['deposit']
                    const isCredit = ['deposit', 'transfer_in', 'interest', 'account_open'].includes(t.type)
                    return (
                      <tr key={t.id} className="hover:bg-slate-100/30 transition-colors">
                        <td className="table-cell whitespace-nowrap">
                          <p className="font-medium text-slate-700">
                            {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="table-cell max-w-xs">
                          <p className="font-medium text-slate-800 truncate" title={t.description}>{t.description}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{t.transaction_id}</p>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md ${cfg.bg} flex items-center justify-center`}>
                              <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </div>
                            <span className="text-xs capitalize text-slate-600">{t.type.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs text-slate-600 capitalize">
                              {STATUS_ICON[t.status]} {t.status}
                            </span>
                            {t.risk_level && t.risk_level !== 'low' && (
                              <span className={RISK_BADGE[t.risk_level]}>{t.risk_level}</span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell text-right">
                          <p className={`font-semibold ${isCredit ? 'text-emerald-400' : 'text-slate-800'}`}>
                            {isCredit ? '+' : '-'}{fmt(t.amount)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Bal: {fmt(t.balance_after)}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/30">
                <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-30">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
