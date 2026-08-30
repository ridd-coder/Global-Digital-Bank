import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { 
  Users, CreditCard, Activity, AlertTriangle, ShieldAlert, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Lock, CheckCircle
} from 'lucide-react'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.dashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="text-center py-12 text-surface-400">Failed to load dashboard.</div>

  const { stats, recent_fraud_alerts, system_health } = data

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366]">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Platform overview and system metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">System Operational</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: stats.total_users, icon: Users, color: 'text-[#0a3161]', bg: 'bg-blue-50' },
          { label: 'Active Accounts', value: stats.total_accounts, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Transaction Volume (30d)', value: fmt(stats.total_transaction_volume || 0), icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'High Risk Alerts (24h)', value: stats.open_fraud_alerts, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', alert: stats.open_fraud_alerts > 0 },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-6 rounded-2xl border ${kpi.alert ? 'border-red-300 bg-red-50/40 shadow-sm' : 'border-slate-200 shadow-sm'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              {kpi.alert && <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>}
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{kpi.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Queue */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fraud Investigation Queue</h2>
            <Link to="/admin/fraud" className="text-[#0a3161] font-bold text-xs hover:underline">View All Queue →</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden divide-y divide-slate-100">
            {recent_fraud_alerts?.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-slate-800 font-bold">No open fraud alerts</p>
                <p className="text-xs text-slate-500 mt-1">All transactions are within normal risk parameters.</p>
              </div>
            ) : (
              recent_fraud_alerts?.map(alert => (
                <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-200">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Score: {alert.risk_score}/100 — <span className="text-red-600">{alert.risk_level.toUpperCase()}</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">Account ID: <span className="font-mono font-medium">{alert.account_id.substring(0,8)}...</span></p>
                      <p className="text-[11px] text-slate-400">{new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <Link to={`/admin/fraud/${alert.id}`} className="bg-[#0a3161] text-white hover:bg-[#134987] py-2 px-4 rounded-lg text-xs font-bold shadow-sm transition-colors">
                    Investigate
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">System Health</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 font-bold">ML Engine Status</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold">Online</span>
              </div>
              <p className="text-xs text-slate-500">Isolation Forest (v1.2.0) is actively scoring transactions.</p>
            </div>
            <div className="border-t border-slate-100" />
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 font-bold">Rule Engine</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold">Active</span>
              </div>
              <p className="text-xs text-slate-500">65% weight in ensemble model.</p>
            </div>
            <div className="border-t border-slate-100" />
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 font-bold">Locked Accounts</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold">{stats.locked_accounts}</span>
              </div>
              <p className="text-xs text-slate-500">Accounts locked due to 3 failed login attempts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
