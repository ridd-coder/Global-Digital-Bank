import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { accountAPI } from '../../services/api'
import TransactionTable from '../../components/TransactionTable'
import { PageLoader } from '../../components/LoadingSpinner'
import { History } from 'lucide-react'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdraw', label: 'Withdrawals' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'create', label: 'Account Open' },
  { value: 'close', label: 'Closed' },
  { value: 'reopen', label: 'Reopened' },
]

export default function TransactionHistory() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.account) return
    setLoading(true)
    accountAPI.transactions(user.account.account_number, filter)
      .then(res => setTransactions(res.data.transactions || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false))
  }, [user?.account?.account_number, filter])

  return (
    <div>
      <div className="page-header">
        <h1>Transaction History</h1>
        <p>Complete record of all transactions on your account.</p>
      </div>

      <div className="card">
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
          {FILTERS.map(f => (
            <button key={f.value}
              className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            {loading ? 'Loading...' : `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {loading ? (
          <PageLoader text="Loading transactions..." />
        ) : (
          <TransactionTable transactions={transactions} />
        )}
      </div>
    </div>
  )
}
