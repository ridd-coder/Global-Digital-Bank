import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CreditCard, ChevronLeft, ChevronRight, LockOpen, Lock, Shield } from 'lucide-react'

export default function AdminAccounts() {
  const [data, setData] = useState({ accounts: [], total: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [unlocking, setUnlocking] = useState(null)

  const fetchAccounts = () => {
    setLoading(true)
    adminAPI.accounts({ page, per_page: 15, status: statusFilter })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAccounts()
  }, [page, statusFilter])

  const handleUnlock = async (id) => {
    if (!window.confirm("Are you sure you want to unlock this account?")) return
    setUnlocking(id)
    try {
      await adminAPI.unlock(id)
      fetchAccounts()
    } catch (err) {
      alert(err.userMessage || 'Failed to unlock account.')
    } finally {
      setUnlocking(null)
    }
  }

  const totalPages = Math.ceil((data.total || 0) / 15)

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#e4002b]" />
            Manage Accounts
          </h1>
          <p className="text-slate-500 text-sm mt-1">View all accounts and manage lock status.</p>
        </div>

        <div>
          <select 
            className="input bg-white min-w-[150px]"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="locked">Locked (Fraud)</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Account Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : data.accounts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                data.accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-slate-900">{acc.account_number}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{acc.account_type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{acc.customer_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{acc.customer_email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {acc.is_locked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider border border-red-200">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : acc.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200">
                          <LockOpen className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200">
                          {acc.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-base">
                      ₹{acc.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {acc.is_locked && (
                        <button 
                          onClick={() => handleUnlock(acc.id)}
                          disabled={unlocking === acc.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded border border-emerald-200 transition-colors shadow-sm"
                        >
                          {unlocking === acc.id ? <LoadingSpinner /> : <Shield className="w-3 h-3" />}
                          Unlock
                        </button>
                      )}
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
