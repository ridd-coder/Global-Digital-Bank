import React, { useState, useEffect } from 'react'
import { authAPI, securityAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Shield, Key, Smartphone, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function Security() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // PIN Change State
  const [pinForm, setPinForm] = useState({ current_pin: '', new_pin: '', confirm_pin: '' })
  const [pinStatus, setPinStatus] = useState({ loading: false, error: '', success: '' })

  useEffect(() => {
    Promise.all([securityAPI.overview(), securityAPI.loginHistory(), securityAPI.devices()])
      .then(([ov, hist, dev]) => setData({ overview: ov.data, history: hist.data.history, devices: dev.data.devices }))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleChangePin = async (e) => {
    e.preventDefault()
    if (pinForm.new_pin !== pinForm.confirm_pin) {
      setPinStatus({ error: 'PINs do not match.', success: '', loading: false }); return
    }
    setPinStatus({ loading: true, error: '', success: '' })
    try {
      await authAPI.changePin(pinForm.current_pin, pinForm.new_pin)
      setPinStatus({ loading: false, error: '', success: 'PIN successfully updated.' })
      setPinForm({ current_pin: '', new_pin: '', confirm_pin: '' })
    } catch (err) {
      setPinStatus({ loading: false, error: err.userMessage || 'Failed to change PIN.', success: '' })
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Center</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account security and devices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/50 border border-emerald-900/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Security Status</h2>
                <p className="text-xs text-emerald-400 font-medium">Protected by GDB AI</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Account Lockout</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Failed Logins</span>
                <span className="text-slate-800 font-medium">{data.overview?.failed_login_attempts || 0} / 3</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Active Devices</span>
                <span className="text-slate-800 font-medium">{data.devices?.length || 1}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Key className="w-4 h-4" /> Change Transaction PIN
            </h3>
            <form onSubmit={handleChangePin} className="space-y-4">
              {pinStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-400 text-sm flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {pinStatus.error}
                </div>
              )}
              {pinStatus.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-400 text-sm flex gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> {pinStatus.success}
                </div>
              )}
              
              <div>
                <label className="label">Current PIN</label>
                <input type="password" maxLength={4} className="input font-mono tracking-widest text-center" required 
                  value={pinForm.current_pin} onChange={e => setPinForm(f => ({ ...f, current_pin: e.target.value.replace(/\D/g, '') }))} />
              </div>
              <div>
                <label className="label">New PIN</label>
                <input type="password" maxLength={4} className="input font-mono tracking-widest text-center" required 
                  value={pinForm.new_pin} onChange={e => setPinForm(f => ({ ...f, new_pin: e.target.value.replace(/\D/g, '') }))} />
              </div>
              <div>
                <label className="label">Confirm New PIN</label>
                <input type="password" maxLength={4} className="input font-mono tracking-widest text-center" required 
                  value={pinForm.confirm_pin} onChange={e => setPinForm(f => ({ ...f, confirm_pin: e.target.value.replace(/\D/g, '') }))} />
              </div>
              
              <button type="submit" disabled={pinStatus.loading} className="btn-secondary w-full">
                {pinStatus.loading ? 'Updating...' : 'Update PIN'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" /> Recent Login Activity
            </h3>
            <div className="space-y-3">
              {data.history?.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${log.action === 'LOGIN_SUCCESS' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-red-950/50 text-red-400'}`}>
                      {log.action === 'LOGIN_SUCCESS' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{log.action === 'LOGIN_SUCCESS' ? 'Successful Login' : 'Failed Login Attempt'}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{log.ip_address || 'Unknown IP'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">{new Date(log.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
