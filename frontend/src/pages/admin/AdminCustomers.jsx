import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Users, Search, ChevronLeft, ChevronRight, Mail, Calendar } from 'lucide-react'

export default function AdminCustomers() {
  const [data, setData] = useState({ customers: [], total: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setLoading(true)
    adminAPI.customers({ page, per_page: 15, q: debouncedQuery })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, debouncedQuery])

  const totalPages = Math.ceil((data.total || 0) / 15)

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
            <Users className="w-8 h-8 text-[#e4002b]" />
            Manage Customers
          </h1>
          <p className="text-slate-500 text-sm mt-1">View and manage all registered retail banking customers.</p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            className="input pl-10 w-full md:w-64 bg-white"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Accounts</th>
                <th className="px-6 py-4">Total Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : data.customers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                data.customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0a3161] text-white flex items-center justify-center font-bold shadow-sm">
                          {c.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.full_name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {c.accounts.length === 0 ? (
                          <span className="text-slate-400 text-xs italic">No accounts</span>
                        ) : (
                          c.accounts.map(acc => (
                            <span key={acc.id} className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                              acc.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              acc.status === 'locked' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {acc.account_type.substring(0, 3)} •••{acc.account_number.slice(-4)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-base">
                      ₹{c.total_balance.toLocaleString()}
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
