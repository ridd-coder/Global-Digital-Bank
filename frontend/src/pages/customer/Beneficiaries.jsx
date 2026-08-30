import React, { useState, useEffect } from 'react'
import { beneficiaryAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Users, Plus, Trash2, ArrowUpRight, Search, Shield, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Add modal state
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', account_number: '', bank_name: '', nickname: '' })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const res = await beneficiaryAPI.list()
      setBeneficiaries(res.data.beneficiaries || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true); setError('')
    try {
      await beneficiaryAPI.add(form)
      setShowAdd(false)
      setForm({ name: '', account_number: '', bank_name: '', nickname: '' })
      await load()
    } catch (err) {
      setError(err.userMessage || 'Failed to add beneficiary.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary?')) return
    try {
      await beneficiaryAPI.delete(id)
      setBeneficiaries(bens => bens.filter(b => b.id !== id))
    } catch (err) {
      alert(err.userMessage || 'Delete failed')
    }
  }

  const filtered = beneficiaries.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.account_number.includes(search)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beneficiaries</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your saved payees</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary py-2.5">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            className="input pl-10" 
            placeholder="Search by name or account number..." 
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No beneficiaries found</p>
          <p className="text-slate-400 text-sm mt-1">Add a new beneficiary to make transfers easier.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b.id} className="card-hover p-5 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-950/50 border border-primary-900/50 rounded-xl flex items-center justify-center text-primary-400 font-bold text-lg">
                    {b.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{b.nickname || b.name}</h3>
                    {b.nickname && <p className="text-xs text-slate-400">{b.name}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(b.id)} className="text-slate-400 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-1 mb-6 flex-1">
                <p className="text-sm text-slate-500">Account: <span className="text-slate-700 font-mono tracking-wider">{b.masked_account}</span></p>
                <p className="text-sm text-slate-500">Bank: <span className="text-slate-700">{b.bank_name || 'Global Digital Bank'}</span></p>
              </div>

              <Link to="/transfer" state={{ to_account: b.account_number, beneficiary_id: b.id }} className="btn-secondary w-full py-2 text-sm justify-center">
                <ArrowUpRight className="w-4 h-4" /> Send Money
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Beneficiary</h2>
                <p className="text-xs text-slate-500 mt-0.5">Save a new payee for quick transfers</p>
              </div>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-400 text-sm flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              
              <div>
                <label className="label">Full Name</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Account Number</label>
                <input className="input font-mono" required value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
              </div>
              <div>
                <label className="label">Bank Name <span className="text-slate-400">(Optional)</span></label>
                <input className="input" placeholder="e.g. HDFC Bank" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Nickname <span className="text-slate-400">(Optional)</span></label>
                <input className="input" placeholder="e.g. Landlord" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
              </div>
              
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex gap-2">
                <Shield className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  New beneficiaries will be subjected to stricter fraud monitoring for the first 24 hours.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={adding} className="btn-primary flex-1">
                  {adding ? 'Saving...' : 'Save Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
