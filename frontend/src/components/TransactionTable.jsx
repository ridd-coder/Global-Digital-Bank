import React from 'react'
import { formatDate, getOperationInfo, isCredit, isDebit, formatCurrency } from '../utils/formatters'
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'

function OperationIcon({ op }) {
  if (isCredit(op)) return <ArrowDownLeft size={16} color="var(--green)" />
  if (isDebit(op))  return <ArrowUpRight size={16} color="var(--red)" />
  return <RefreshCw size={16} color="var(--gray-400)" />
}

export default function TransactionTable({ transactions, emptyMessage = 'No transactions found.' }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <RefreshCw size={36} />
        <h4>{emptyMessage}</h4>
        <p>Transactions will appear here once activity is recorded.</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Operation</th>
            <th>Amount</th>
            <th>Balance After</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const info = getOperationInfo(txn.operation)
            const credit = isCredit(txn.operation)
            const debit  = isDebit(txn.operation)
            return (
              <tr key={txn.transaction_id}>
                <td>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                    {formatDate(txn.timestamp)}
                  </span>
                </td>
                <td>
                  <div className="flex items-center" style={{ gap: '0.5rem' }}>
                    <OperationIcon op={txn.operation} />
                    <span style={{ fontWeight: 600 }}>{info.label}</span>
                  </div>
                </td>
                <td>
                  <span className={credit ? 'txn-credit' : debit ? 'txn-debit' : 'txn-neutral'}>
                    {credit ? '+' : debit ? '−' : ''}{formatCurrency(Math.abs(txn.amount))}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(txn.balance_after)}</td>
                <td>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {txn.note || '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
