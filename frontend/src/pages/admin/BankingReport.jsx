import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import { PageLoader } from '../../components/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText } from 'lucide-react'

export default function BankingReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.report().then(r => setReport(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader text="Generating report..." />

  const chartData = report ? [
    { name: 'Savings', value: report.savings_count || 0 },
    { name: 'Current', value: report.current_count || 0 },
    { name: 'Active', value: report.active_accounts },
    { name: 'Inactive', value: report.inactive_accounts },
    { name: 'Locked', value: report.locked_accounts },
  ] : []

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Banking Report</h1>
          <p>Complete overview of the Global Digital Bank system.</p>
        </div>
        <a href="/api/admin/export" className="btn btn-primary" download="gdb_accounts.csv">
          <FileText size={16} /> Export CSV
        </a>
      </div>

      {report && (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            {[
              ['Total Accounts', report.total_accounts, '#DBEAFE'],
              ['Active Accounts', report.active_accounts, '#D1FAE5'],
              ['Inactive Accounts', report.inactive_accounts, '#FEE2E2'],
              ['Locked Accounts', report.locked_accounts, '#FEF3C7'],
              ['Total Balance', formatCurrency(report.total_balance), '#EDE9FE'],
              ['Average Balance', formatCurrency(report.average_balance), '#CFFAFE'],
            ].map(([k, v, bg]) => (
              <div key={k} className="card" style={{ background: bg, border: 'none' }}>
                <div className="stat-card-label">{k}</div>
                <div className="stat-card-value">{v}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Account Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Customer Demographics</h3>
              {report.youngest && (
                <div style={{ padding: '0.75rem', background: 'var(--blue-glow)', borderRadius: 'var(--radius)', marginBottom: '0.75rem' }}>
                  <div className="text-xs" style={{ fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Youngest Customer</div>
                  <div style={{ fontWeight: 700 }}>{report.youngest.name} (Age: {report.youngest.age})</div>
                  <div className="text-sm text-muted">#{report.youngest.account_number} · {formatCurrency(report.youngest.balance)}</div>
                </div>
              )}
              {report.oldest && (
                <div style={{ padding: '0.75rem', background: 'var(--green-bg)', borderRadius: 'var(--radius)' }}>
                  <div className="text-xs" style={{ fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>Oldest Customer</div>
                  <div style={{ fontWeight: 700 }}>{report.oldest.name} (Age: {report.oldest.age})</div>
                  <div className="text-sm text-muted">#{report.oldest.account_number} · {formatCurrency(report.oldest.balance)}</div>
                </div>
              )}
              {!report.youngest && <div className="empty-state" style={{ padding: '1.5rem' }}><p>No customer data yet.</p></div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
