import React, { useState } from 'react'
import { CreditCard, Lock, Unlock, Eye, EyeOff, Snowflake, Plane, Settings, CheckCircle2, Globe } from 'lucide-react'

export default function Cards() {
  const [showPin, setShowPin] = useState(false)
  const [cards, setCards] = useState([
    { id: 1, type: 'Debit', name: 'GDB Platinum Debit', number: '**** **** **** 4281', expiry: '12/28', status: 'Active', bg: 'from-blue-600 to-indigo-800' },
    { id: 2, type: 'Credit', name: 'Travel Rewards Credit', number: '**** **** **** 9032', expiry: '05/27', status: 'Frozen', bg: 'from-purple-600 to-fuchsia-800' }
  ])
  
  const [activeCard, setActiveCard] = useState(cards[0])

  const toggleFreeze = () => {
    const updatedStatus = activeCard.status === 'Active' ? 'Frozen' : 'Active'
    const updatedCard = { ...activeCard, status: updatedStatus }
    setActiveCard(updatedCard)
    setCards(cards.map(c => c.id === activeCard.id ? updatedCard : c))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-[#003366] flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-[#e4002b]" />
          Manage Cards
        </h1>
        <p className="text-slate-500 text-sm mt-1">Control your debit and credit cards, limits, and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {cards.map(card => (
              <div 
                key={card.id} 
                onClick={() => setActiveCard(card)}
                className={`min-w-[320px] h-48 rounded-2xl p-6 text-white cursor-pointer transition-all transform ${activeCard.id === card.id ? 'scale-100 ring-4 ring-[#003366]/20' : 'scale-95 opacity-70'} bg-gradient-to-br ${card.bg} shadow-xl relative overflow-hidden`}
              >
                {card.status === 'Frozen' && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <span className="bg-slate-900/80 px-4 py-2 rounded-full font-bold tracking-widest text-sm flex items-center gap-2">
                      <Snowflake className="w-4 h-4" /> FROZEN
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-8 relative z-0">
                  <span className="font-bold tracking-widest">{card.name}</span>
                  <CreditCard className="w-8 h-8 opacity-50" />
                </div>
                <div className="text-2xl font-mono tracking-widest mb-4 relative z-0">{card.number}</div>
                <div className="flex justify-between items-end relative z-0">
                  <div>
                    <p className="text-xs opacity-70 uppercase tracking-widest">Expires</p>
                    <p className="font-mono">{card.expiry}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 uppercase tracking-widest">Type</p>
                    <p className="font-bold">{card.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Card Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activeCard.status === 'Active' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {activeCard.status === 'Active' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Freeze Card</p>
                    <p className="text-xs text-slate-500">Temporarily block all transactions</p>
                  </div>
                </div>
                <button 
                  onClick={toggleFreeze}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeCard.status === 'Active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                >
                  {activeCard.status === 'Active' ? 'Freeze' : 'Unfreeze'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">View PIN</p>
                    <p className="text-xs text-slate-500">Securely view your 4-digit PIN</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPin(!showPin)}
                  className="px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Card Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">International Usage</p>
                    <p className="text-xs text-slate-500">Allow transactions outside your country</p>
                  </div>
                </div>
                <div className="w-11 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">Airport Lounge Access</p>
                    <p className="text-xs text-slate-500">4 complimentary visits remaining</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">View History</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">Transaction Limits</p>
                    <p className="text-xs text-slate-500">Daily limit: ₹1,00,000</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#003366] hover:underline cursor-pointer">Edit</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Recent Card Activity</h3>
            <div className="space-y-4">
              {[
                { merchant: 'Amazon.in', amount: 4500, date: 'Today' },
                { merchant: 'Uber Rides', amount: 350, date: 'Yesterday' },
                { merchant: 'Starbucks', amount: 450, date: '28 Aug 2026' }
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{tx.merchant}</p>
                    <p className="text-xs text-slate-500">{tx.date}</p>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">₹{tx.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
