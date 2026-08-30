import React, { useState } from 'react'
import { adminAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import { PageLoader } from '../../components/LoadingSpinner'
import { Search } from 'lucide-react'

export default function SearchAccounts() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await adminAPI.search(query)
      setResults(res.data.accounts || [])
      setSearched(true)
    } catch {} finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Search Accounts</h1>
        <p>Find accounts by name or account number.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input placeholder="Search by name or account number..."
              className="form-input" style={{ paddingLeft: '2.25rem' }}
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner spinner-sm" /> : <Search size={16} />}
            Search
          </button>
        </form>

        {loading && <PageLoader text="Searching..." />}

        {!loading && searched && (
          <>
            <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </div>
            {results.length === 0 ? (
              <div className="empty-state">
                <Search size={36} />
                <h4>No accounts found</h4>
                <p>Try a different name or account number.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ boxShadow: 'none', border: '1px solid var(--gray-200)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>A/C No.</th><th>Name</th><th>Age</th><th>Type</th>
                      <th>Balance</th><th>Status</th><th>Locked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(acc => (
                      <tr key={acc.account_number}>
                        <td style={{ fontWeight: 700, color: 'var(--blue)' }}>#{acc.account_number}</td>
                        <td style={{ fontWeight: 600 }}>{acc.name}</td>
                        <td>{acc.age}</td>
                        <td><span className={`badge ${acc.account_type === 'Savings' ? 'badge-blue' : 'badge-purple'}`}>{acc.account_type}</span></td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(acc.balance)}</td>
                        <td><span className={`badge ${acc.status === 'active' ? 'badge-green' : 'badge-red'}`}>{acc.status}</span></td>
                        <td><span className={`badge ${acc.is_locked ? 'badge-red' : 'badge-green'}`}>{acc.is_locked ? 'Locked' : 'No'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="empty-state">
            <Search size={48} />
            <h4>Search for Accounts</h4>
            <p>Enter a customer name or account number to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
