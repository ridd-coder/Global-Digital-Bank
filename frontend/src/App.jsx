import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Layouts & Guards
import { RequireCustomer, RequireAdmin, RedirectIfAuthenticated } from './components/ProtectedRoute'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'

// Public Pages
import Landing from './pages/public/Landing'
import CustomerLogin from './pages/public/CustomerLogin'
import AdminLogin from './pages/public/AdminLogin'
import CreateAccount from './pages/public/CreateAccount'

// Customer Pages
import Dashboard from './pages/customer/Dashboard'
import Accounts from './pages/customer/Accounts'
import Transfer from './pages/customer/Transfer'
import Transactions from './pages/customer/Transactions'
import Beneficiaries from './pages/customer/Beneficiaries'

import Analytics from './pages/customer/Analytics'
import Statements from './pages/customer/Statements'
import Notifications from './pages/customer/Notifications'
import Security from './pages/customer/Security'
import Profile from './pages/customer/Profile'
import Bills from './pages/customer/Bills'
import Cards from './pages/customer/Cards'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFraud from './pages/admin/AdminFraud'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminTransactions from './pages/admin/AdminTransactions'
import AdminFraudMonitoring from './pages/admin/AdminFraudMonitoring'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<RedirectIfAuthenticated><CustomerLogin /></RedirectIfAuthenticated>} />
          <Route path="/admin/login" element={<RedirectIfAuthenticated><AdminLogin /></RedirectIfAuthenticated>} />
          <Route path="/register" element={<RedirectIfAuthenticated><CreateAccount /></RedirectIfAuthenticated>} />

          {/* Customer Routes */}
          <Route element={<RequireCustomer><CustomerLayout /></RequireCustomer>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/security" element={<Security />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/cards" element={<Cards />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/accounts" element={<AdminAccounts />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/fraud" element={<AdminFraudMonitoring />} />
            <Route path="/admin/fraud/:id" element={<AdminFraud />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
