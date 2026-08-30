import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, CreditCard, History, AlertTriangle, FileText, LogOut, Shield, Menu } from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/accounts', icon: CreditCard, label: 'Accounts' },
  { to: '/admin/transactions', icon: History, label: 'Transactions' },
  { to: '/admin/fraud', icon: AlertTriangle, label: 'Fraud Monitoring' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0a3161] text-white">
      <div className="flex items-center gap-3 p-5 border-b border-white/10">
        <div className="w-9 h-9 bg-[#e4002b] rounded-xl flex items-center justify-center shadow-md">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-base leading-tight">GDB Admin</p>
          <p className="text-[11px] text-[#ffb81c] font-semibold uppercase tracking-wider">Operations Center</p>
        </div>
      </div>
      <div className="p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ffb81c] text-[#0a3161] font-bold rounded-full flex items-center justify-center shadow-sm">A</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">Administrator</p>
            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                active 
                  ? 'bg-white text-[#0a3161] shadow-sm' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className={`w-4 h-4 ${active ? 'text-[#0a3161]' : 'text-blue-200'}`} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm w-full text-red-300 hover:bg-red-500/20 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden ${mobileOpen ? '' : '-translate-x-full'} transition-transform shadow-2xl`}>
        <NavContent />
      </aside>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 shadow-lg">
        <NavContent />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center px-4 py-3 border-b border-slate-200 bg-white shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-600 hover:text-slate-900"><Menu className="w-5 h-5" /></button>
          <span className="ml-3 font-bold text-slate-900">Admin Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto animate-fade-in"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
