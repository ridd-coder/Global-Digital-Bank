import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle, Loader, ChevronRight } from 'lucide-react'

const STEPS = ['Personal Info', 'Account Setup', 'Security']

export default function CreateAccount() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    email: '', full_name: '', date_of_birth: '', phone: '',
    account_type: 'savings', initial_deposit: 1000,
    password: '', confirm_password: '', pin: '', confirm_pin: '',
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name.trim()) return 'Full name is required.'
      if (!form.email) return 'Email is required.'
      if (!form.date_of_birth) return 'Date of birth is required.'
    }
    if (step === 1) {
      const min = form.account_type === 'savings' ? 1000 : 5000
      if (form.initial_deposit < min) return `Minimum initial deposit is ₹${min.toLocaleString()}.`
    }
    if (step === 2) {
      if (form.password.length < 8) return 'Password must be at least 8 characters.'
      if (form.password !== form.confirm_password) return 'Passwords do not match.'
      if (!/\d/.test(form.password)) return 'Password must contain at least one digit.'
      if (!/[A-Z]/.test(form.password)) return 'Password must contain one uppercase letter.'
      if (!/^\d{4}$/.test(form.pin)) return 'PIN must be exactly 4 digits.'
      if (form.pin !== form.confirm_pin) return 'PINs do not match.'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const res = await authAPI.register({
        email: form.email, full_name: form.full_name,
        date_of_birth: form.date_of_birth, phone: form.phone,
        account_type: form.account_type, initial_deposit: Number(form.initial_deposit),
        password: form.password, pin: form.pin,
      })
      const { access_token, refresh_token } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.userMessage || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const minDeposit = form.account_type === 'savings' ? 1000 : 5000

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0a3161]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#e4002b]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-[#0a3161] rounded-xl flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl text-[#003366]">Global Digital Bank</span>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm
                    ${i < step ? 'bg-[#00a859] text-white' : i === step ? 'bg-[#0a3161] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-semibold hidden sm:block ${i === step ? 'text-[#0a3161]' : 'text-slate-400'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-[#00a859]' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-[#003366] mb-6">{STEPS[step]}</h2>

          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-5 animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="space-y-4">
            {step === 0 && (
              <>
                <div><label className="label">Full Name *</label>
                  <input className="input bg-slate-50 focus:bg-white" placeholder="Alex Johnson" value={form.full_name} onChange={e => update('full_name', e.target.value)} /></div>
                <div><label className="label">Email Address *</label>
                  <input className="input bg-slate-50 focus:bg-white" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                <div><label className="label">Date of Birth * <span className="text-slate-400 font-normal">(must be 18+)</span></label>
                  <input className="input bg-slate-50 focus:bg-white" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} /></div>
                <div><label className="label">Phone Number</label>
                  <input className="input bg-slate-50 focus:bg-white" placeholder="+91 98765 43210" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="label">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['savings', 'current'].map(t => (
                      <button key={t} type="button" onClick={() => { update('account_type', t); update('initial_deposit', t === 'savings' ? 1000 : 5000) }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${form.account_type === t ? 'border-[#0a3161] bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <p className="font-bold text-[#003366] capitalize">{t}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Min: ₹{t === 'savings' ? '1,000' : '5,000'}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Initial Deposit (₹)</label>
                  <input className="input bg-slate-50 focus:bg-white font-semibold text-lg" type="number" min={minDeposit} value={form.initial_deposit}
                    onChange={e => update('initial_deposit', e.target.value)} />
                  <p className="text-xs text-slate-500 mt-1 font-medium">Minimum requirement: ₹{minDeposit.toLocaleString()}</p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} className="input bg-slate-50 focus:bg-white pr-12" placeholder="Min. 8 chars, 1 uppercase, 1 digit"
                      value={form.password} onChange={e => update('password', e.target.value)} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div><label className="label">Confirm Password</label>
                  <input type="password" className="input bg-slate-50 focus:bg-white" placeholder="••••••••"
                    value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} /></div>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-800 font-bold mb-0.5">Transaction PIN</p>
                  <p className="text-xs text-slate-600">Used to authorize withdrawals and transfers. Keep it secret.</p>
                </div>
                <div><label className="label">4-Digit PIN</label>
                  <input className="input bg-slate-50 focus:bg-white font-mono tracking-widest text-center text-xl" maxLength={4} placeholder="••••"
                    value={form.pin} onChange={e => update('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
                <div><label className="label">Confirm PIN</label>
                  <input className="input bg-slate-50 focus:bg-white font-mono tracking-widest text-center text-xl" maxLength={4} placeholder="••••"
                    value={form.confirm_pin} onChange={e => update('confirm_pin', e.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors" onClick={() => { setStep(s => s - 1); setError('') }}>Back</button>
            )}
            {step < 2 ? (
              <button className="flex-1 bg-[#0a3161] hover:bg-[#134987] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md" onClick={handleNext}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button className="flex-1 bg-[#0a3161] hover:bg-[#134987] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md" onClick={handleSubmit} disabled={loading}>
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Creating Account...' : 'Open Account'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0a3161] hover:text-[#e4002b] font-bold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
