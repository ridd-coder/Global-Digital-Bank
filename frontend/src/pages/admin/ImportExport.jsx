import React, { useState, useEffect, useRef } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from '../../components/Toast'
import { ConfirmDialog } from '../../components/Modal'
import { Download, Upload, Database, Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ImportExport() {
  const [backupInfo, setBackupInfo] = useState(null)
  const [confirm, setConfirm] = useState(null) // 'restore' | 'delete'
  const [deleteText, setDeleteText] = useState('')
  const [loading, setLoading] = useState({})
  const fileRef = useRef()

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }))

  useEffect(() => {
    adminAPI.backupInfo().then(r => setBackupInfo(r.data)).catch(() => {})
  }, [])

  const handleBackup = async () => {
    setLoad('backup', true)
    try {
      await adminAPI.backup()
      toast.success('Backup created successfully!')
      adminAPI.backupInfo().then(r => setBackupInfo(r.data)).catch(() => {})
    } catch (err) {
      toast.error(err.userMessage || 'Backup failed.')
    } finally { setLoad('backup', false) }
  }

  const handleRestore = async () => {
    setLoad('restore', true)
    try {
      await adminAPI.restore()
      toast.success('Accounts restored from latest backup!')
      setConfirm(null)
    } catch (err) {
      toast.error(err.userMessage || 'Restore failed.')
    } finally { setLoad('restore', false) }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoad('import', true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await adminAPI.importAccounts(fd)
      toast.success(res.data.message)
    } catch (err) {
      toast.error(err.userMessage || 'Import failed.')
    } finally {
      setLoad('import', false)
      fileRef.current.value = ''
    }
  }

  const handleDeleteAll = async () => {
    if (deleteText !== 'DELETE ALL') {
      toast.error('Type DELETE ALL exactly to confirm.')
      return
    }
    setLoad('delete', true)
    try {
      await adminAPI.deleteAll('DELETE ALL')
      toast.success('All accounts deleted. Backup was created automatically.')
      setConfirm(null)
      setDeleteText('')
    } catch (err) {
      toast.error(err.userMessage || 'Delete failed.')
    } finally { setLoad('delete', false) }
  }

  const Section = ({ icon: Icon, bg, color, title, desc, children }) => (
    <div className="card">
      <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: 44, height: 44, background: bg, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
        <div>
          <h3 style={{ marginBottom: 0, fontSize: '1rem' }}>{title}</h3>
          <p className="text-sm text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Import / Export & Backup</h1>
        <p>Manage account data, create backups, and restore from backup.</p>
      </div>

      <div className="grid-2">
        {/* Export */}
        <Section icon={Download} bg="#D1FAE5" color="#10B981" title="Export Accounts" desc="Download all accounts as CSV">
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Export all current accounts to a CSV file for external use or backup.
          </p>
          <a href="/api/admin/export" className="btn btn-success btn-full" download="gdb_accounts.csv">
            <Download size={16} /> Download CSV
          </a>
        </Section>

        {/* Import */}
        <Section icon={Upload} bg="#DBEAFE" color="#3B82F6" title="Import Accounts" desc="Upload a CSV file to import accounts">
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Upload a properly formatted CSV file. This will replace the current accounts dataset.
          </p>
          <input type="file" accept=".csv" ref={fileRef} onChange={handleImport} style={{ display: 'none' }} />
          <button className="btn btn-primary btn-full" onClick={() => fileRef.current.click()} disabled={loading.import}>
            {loading.import ? <><div className="spinner spinner-sm" /> Importing...</> : <><Upload size={16} /> Choose CSV File</>}
          </button>
        </Section>

        {/* Backup */}
        <Section icon={Database} bg="#EDE9FE" color="#8B5CF6" title="Backup Accounts" desc="Create a timestamped backup">
          {backupInfo?.available && (
            <div className="alert alert-success" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
              <CheckCircle size={14} />
              Latest backup: <strong>{backupInfo.backup?.name}</strong> ({backupInfo.backup?.count} backup{backupInfo.backup?.count !== 1 ? 's' : ''} total)
            </div>
          )}
          <button className="btn btn-full" onClick={handleBackup} disabled={loading.backup}
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: 'white', border: 'none' }}>
            {loading.backup ? <><div className="spinner spinner-sm" /> Creating...</> : <><Database size={16} /> Create Backup</>}
          </button>
        </Section>

        {/* Restore */}
        <Section icon={RefreshCw} bg="#CFFAFE" color="#06B6D4" title="Restore Accounts" desc="Restore from the latest backup">
          <div className="alert alert-warning" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
            <AlertTriangle size={14} />
            This will replace the current accounts with the latest backup. This cannot be undone.
          </div>
          <button className="btn btn-full" onClick={() => setConfirm('restore')} disabled={loading.restore}
            style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', color: 'white', border: 'none' }}>
            <RefreshCw size={16} /> Restore from Backup
          </button>
        </Section>

        {/* Delete All */}
        <div className="card" style={{ gridColumn: '1 / -1', border: '2px solid var(--red)', background: '#FFF5F5' }}>
          <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, background: '#FEE2E2', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={22} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ marginBottom: 0, fontSize: '1rem', color: 'var(--red)' }}>⚠️ Delete All Accounts</h3>
              <p className="text-sm" style={{ color: '#7F1D1D' }}>Permanently removes all accounts. Auto-backup is created first.</p>
            </div>
          </div>
          <button className="btn btn-danger" onClick={() => { setConfirm('delete'); setDeleteText('') }}>
            <Trash2 size={16} /> Delete All Accounts
          </button>
        </div>
      </div>

      {/* Restore Confirm */}
      <ConfirmDialog
        isOpen={confirm === 'restore'}
        onClose={() => setConfirm(null)}
        onConfirm={handleRestore}
        title="Restore Accounts"
        message="Are you sure? This will replace ALL current accounts with the latest backup. Type RESTORE to confirm."
        confirmText="Restore"
        loading={loading.restore}
      />

      {/* Delete Confirm */}
      {confirm === 'delete' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--red)' }}>⚠️ Delete All Accounts</h3>
            </div>
            <div className="modal-body">
              <div className="confirm-warning">
                <h4>WARNING — Irreversible Action</h4>
                <p>This will permanently remove ALL accounts from the active dataset. An automatic backup will be created before deletion.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Type <strong>DELETE ALL</strong> to confirm:</label>
                <input className="form-input" style={{ borderColor: 'var(--red)' }}
                  value={deleteText} onChange={e => setDeleteText(e.target.value)}
                  placeholder="DELETE ALL" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={loading.delete}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteAll}
                disabled={loading.delete || deleteText !== 'DELETE ALL'}>
                {loading.delete ? <><div className="spinner spinner-sm" /> Deleting...</> : 'Delete All Accounts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
