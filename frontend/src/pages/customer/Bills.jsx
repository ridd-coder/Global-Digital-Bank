import React, { useState } from 'react'
import { FileText, Search, Zap, Droplet, Wifi, Tv, Home, Phone, ChevronRight, CheckCircle2 } from 'lucide-react'

export default function Bills() {
  const [activeCategory, setActiveCategory] = useState('All')
  
  const categories = ['All', 'Electricity', 'Water', 'Internet', 'Mobile', 'DTH']
  
  const billers = [
    { id: 1, name: 'State Electricity Board', type: 'Electricity', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', due: 1450, date: '12 Sep 2026' },
    { id: 2, name: 'Municipal Water', type: 'Water', icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-50', due: 340, date: '15 Sep 2026' },
    { id: 3, name: 'FastNet Broadband', type: 'Internet', icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-50', due: 999, date: '18 Sep 2026' },
    { id: 4, name: 'Mobile Postpaid', type: 'Mobile', icon: Phone, color: 'text-purple-500', bg: 'bg-purple-50', due: 599, date: '22 Sep 2026' },
    { id: 5, name: 'Sky DTH', type: 'DTH', icon: Tv, color: 'text-rose-500', bg: 'bg-rose-50', due: 0, date: '-' },
  ]
  
  const filteredBillers = activeCategory === 'All' ? billers : billers.filter(b => b.type === activeCategory)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#e4002b]" />
          Pay Bills
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage and pay all your utility bills in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search biller by name or category..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:bg-white transition-colors"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar mb-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat 
                      ? 'bg-[#003366] text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredBillers.map(biller => (
                <div key={biller.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${biller.bg}`}>
                      <biller.icon className={`w-6 h-6 ${biller.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-[#003366] transition-colors">{biller.name}</h3>
                      <p className="text-xs text-slate-500">{biller.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      {biller.due > 0 ? (
                        <>
                          <p className="font-bold text-slate-900">₹{biller.due}</p>
                          <p className="text-[10px] font-bold text-red-500 uppercase">Due {biller.date}</p>
                        </>
                      ) : (
                        <p className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Paid
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#003366] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#0a3161] to-[#134987] rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2">Auto-Pay Activated</h3>
            <p className="text-blue-100 text-sm mb-6">Never miss a due date. We will automatically pay your selected bills 3 days before they are due.</p>
            <button className="w-full bg-white text-[#003366] font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">
              Manage Auto-Pay
            </button>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Recent Payments</h3>
            <div className="space-y-4">
              {[
                { name: 'FastNet Broadband', amount: 999, date: '18 Aug 2026' },
                { name: 'State Electricity Board', amount: 1350, date: '12 Aug 2026' },
                { name: 'Mobile Postpaid', amount: 599, date: '22 Jul 2026' }
              ].map((p, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.date}</p>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">₹{p.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
