import React from 'react'
import { Shield, Lock, Key, UserCheck, Server, Database, RefreshCw, CheckCircle } from 'lucide-react'

const points = [
  { icon: Key, color: '#3B82F6', bg: '#DBEAFE', title: '1. PIN Hashing with bcrypt', desc: 'Customer PINs are never stored in plaintext. Before saving, each PIN is hashed using the bcrypt algorithm with 12 rounds of salting. Even database administrators cannot see customer PINs.' },
  { icon: Shield, color: '#EF4444', bg: '#FEE2E2', title: '2. Login Attempt Protection', desc: 'The system tracks consecutive failed login attempts per account. Each failed attempt increments the counter. The customer is shown exactly how many attempts remain.' },
  { icon: Lock, color: '#F59E0B', bg: '#FEF3C7', title: '3. Account Locking', desc: 'After 3 consecutive failed login attempts, the account is automatically locked. A locked account cannot be accessed even with the correct PIN. This prevents brute-force attacks.' },
  { icon: UserCheck, color: '#10B981', bg: '#D1FAE5', title: '4. Admin Unlock', desc: 'Only a verified administrator can unlock a locked account. When unlocked, the failed_login_attempts counter is reset to 0, and the lock is removed. The customer can then login again normally.' },
  { icon: Server, color: '#8B5CF6', bg: '#EDE9FE', title: '5. Role-Based Access Control', desc: 'Three roles exist: Public (unauthenticated), Customer, and Admin. Each Flask API endpoint is decorated with authorization guards. Customers cannot access admin endpoints. Admins cannot appear as customers. Route guards are enforced server-side.' },
  { icon: Database, color: '#06B6D4', bg: '#CFFAFE', title: '6. Data Persistence', desc: 'All account data (including PIN hashes, lock status, failed attempts) and all transactions are stored in CSV files. Data survives application restarts. No in-memory-only state is used for critical data.' },
  { icon: RefreshCw, color: '#F97316', bg: '#FFEDD5', title: '7. Backup and Restore', desc: 'The system supports one-click backup to timestamped directories and restore from the latest backup. The Delete All operation automatically creates a backup first to prevent accidental data loss.' },
]

export default function SecurityCenter() {
  return (
    <div>
      <div className="page-header">
        <h1>🔐 Security Center</h1>
        <p>How Global Digital Bank protects your data and prevents unauthorized access.</p>
      </div>

      {/* Summary badges */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)', border: 'none' }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Security Features Summary</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {[
            '✓ bcrypt PIN Hashing',
            '✓ 3-Strike Login Lockout',
            '✓ Automatic Account Locking',
            '✓ Admin-Only Unlock',
            '✓ Role-Based Access Control',
            '✓ Server-Side Route Guards',
            '✓ CSV Data Persistence',
            '✓ Automatic Backup on Delete',
            '✓ Session-Based Authentication',
          ].map(s => (
            <div key={s} style={{
              background: 'rgba(59,130,246,.2)', border: '1px solid rgba(59,130,246,.3)',
              borderRadius: '999px', padding: '0.3rem 0.85rem',
              color: 'var(--blue-light)', fontSize: '0.82rem', fontWeight: 600,
            }}>{s}</div>
          ))}
        </div>
      </div>

      {/* Detailed points */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {points.map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="card" style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{ width: 48, height: 48, background: bg, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={24} color={color} />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.35rem', fontSize: '1rem' }}>{title}</h3>
              <p className="text-sm" style={{ color: 'var(--gray-600)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
