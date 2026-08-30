import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, Shield, Clock, Hash } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your personal information</p>
      </div>

      <div className="card border border-slate-200 p-0 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary-900 to-surface-900 border-b border-slate-200"></div>
        
        <div className="px-8 pb-8 relative">
          {/* Avatar */}
          <div className="w-24 h-24 bg-slate-100 border-4 border-surface-950 rounded-full flex items-center justify-center absolute -top-12">
            <span className="text-4xl font-bold text-slate-500">{user.full_name?.charAt(0)}</span>
          </div>

          <div className="pt-16">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{user.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {user.status === 'active' ? 'Active Account' : 'Locked Account'}
                  </span>
                  <span className="text-xs bg-primary-500/20 text-[#0a3161] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Personal Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Full Name</p>
                      <p className="font-medium text-slate-700">{user.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Email Address</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <p className="font-medium text-slate-700">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Account Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">User ID</p>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <p className="font-mono text-xs text-slate-600 bg-white p-1 rounded">{user.id}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Member Since</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <p className="font-medium text-slate-700">
                          {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
