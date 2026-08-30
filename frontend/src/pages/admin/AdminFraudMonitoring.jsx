import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { AlertTriangle, ChevronLeft, ChevronRight, Shield, CheckCircle, Activity } from 'lucide-react'

export default function AdminFraudMonitoring() {
  const [data, setData] = useState({ alerts: [], total: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchAlerts = () => {
    setLoading(true)
    adminAPI.fraudAlerts({ page, per_page: 15, status: statusFilter })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAlerts()
  }, [page, statusFilter])

  const totalPages = Math.ceil((data.total || 0) / 15)

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#e4002b]" />
            Fraud Monitoring
          </h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered threat detection queue and investigation.</p>
        </div>

        <div>
          <select 
            className="input bg-white min-w-[150px]"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Alerts</option>
            <option value="open">Open Alerts</option>
            <option value="confirmed_fraud">Confirmed Fraud</option>
            <option value="false_positive">False Positives</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Alert ID & Time</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Customer & Account</th>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : data.alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">
                    No fraud alerts found.
                  </td>
                </tr>
              ) : (
                data.alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-slate-900">{alert.id.slice(0, 8)}...</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(alert.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {alert.risk_level === 'critical' ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded uppercase tracking-wider border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Critical ({alert.risk_score})
                          </div>
                        ) : alert.risk_level === 'high' ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded uppercase tracking-wider border border-orange-200">
                            <AlertTriangle className="w-3 h-3" /> High ({alert.risk_score})
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded uppercase tracking-wider border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Medium ({alert.risk_score})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{alert.customer_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{alert.account_number || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {alert.transaction ? (
                        <>
                          <p className="font-bold text-slate-900">₹{alert.transaction.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 capitalize">{alert.transaction.type.replace('_', ' ')}</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No txn data</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {alert.status === 'open' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">
                          <Activity className="w-3 h-3" /> Open
                        </span>
                      ) : alert.status === 'confirmed_fraud' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" /> Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/admin/fraud/${alert.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#003366] font-bold text-xs rounded border border-slate-200 transition-colors shadow-sm"
                      >
                        Investigate
                      </Link>
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
