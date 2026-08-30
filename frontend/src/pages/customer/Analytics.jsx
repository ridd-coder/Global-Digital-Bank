import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  BarChart3, TrendingUp, TrendingDown, Calendar, Target, Activity, PieChart as PieChartIcon, ArrowRight
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const COLORS = ['#0a3161', '#e4002b', '#ffb81c', '#00a859', '#8b5cf6', '#ec4899', '#06b6d4']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-xl">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 font-medium capitalize">{entry.name}</span>
            </div>
            <span className="font-bold text-slate-900">{fmt(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.get()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
      <h1 className="text-xl font-bold text-slate-700 mb-2">Analytics Unavailable</h1>
      <p className="text-slate-500">Failed to load analytics data.</p>
    </div>
  )

  const { monthly_data = [], category_spending = [], total_balance = 0, avg_transaction = 0, largest_transaction = 0 } = data
  
  // Format for Recharts
  const chartData = [...monthly_data].reverse() // Older to newer

  // Top cards values calculated from monthly data
  const totalIncome = monthly_data.reduce((acc, m) => acc + m.income, 0)
  const totalExpense = monthly_data.reduce((acc, m) => acc + m.expense, 0)
  const netCashflow = totalIncome - totalExpense

  return (
    <div className="space-y-8 animate-fade-in pb-12 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0a3161]">Investments & Analytics</h1>
          <p className="text-slate-500 mt-1 font-medium">Visualize your wealth, cash flow, and spending trends.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e4002b]/10 border border-[#e4002b]/20 w-max shadow-sm">
          <Activity className="w-4 h-4 text-[#e4002b] animate-pulse" />
          <span className="text-sm font-bold text-[#e4002b]">Live Market Data Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Income (6m)</span>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{fmt(totalIncome)}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">+12.5% from last period</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Expense (6m)</span>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{fmt(totalExpense)}</p>
          <p className="text-xs text-red-500 font-semibold mt-2">Well within your budget</p>
        </div>
        
        <div className="bg-gradient-to-br from-[#0a3161] to-[#134987] rounded-2xl shadow-md p-6 relative overflow-hidden group hover:shadow-lg transition-shadow text-white">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full filter blur-xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm text-blue-200 font-bold uppercase tracking-wider">Avg Transaction</span>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Target className="w-5 h-5 text-[#ffb81c]" />
            </div>
          </div>
          <p className="text-3xl font-extrabold relative z-10">{fmt(avg_transaction)}</p>
          <button className="text-xs text-cyan-300 font-bold mt-2 flex items-center gap-1 hover:gap-2 transition-all relative z-10">
            View Spending Rules <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#0a3161]" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-xl">Cash Flow Overview</h2>
                <p className="text-slate-500 text-sm font-medium">Income vs Expenses over the last 6 months</p>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full mt-4">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-100">
                No historical data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a3161" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0a3161" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e4002b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#e4002b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Area type="monotone" name="Income" dataKey="Income" stroke="#0a3161" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" name="Expense" dataKey="Expense" stroke="#e4002b" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-6 h-6 text-[#ffb81c]" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-xl">Spending by Category</h2>
              <p className="text-slate-500 text-sm font-medium">Where your money went</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] relative flex flex-col items-center justify-center">
            {(() => {
              const expenseData = category_spending.map(c => ({ name: c.category, value: c.amount }))
              if (expenseData.length === 0) {
                return <div className="text-slate-400 font-medium text-sm bg-slate-50 w-full h-full flex items-center justify-center rounded-xl border border-slate-100">No expenses recorded yet.</div>
              }
              return (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            {category_spending.map((entry, index) => (
              <div key={entry.category} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-700 font-bold capitalize">{entry.category}</span>
                </div>
                <span className="font-bold text-[#0a3161]">{fmt(entry.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
