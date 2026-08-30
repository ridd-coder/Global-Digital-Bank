import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FileText, ChevronLeft, ChevronRight, Monitor, LogIn, AlertCircle } from 'lucide-react'

export default function AdminAuditLogs() {
  const [data, setData] = useState({ logs: [], total: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('all')

  const fetchLogs = () => {
    setLoading(true)
    adminAPI.auditLogs({ page, per_page: 25, action: actionFilter })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  const totalPages = Math.ceil((data.total || 0) / 25)

  const getActionIcon = (action) => {
    if (action.includes('LOGIN')) return <LogIn className="w-4 h-4 text-blue-500" />
    if (action.includes('FRAUD') || action.includes('LOCK')) return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Monitor className="w-4 h-4 text-slate-500" />
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#e4002b]" />
            System Audit Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">Immutable record of all system events and user actions.</p>
        </div>

        <div>
          <select 
            className="input bg-white min-w-[150px]"
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Actions</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="TRANSFER_CREATED">Transfers</option>
            <option value="FRAUD_ALERT_CREATED">Fraud Alerts</option>
            <option value="ACCOUNT_LOCKED">Account Locked</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : data.logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-sans font-medium">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                      <br/>
                      <span className="text-[10px] opacity-70">{log.ip_address}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-sans font-bold text-slate-900">{log.user_name || 'System / Guest'}</p>
                      <p className="font-sans text-slate-500 text-xs">{log.user_email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {log.resource_type ? (
                        <>
                          <span className="uppercase text-[10px] tracking-wider font-bold text-slate-400 block">{log.resource_type}</span>
                          {log.resource_id}
                        </>
                      ) : (
                        <span className="italic text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.details ? (
                        <pre className="bg-slate-100 p-2 rounded text-[10px] text-slate-700 max-w-xs overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        <span className="italic text-slate-400 font-sans text-xs">No details</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between font-sans">
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
