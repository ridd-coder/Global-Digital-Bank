import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, TrendingUp, Lock, Bell, ArrowRight, BarChart3, Globe, ChevronRight, MessageCircle } from 'lucide-react'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role === 'customer') navigate('/dashboard')
    else if (user?.role === 'admin') navigate('/admin/dashboard')
  }, [user, navigate])

  const features = [
    { icon: Shield, title: 'AI Fraud Detection', desc: 'Real-time ML-powered transaction risk scoring with explainable alerts.', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Lock, title: 'Bank-Grade Security', desc: 'JWT auth, bcrypt hashing, 3-strike lockout, and full audit logging.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: TrendingUp, title: 'Smart Analytics', desc: 'Track spending by category, monthly flows, and transaction velocity.', color: 'text-violet-600', bg: 'bg-violet-50' },
    { icon: Bell, title: 'Real-Time Alerts', desc: 'Instant notifications for transactions, fraud detection, and security events.', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: BarChart3, title: 'Admin Dashboard', desc: 'Complete fraud monitoring, audit logs, and compliance reporting.', color: 'text-rose-600', bg: 'bg-rose-50' },
    { icon: Globe, title: 'Global Transfers', desc: 'Beneficiary management with integrated step-up verification for high-risk transfers.', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 shrink-0">
              <img src="/logo.jpg" alt="GDB Logo" className="h-12 object-contain mix-blend-multiply" />
              <span className="font-extrabold text-xl text-[#003366] hidden md:block tracking-tight whitespace-nowrap">Global Digital Bank</span>
            </div>
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
              <span className="hover:text-red-600 cursor-pointer transition-colors">Save</span>
              <span className="hover:text-red-600 cursor-pointer transition-colors">Invest</span>
              <span className="hover:text-red-600 cursor-pointer transition-colors">Borrow</span>
              <span className="hover:text-red-600 cursor-pointer transition-colors">Pay</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/admin/login" className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-2">Admin</Link>
            <Link to="/register" className="hidden sm:flex text-slate-700 font-semibold text-sm hover:text-red-600">Open Account</Link>
            <Link to="/login" className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-sm transition-colors flex items-center gap-2">
              <Lock className="w-4 h-4" /> Login
            </Link>
          </div>
        </div>
        
        {/* Secondary Nav Bar (Yellow) */}
        <div className="w-full bg-[#fbbc04] h-10 flex items-center justify-end px-6 text-xs font-medium text-amber-950 gap-6">
          <span className="cursor-pointer hover:underline">You are in Personal Banking</span>
          <span className="cursor-pointer hover:underline">ATM & Branch</span>
          <span className="cursor-pointer hover:underline">Help & Support</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-[120px] bg-slate-50">
        <div className="w-full">
          <img src="/hero.jpg" alt="Hero Banner" className="w-full h-[350px] md:h-[500px] object-cover" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl border border-slate-100 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
              World's best digital bank,<br/>
              <span className="text-red-600">now in your neighborhood.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Experience unlimited aspirations with zero-balance savings, AI-powered fraud protection, and global reach.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-sm text-base transition-colors inline-flex items-center gap-2">
                Open GDB Savings Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Demo credentials hint */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Demo Credentials</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
                <div>
                  <span className="text-slate-500 block text-xs">Customer:</span>
                  <span className="text-slate-800 font-mono font-medium">alex@gdb.demo<br/>Demo@1234</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Admin:</span>
                  <span className="text-slate-800 font-mono font-medium">admin@globaldigitalbank.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Enterprise-grade banking platform
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Every feature you'd expect from a production fintech product, built with real ML models and bank-grade security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow bg-white">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-6`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-3 text-lg">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fraud Demo Preview */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider mb-6">
                🚨 AI Fraud Engine
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Explainable AI fraud alerts
              </h2>
              <p className="text-slate-300 mb-8 leading-relaxed text-lg">
                Every flagged transaction shows exactly <em>why</em> it was suspicious —
                not just "AI detected fraud." Powered by Isolation Forest + deterministic rule engine.
              </p>
              <div className="space-y-3">
                {[
                  { signal: 'Amount significantly above normal', score: '+25' },
                  { signal: 'New beneficiary detected', score: '+20' },
                  { signal: 'New device (unrecognised)', score: '+15' },
                  { signal: 'Transaction at 2:47 AM', score: '+10' },
                ].map((item) => (
                  <div key={item.signal} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <span className="font-medium">• {item.signal}</span>
                    <span className="font-mono font-bold text-red-400">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Transaction Blocked</p>
                  <p className="text-3xl font-bold text-white">₹85,000.00</p>
                </div>
                <span className="bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-sm uppercase tracking-wider">CRITICAL</span>
              </div>
              <div className="space-y-4 mb-8">
                {['Feature Extraction', 'ML Anomaly Detection', 'Risk Scoring', 'Admin Alerted'].map((step, i) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">{i+1}</div>
                    <span className="font-medium">{step}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-slate-300 p-4 bg-slate-900 rounded-lg border border-slate-700">
                💡 Try the fraud demo: Log in as Alex Johnson and click "Simulate Suspicious Transaction"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo.jpg" alt="GDB Logo" className="h-8 object-contain mix-blend-multiply opacity-80" />
            <span className="text-slate-600 font-semibold">Global Digital Bank</span>
          </div>
          <p className="text-slate-500 text-sm">
            Portfolio project · AI-Powered Banking Platform
          </p>
        </div>
      </footer>
      
      {/* Floating Chat Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50">
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  )
}
