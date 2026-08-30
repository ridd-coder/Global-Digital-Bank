import React, { useState } from 'react'
import { transactionAPI } from '../../services/api'
import { Download, FileText, Calendar, Filter, Loader } from 'lucide-react'

export default function Statements() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    from_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    format: 'csv'
  })

  const handleDownload = () => {
    setLoading(true)
    const url = transactionAPI.downloadStatement(form.from_date, form.to_date, form.format)
    
    // Simulate download for portfolio demo purposes
    setTimeout(() => {
      window.open(`http://localhost:8000${url}`, '_blank')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statements</h1>
        <p className="text-slate-500 text-sm mt-0.5">Generate and download your account statements</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
          <div className="w-10 h-10 bg-primary-950/50 rounded-lg flex items-center justify-center text-primary-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Custom Statement</h2>
            <p className="text-sm text-slate-500">Select a date range and format to export.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> From Date</label>
              <input type="date" className="input" value={form.from_date} onChange={e => setForm(f => ({...f, from_date: e.target.value}))} />
            </div>
            <div>
              <label className="label flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> To Date</label>
              <input type="date" className="input" value={form.to_date} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({...f, to_date: e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" /> Format</label>
            <div className="flex gap-3">
              {['csv', 'json'].map(fmt => (
                <button key={fmt} onClick={() => setForm(f => ({...f, format: fmt}))}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                    form.format === fmt 
                      ? 'border-[#0a3161] bg-blue-50 text-[#0a3161] font-semibold' 
                      : 'border-slate-200 hover:border-surface-600 text-slate-600'
                  }`}>
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleDownload} disabled={loading} className="btn-primary w-full py-3 mt-4">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loading ? 'Generating...' : `Download ${form.format.toUpperCase()} Statement`}
          </button>
        </div>
      </div>
    </div>
  )
}
