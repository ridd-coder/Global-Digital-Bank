import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react'

export default function CustomerLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptsRemaining, setAttemptsRemaining] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'object') {
        setError(detail.message || 'Login failed.')
        setAttemptsRemaining(detail.attempts_remaining)
      } else {
        setError(err.userMessage || 'Login failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0a3161] via-[#134987] to-[#0a3161] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#e4002b] rounded-full mix-blend-screen filter blur-[120px] transform translate-x-1/2 -translate-y-1/2 opacity-30"></div>
        <div className="relative text-center max-w-sm z-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-[#0a3161]" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">Global Digital Bank</h2>
          <p className="text-blue-100 leading-relaxed text-lg">
            AI-powered banking with real-time fraud detection, explainable risk scores, and bank-grade security.
          </p>
          <div className="mt-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-left">
            <p className="text-xs text-[#ffb81c] mb-2 font-bold uppercase tracking-wider">Demo Account</p>
            <p className="text-sm text-white">Email: <span className="font-mono font-bold">alex@gdb.demo</span></p>
            <p className="text-sm text-white">Password: <span className="font-mono font-bold">Demo@1234</span></p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#0a3161] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#0a3161]">Global Digital Bank</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-extrabold text-[#003366]">Welcome back</h1>
            <button 
              type="button" 
              onClick={() => setForm({ email: 'alex@gdb.demo', password: 'Demo@1234' })}
              className="text-xs bg-[#ffb81c] text-[#0a3161] font-bold px-3 py-1.5 rounded shadow-sm hover:bg-[#e6a210] transition-colors"
            >
              Fill Demo User
            </button>
          </div>
          <p className="text-slate-500 mb-8 font-medium">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{error}</p>
                  {attemptsRemaining !== null && (
                    <p className="mt-1 font-bold">{attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout.</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input bg-slate-50 focus:bg-white"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label flex justify-between">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input bg-slate-50 focus:bg-white pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#0a3161] hover:bg-[#134987] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md" disabled={loading}>
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-slate-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#0a3161] hover:text-[#e4002b] font-bold">
                Open one now
              </Link>
            </p>
            <p className="text-slate-400 text-xs font-medium">
              <Link to="/admin/login" className="hover:text-slate-600">Admin login →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
