import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationAPI } from '../services/api'
import AIChatWidget from '../components/AIChatWidget'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Users, History,
  BarChart3, FileText, Bell, Shield, User, LogOut, Search, MessageSquare, Menu, X, ChevronDown
} from 'lucide-react'

const PRIMARY_NAV = [
  { to: '/dashboard', label: 'Personal' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/transfer', label: 'Payments' },
  { to: '/beneficiaries', label: 'Cards' },
  { to: '/transactions', label: 'Loans' },
  { to: '/analytics', label: 'Investments' },
  { to: '/security', label: 'Security' },
]

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    notificationAPI.list({ per_page: 1 }).then(r => setUnread(r.data.unread)).catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-md border-b border-slate-200 py-3'}`}>
        <div className="w-full px-4 lg:px-6 flex items-center justify-between">
          
          {/* LEFT: Logo & Primary Nav */}
          <div className="flex items-center min-w-0 flex-1">
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0 mr-4 lg:mr-8">
              <img src="/logo.jpg" alt="GDB Logo" className="h-9 object-contain mix-blend-multiply" />
              <span className="font-extrabold text-[17px] text-[#003366] hidden md:block tracking-tight whitespace-nowrap">Global Digital Bank</span>
            </Link>

            <div className="hidden lg:flex items-center gap-3 xl:gap-5 overflow-hidden">
              {PRIMARY_NAV.map((item) => {
                const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                return (
                  <Link key={item.to} to={item.to} className={`text-[14px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${active ? 'text-cyan-600' : 'text-[#003366] hover:text-cyan-600'}`}>
                    {item.label} {['Accounts', 'Payments', 'Cards', 'Loans', 'Investments'].includes(item.label) && <ChevronDown className="w-3 h-3 opacity-50" />}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Secondary Nav */}
          <div className="hidden lg:flex items-center gap-3 shrink-0 ml-2">
            <button className="text-slate-500 hover:text-[#003366] transition-colors p-1.5 shrink-0" title="Search">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))} className="flex items-center gap-1.5 font-bold text-xs text-white bg-gradient-to-r from-[#003366] to-cyan-600 px-4 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap shrink-0">
              <MessageSquare className="w-3.5 h-3.5" /> Ask GDB AI
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-1 shrink-0"></div>
            
            <Link to="/notifications" className="relative text-slate-500 hover:text-[#003366] transition-colors p-1.5 shrink-0">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
            </Link>
            
            <Link to="/profile" className="flex items-center gap-2 group p-1 rounded-full hover:bg-slate-100 transition-colors pr-2 shrink-0">
              <div className="w-7 h-7 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm group-hover:shadow-md transition-shadow">
                {user?.full_name?.[0] || 'A'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden xl:block whitespace-nowrap">{user?.full_name?.split(' ')[0]}</span>
            </Link>
            
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors p-1.5 shrink-0" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            <Link to="/notifications" className="relative text-[#003366] p-2">
              <Bell className="w-6 h-6" />
              {unread > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#003366] p-2">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[72px] z-40 bg-white border-t border-slate-200 overflow-y-auto lg:hidden animate-fade-in shadow-xl">
          <div className="p-4 space-y-4">
            <button onClick={() => { setMobileOpen(false); window.dispatchEvent(new CustomEvent('toggle-ai-chat')) }} className="w-full flex items-center justify-center gap-2 bg-[#003366] text-white font-semibold text-sm py-3 rounded-lg mb-6 shadow-md">
              <MessageSquare className="w-4 h-4" /> Ask GDB AI
            </button>
            
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Banking Services</p>
              {PRIMARY_NAV.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-[#003366] font-medium hover:bg-slate-50 rounded-lg">
                  {item.label}
                </Link>
              ))}
            </div>
            
            <div className="border-t border-slate-100 pt-4 mt-2 space-y-1">
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">
                <User className="w-5 h-5" /> Profile Settings
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium">
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <AIChatWidget />
      <main className={`pt-24 pb-16 ${location.pathname === '/dashboard' ? '' : 'max-w-7xl mx-auto px-4 md:px-8 w-full'}`}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
