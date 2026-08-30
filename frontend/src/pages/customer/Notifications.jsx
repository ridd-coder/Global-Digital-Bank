import React, { useState, useEffect } from 'react'
import { notificationAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Bell, ShieldAlert, CreditCard, Activity, CheckCircle, Info, Trash2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const TYPE_ICON = {
  system: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-950/50', border: 'border-blue-900/50' },
  transaction: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-950/50', border: 'border-emerald-900/50' },
  fraud: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-950/50', border: 'border-red-900/50' },
  security: { icon: Activity, color: 'text-amber-400', bg: 'bg-amber-950/50', border: 'border-amber-900/50' },
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const res = await notificationAPI.list({ per_page: 50 })
      setNotifications(res.data.notifications || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
    } catch (e) {
      console.error(e)
    }
  }

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <LoadingSpinner />

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Notifications
            {unreadCount > 0 && <span className="badge-critical text-sm">{unreadCount} new</span>}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Stay updated on your account activity</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm py-1.5">
            <CheckCircle className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden divide-y divide-surface-800">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => {
            const cfg = TYPE_ICON[n.type] || TYPE_ICON['system']
            return (
              <div 
                key={n.id} 
                className={`p-5 flex gap-4 transition-colors ${!n.is_read ? 'bg-slate-100/30' : ''}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border}`}>
                  <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className={`font-semibold ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-slate-700' : 'text-slate-500'}`}>
                    {n.body}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
