import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import TransactionTable from '../../components/TransactionTable'
import { PageLoader } from '../../components/LoadingSpinner'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdraw', label: 'Withdrawals' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'create', label: 'Created' },
  { value: 'close', label: 'Closed' },
  { value: 'reopen', label: 'Reopened' },
]

export default function AdminTransactionLog() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('')

  const load = () => {
    setLoading(true)
    adminAPI.transactions(filter, accountFilter)
      .then(r => setTransactions(r.data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter, accountFilter])

  return (
    <div>
      <div className="page-header">
        <h1>Transaction Log</h1>
        <p>Complete audit trail of all banking transactions.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <input
            placeholder="Filter by account number..."
            className="form-input"
            style={{ maxWidth: 220 }}
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.value}
                className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
          {loading ? 'Loading...' : `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
        </div>

        {loading ? <PageLoader text="Loading transactions..." /> : (
          <TransactionTable transactions={transactions} emptyMessage="No transactions found." />
        )}
      </div>
    </div>
  )
}
