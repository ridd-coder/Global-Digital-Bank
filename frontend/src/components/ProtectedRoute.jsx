import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export function RequireCustomer({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'customer') return <Navigate to="/admin/dashboard" replace />
  return children
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/admin/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export function RedirectIfAuthenticated({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'customer') return <Navigate to="/dashboard" replace />
  return children
}
