import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { accountAPI, transactionAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  Search, Mic, Send, Shield, TrendingUp, TrendingDown, ArrowRight, ArrowLeftRight, CreditCard, 
  PieChart, Activity, Lock, Smartphone, CheckCircle2, ChevronRight, AlertTriangle, XCircle, 
  Clock, Zap, Target, HelpCircle, Phone, FileText, Globe, Building, Wallet, Award, ArrowUpRight, ArrowDownLeft, Plus, MessageSquare, PiggyBank, Home
} from 'lucide-react'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Trending')
  const [aiQuery, setAiQuery] = useState('')
  const [hiddenAlerts, setHiddenAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gdb_dismissed_alerts') || '[]') } catch { return [] }
  })

  const dismissAlert = (txnId) => {
    setHiddenAlerts(prev => {
      const next = [...prev, txnId]
      localStorage.setItem('gdb_dismissed_alerts', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [accRes, txnRes] = await Promise.all([
          accountAPI.list(),
          transactionAPI.list({ per_page: 10 }),
        ])
        setAccounts(accRes.data.accounts || [])
        setTransactions(txnRes.data.transactions || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner text="Loading your banking ecosystem..." />

  const primaryAccount = accounts[0]
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  
  const recentIncome = transactions.filter(t => ['deposit', 'transfer_in', 'interest'].includes(t.type) && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const recentExpense = transactions.filter(t => ['withdrawal', 'transfer_out'].includes(t.type) && t.status === 'completed').reduce((s, t) => s + t.amount, 0)

  const suspiciousTxns = transactions.filter(t => t.risk_level === 'critical' || t.risk_level === 'high' || t.status === 'blocked')
  const normalTxns = transactions.filter(t => t.risk_level === 'low' || !t.risk_level).slice(0, 5)

  return (
    <div className="bg-slate-50 min-h-screen -mt-6">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-r from-[#0a3161] via-[#134987] to-[#0a3161] text-white pt-16 pb-24 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#e4002b] rounded-full mix-blend-screen filter blur-[120px] transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Bank Smarter.<br/>
              <span className="text-[#ffb81c]">Live Better.</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg">
              One intelligent platform for your money, payments, cards, investments, and financial security.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/accounts" className="bg-[#e4002b] hover:bg-[#c20024] text-white font-bold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all">
                View Accounts
              </Link>
              <Link to="/transfer" className="bg-white text-[#0a3161] hover:bg-slate-50 font-bold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all">
                Make a Payment
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative h-[400px]">
            {/* Abstract Financial Visualization */}
            <div className="absolute right-10 top-10 w-72 h-48 bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-2xl transform rotate-[-5deg] animate-[float_6s_ease-in-out_infinite]">
              <div className="flex justify-between items-center mb-6">
                <Shield className="w-8 h-8 text-[#ffb81c]" />
                <span className="text-xs font-bold text-[#0a3161] bg-[#ffb81c] px-2 py-1 rounded">AI SECURED</span>
              </div>
              <div className="w-12 h-8 bg-white/30 rounded mb-4"></div>
              <div className="text-xl font-mono tracking-widest text-white/90">**** **** **** 4281</div>
            </div>
            
            <div className="absolute right-40 bottom-10 w-64 h-32 bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-2xl transform rotate-[10deg] animate-[float_7s_ease-in-out_infinite_reverse]">
              <div className="text-sm text-blue-100 mb-2 font-medium">Real-time Fraud Check</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00a859] flex items-center justify-center shadow-lg border border-white/20">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Transaction Safe</div>
                  <div className="text-xs text-[#ffb81c] font-bold mt-0.5">Risk Score: 02/100</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20 space-y-12 pb-24">
        
        {/* 2. AI BANKING ASSISTANT */}
        <section className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 md:p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-[#0a3161]/5 rounded-xl md:w-auto w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-[#e4002b] to-[#b30022] rounded-full flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#0a3161] font-extrabold uppercase tracking-wide">Ask GDB AI</p>
            </div>
          </div>
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Ask anything about your money... (e.g. How much did I spend this month?)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-slate-700 font-medium focus:outline-none focus:border-[#0a3161] focus:ring-1 focus:ring-[#0a3161]"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#e4002b] transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button className="hidden md:flex bg-[#0a3161] text-white px-6 py-4 rounded-xl items-center gap-2 hover:bg-[#134987] font-bold shadow-md transition-colors">
            Ask <Send className="w-4 h-4" />
          </button>
        </section>

        {/* 3. FINANCIAL OVERVIEW */}
        <section>
          <h2 className="text-2xl font-bold text-[#003366] mb-6">Your Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-500">Total Balance</p>
                <Wallet className="w-5 h-5 text-[#003366]" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-2">{fmt(totalBalance)}</p>
              <p className="text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-1 rounded">
                +2.4% from last month
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-500">Monthly Spending</p>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-2">{fmt(recentExpense || 45230)}</p>
              <p className="text-xs text-slate-500 font-medium">
                Available limit: {fmt(50000 - (primaryAccount?.daily_withdrawn || 0))}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-500">Total Savings</p>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-2">{fmt(125000)}</p>
              <p className="text-xs text-slate-500 font-medium">
                Across 2 deposits
              </p>
            </div>

            <div className="bg-[#003366] p-6 rounded-2xl shadow-sm text-white">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-blue-200">Credit Score</p>
                <Award className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">842</p>
              <p className="text-xs text-cyan-300 font-medium">
                Excellent · Updated today
              </p>
            </div>
          </div>
        </section>

        {/* 4. QUICK ACTIONS */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#003366] mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Send Money', icon: ArrowUpRight, to: '/transfer' },
                { label: 'Receive Money', icon: ArrowDownLeft, to: '/transfer' },
                { label: 'Pay Bills', icon: FileText, to: '/bills' },
                { label: 'Add Beneficiary', icon: Plus, to: '/beneficiaries' },
                { label: 'Manage Cards', icon: CreditCard, to: '/cards' },
              ].map(action => (
                <Link key={action.label} to={action.to} className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <action.icon className="w-6 h-6 text-[#003366]" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5. BANKING PRODUCTS */}
        <section>
          <h2 className="text-2xl font-bold text-[#003366] mb-6">Banking Solutions Built Around You</h2>
          <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-px mb-6 hide-scrollbar">
            {['Trending', 'Accounts', 'Deposits', 'Cards', 'Loans', 'Investments', 'Insurance'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-[#003366] text-[#003366]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {activeTab === 'Trending' && (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg text-[#003366] mb-2">Smart Savings Account</h3>
                  <p className="text-slate-600 text-sm mb-6">Flexible savings with intelligent money management and zero balance requirement.</p>
                  <button className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    Explore <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-white p-6 rounded-2xl border border-cyan-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                    <CreditCard className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h3 className="font-bold text-lg text-[#003366] mb-2">GDB Platinum Card</h3>
                  <p className="text-slate-600 text-sm mb-6">Premium rewards, 5% cashback on dining, and enhanced financial protection.</p>
                  <button className="text-cyan-700 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-lg text-[#003366] mb-2">Investment Plus</h3>
                  <p className="text-slate-600 text-sm mb-6">Build long-term wealth with intelligent AI-driven market insights and mutual funds.</p>
                  <button className="text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    Start Investing <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            {activeTab === 'Accounts' && (
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition-shadow col-span-full md:col-span-1">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-[#003366] mb-2">Checking Account</h3>
                <p className="text-slate-600 text-sm mb-6">Everyday banking with no hidden fees and free ATM withdrawals worldwide.</p>
                <button className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Open Account <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {activeTab === 'Deposits' && (
              <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 hover:shadow-lg transition-shadow col-span-full md:col-span-1">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                  <PiggyBank className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg text-[#003366] mb-2">Fixed Deposit</h3>
                <p className="text-slate-600 text-sm mb-6">Earn up to 7.5% p.a. with our secure and flexible fixed deposit options.</p>
                <button className="text-emerald-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Calculate Returns <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {activeTab === 'Cards' && (
              <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 hover:shadow-lg transition-shadow col-span-full md:col-span-1">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-[#003366] mb-2">Travel Rewards Card</h3>
                <p className="text-slate-600 text-sm mb-6">Zero forex markup and complimentary lounge access across 1000+ airports.</p>
                <Link to="/cards" className="text-purple-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Manage Cards <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
            {activeTab === 'Loans' && (
              <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border border-amber-100 hover:shadow-lg transition-shadow col-span-full md:col-span-1">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-lg text-[#003366] mb-2">Home Loan</h3>
                <p className="text-slate-600 text-sm mb-6">Make your dream home a reality with interest rates starting from 8.2% p.a.</p>
                <button className="text-amber-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Check Eligibility <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {activeTab === 'Investments' && (
              <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 hover:shadow-lg transition-shadow col-span-full md:col-span-1">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg text-[#003366] mb-2">Mutual Funds</h3>
                <p className="text-slate-600 text-sm mb-6">Diversified portfolios curated by experts to match your risk profile.</p>
                <button className="text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Start SIP <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {activeTab === 'Insurance' && (
              <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl border border-rose-100 hover:shadow-lg transition-shadow col-span-full md:col-span-1">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="font-bold text-lg text-[#003366] mb-2">Health Shield</h3>
                <p className="text-slate-600 text-sm mb-6">Comprehensive health cover for your family up to ₹50 Lakhs with no co-pay.</p>
                <button className="text-rose-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Get Quote <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 6. SMART FINANCIAL INSIGHTS & 7. AI FRAUD PROTECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-6">Your Money, Explained</h2>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-start">
                <div className="bg-orange-50 p-3 rounded-full">
                  <PieChart className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Dining expenses increased</h4>
                  <p className="text-sm text-slate-600 mb-2">Your dining expenses increased by 18% this month compared to last month.</p>
                  <Link to="/analytics" className="text-xs font-semibold text-orange-600 hover:underline inline-block">View Category Breakdown →</Link>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-start">
                <div className="bg-emerald-50 p-3 rounded-full">
                  <Target className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Savings Goal on Track</h4>
                  <p className="text-sm text-slate-600 mb-2">You are on track to reach your ₹50,000 emergency fund goal by November.</p>
                  <Link to="/analytics" className="text-xs font-semibold text-emerald-600 hover:underline inline-block">Manage Goals →</Link>
                </div>
              </div>
              <div className="bg-[#003366] p-5 rounded-2xl shadow-sm text-white flex gap-4 items-start">
                <div className="bg-white/20 p-3 rounded-full">
                  <Activity className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Subscription Optimization</h4>
                  <p className="text-sm text-blue-100 mb-2">GDB AI found 2 unused subscriptions. You could save ₹1,200/month by cancelling them.</p>
                  <Link to="/analytics" className="bg-white text-[#003366] text-xs font-bold px-3 py-1.5 rounded mt-1 hover:bg-slate-100 inline-block">Review Subscriptions</Link>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-[#003366]">AI Fraud Protection</h2>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">ACTIVE</span>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <p className="text-sm text-slate-600 mb-6">
                  GDB continuously analyzes transaction patterns using ML Isolation Forests to detect unusual activity and protect your money in real-time.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>Transaction Monitoring</span>
                    <span>1,240 Scanned Today</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400 w-[98%]"></div>
                    <div className="h-full bg-red-500 w-[2%] animate-pulse"></div>
                  </div>
                  <div className="flex gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Normal (98%)</span>
                    <span className="flex items-center gap-1 text-red-600"><div className="w-2 h-2 rounded-full bg-red-500"></div> Suspicious (2%)</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Alerts</h4>
                
                {suspiciousTxns.filter(txn => !hiddenAlerts.includes(txn.id)).length > 0 ? (
                  suspiciousTxns.filter(txn => !hiddenAlerts.includes(txn.id)).slice(0, 2).map(txn => (
                    <div key={txn.id} className="bg-white border border-red-200 rounded-xl p-4 shadow-sm relative overflow-hidden mb-4 last:mb-0 animate-fade-in">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                          <AlertTriangle className="w-4 h-4" /> Unusual transaction detected
                        </div>
                        <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">HIGH RISK</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-lg font-bold text-slate-900">{fmt(txn.amount)}</p>
                        <p className="text-sm text-slate-600">{txn.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(txn.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { alert('Card has been securely blocked.'); dismissAlert(txn.id) }} className="flex-1 bg-red-50 text-red-700 font-semibold text-xs py-2 rounded border border-red-200 hover:bg-red-100 transition-colors">Block Card</button>
                        <button onClick={() => dismissAlert(txn.id)} className="flex-1 bg-white text-slate-600 font-semibold text-xs py-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors">Mark Safe</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-fade-in">
                    <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-800">All Secure</p>
                    <p className="text-xs text-emerald-600">No suspicious activity detected recently.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* 8. RECENT TRANSACTIONS */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#003366]">Recent Activity</h2>
            <Link to="/transactions" className="text-[#003366] font-semibold text-sm hover:underline">View All Transactions</Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {normalTxns.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No recent transactions.</div>
              ) : normalTxns.map(t => {
                const isCredit = ['deposit', 'transfer_in', 'interest', 'account_open'].includes(t.type)
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        {isCredit ? <ArrowDownLeft className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-500 capitalize">{t.type.replace('_', ' ')} • {new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isCredit ? '+' : '-'}{fmt(t.amount)}
                      </p>
                      <span className={`text-[10px] font-bold uppercase ${t.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 9. FINANCIAL GOALS */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#003366]">Your Financial Goals</h2>
            <button className="text-[#003366] font-semibold text-sm hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" /> Create Goal
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-slate-900">Emergency Fund</span>
                <span className="text-sm font-semibold text-emerald-600">65%</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">₹65,000 / ₹1,00,000</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[65%]"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-slate-900">New Laptop</span>
                <span className="text-sm font-semibold text-blue-600">60%</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">₹48,000 / ₹80,000</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%]"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-slate-900">Vacation</span>
                <span className="text-sm font-semibold text-cyan-600">64%</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">₹32,000 / ₹50,000</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 w-[64%]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. SECURITY CENTER */}
        <section>
          <div className="bg-[#003366] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600 rounded-full filter blur-[80px] opacity-50"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-cyan-400" /> GDB Security Center
                </h2>
                <p className="text-blue-100 mb-6 max-w-xl">
                  Your account is protected by enterprise-grade security protocols. Review your security settings to ensure maximum protection.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> 2FA Enabled</span>
                  <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Device Verified</span>
                  <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fraud Protection Active</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center min-w-[200px]">
                <p className="text-sm font-bold text-blue-200 mb-2 uppercase tracking-wider">Security Score</p>
                <p className="text-5xl font-bold text-white mb-4">98<span className="text-2xl text-blue-300">/100</span></p>
                <Link to="/security" className="bg-white text-[#003366] font-bold text-sm w-full py-2.5 rounded hover:bg-slate-100 block">Manage Security</Link>
              </div>
            </div>
          </div>
        </section>

        {/* 12. SUPPORT SECTION */}
        <section>
          <h2 className="text-2xl font-bold text-[#003366] mb-6">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-shadow">
              <MessageSquare className="w-6 h-6 text-[#003366] mb-3" />
              <h4 className="font-bold text-slate-900">Chat with Support</h4>
              <p className="text-xs text-slate-500 mt-1">24/7 AI and human assistance</p>
            </div>
            <div onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-shadow">
              <FileText className="w-6 h-6 text-[#003366] mb-3" />
              <h4 className="font-bold text-slate-900">Service Requests</h4>
              <p className="text-xs text-slate-500 mt-1">Track your recent requests</p>
            </div>
            <Link to="/security" className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-shadow block">
              <Shield className="w-6 h-6 text-red-500 mb-3" />
              <h4 className="font-bold text-slate-900">Report Fraud</h4>
              <p className="text-xs text-slate-500 mt-1">Report lost card or scam</p>
            </Link>
            <div onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-shadow">
              <Phone className="w-6 h-6 text-[#003366] mb-3" />
              <h4 className="font-bold text-slate-900">Contact Us</h4>
              <p className="text-xs text-slate-500 mt-1">Toll-free numbers and email</p>
            </div>
          </div>
        </section>

      </div>
      
      {/* 13. FOOTER */}
      <footer className="bg-[#001122] text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-6">
              <Shield className="w-6 h-6 text-cyan-500" />
              GDB
            </div>
            <p className="text-sm">Premium digital banking powered by advanced AI and machine learning.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">GDB</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => alert('About GDB page coming soon!')} className="hover:text-cyan-400 transition-colors">About GDB</button></li>
              <li><button onClick={() => alert('Careers page coming soon!')} className="hover:text-cyan-400 transition-colors">Careers</button></li>
              <li><Link to="/security" className="hover:text-cyan-400 transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Banking</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/accounts" className="hover:text-cyan-400 transition-colors">Accounts</Link></li>
              <li><Link to="/beneficiaries" className="hover:text-cyan-400 transition-colors">Cards</Link></li>
              <li><Link to="/transactions" className="hover:text-cyan-400 transition-colors">Loans</Link></li>
              <li><Link to="/analytics" className="hover:text-cyan-400 transition-colors">Investments</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))} className="hover:text-cyan-400 transition-colors">Help Center</button></li>
              <li><button onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))} className="hover:text-cyan-400 transition-colors">Contact Support</button></li>
              <li><Link to="/security" className="hover:text-cyan-400 transition-colors">Report Fraud</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => alert('Privacy Policy is being updated.')} className="hover:text-cyan-400 transition-colors">Privacy</button></li>
              <li><button onClick={() => alert('Terms of Service is being updated.')} className="hover:text-cyan-400 transition-colors">Terms</button></li>
              <li><button onClick={() => alert('Disclosures page coming soon!')} className="hover:text-cyan-400 transition-colors">Disclosures</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Global Digital Bank. All rights reserved.</p>
          <p>Demo environment for enterprise architecture showcase.</p>
        </div>
      </footer>

    </div>
  )
}
