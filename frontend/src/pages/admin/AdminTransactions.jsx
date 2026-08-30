import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Activity, ChevronLeft, ChevronRight, AlertTriangle, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'

export default function AdminTransactions() {
  const [data, setData] = useState({ transactions: [], total: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')

  const fetchTransactions = () => {
    setLoading(true)
    adminAPI.transactions({ page, per_page: 20, status: statusFilter, risk_level: riskFilter })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, statusFilter, riskFilter])

  const totalPages = Math.ceil((data.total || 0) / 20)

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#e4002b]" />
            All Transactions
          </h1>
          <p className="text-slate-500 text-sm mt-1">Monitor system-wide ledger activity.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="input bg-white min-w-[140px]"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
          </select>
          <select 
            className="input bg-white min-w-[140px]"
            value={riskFilter}
            onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Risk</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Transaction / Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status & Risk</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : data.transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                data.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-slate-900">{t.transaction_id || t.id.slice(0,8)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(t.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{t.customer_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500">ACC: {t.account_number || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 capitalize">{t.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {t.status === 'completed' && <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle className="w-3 h-3" /> Completed</span>}
                        {t.status === 'blocked' && <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700"><XCircle className="w-3 h-3" /> Blocked</span>}
                        {t.status === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700"><AlertTriangle className="w-3 h-3" /> Pending</span>}
                        
                        {t.risk_level === 'critical' && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Critical Risk</span>}
                        {t.risk_level === 'high' && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">High Risk</span>}
                        {t.risk_level === 'medium' && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">Med Risk</span>}
                        {t.risk_level === 'low' && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">Low Risk</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono font-bold text-base ${
                        t.type === 'deposit' || t.type === 'transfer_in' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {t.type === 'deposit' || t.type === 'transfer_in' ? '+' : ''}₹{t.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
