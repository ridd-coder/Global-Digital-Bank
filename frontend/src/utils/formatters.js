// Formatting utilities

export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (isNaN(d)) return isoString
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateOnly(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (isNaN(d)) return isoString
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const OPERATION_LABELS = {
  deposit:      { label: 'Deposit',       color: 'credit' },
  withdraw:     { label: 'Withdrawal',    color: 'debit' },
  transfer_in:  { label: 'Transfer In',   color: 'credit' },
  transfer_out: { label: 'Transfer Out',  color: 'debit' },
  create:       { label: 'Account Open',  color: 'neutral' },
  close:        { label: 'Account Close', color: 'neutral' },
  reopen:       { label: 'Reopened',      color: 'neutral' },
  rename:       { label: 'Renamed',       color: 'neutral' },
  interest:     { label: 'Interest',      color: 'credit' },
}

export function getOperationInfo(op) {
  return OPERATION_LABELS[op] || { label: op, color: 'neutral' }
}

export function isCredit(op) {
  return ['deposit', 'transfer_in', 'interest', 'create'].includes(op)
}

export function isDebit(op) {
  return ['withdraw', 'transfer_out', 'close'].includes(op)
}
