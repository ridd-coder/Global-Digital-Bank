import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react'

export default function AdminLogin() {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await adminLogin(form.email, form.password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.userMessage || 'Invalid admin credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0a3161]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#e4002b]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 relative">
          <div className="flex justify-end mb-2">
            <button 
              type="button" 
              onClick={() => setForm({ email: 'admin@globaldigitalbank.com', password: 'Admin@SecurePass1' })}
              className="text-xs bg-[#ffb81c] text-[#0a3161] font-bold px-3 py-1.5 rounded shadow-sm hover:bg-[#e6a210] transition-colors"
            >
              Fill Demo Admin
            </button>
          </div>
          <div className="w-16 h-16 bg-[#0a3161] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#003366]">Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Global Digital Bank — Operations Center</p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm animate-fade-in font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="label">Admin Email</label>
              <input type="email" className="input bg-slate-50 focus:bg-white" value={form.email}
                placeholder="admin@globaldigitalbank.com"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>

            <div>
              <label className="label flex justify-between">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input bg-slate-50 focus:bg-white pr-12"
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#0a3161] hover:bg-[#134987] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md" disabled={loading}>
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6 font-medium">
          <Link to="/login" className="hover:text-[#0a3161] transition-colors">← Customer login</Link>
        </p>
      </div>
    </div>
  )
}
