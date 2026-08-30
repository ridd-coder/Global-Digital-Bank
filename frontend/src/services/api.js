import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 (token expired) — try refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          })
          const newToken = res.data.access_token
          localStorage.setItem('access_token', newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    const msg = err.response?.data?.detail?.message
      || err.response?.data?.detail
      || err.message
      || 'An unexpected error occurred.'
    return Promise.reject({ ...err, userMessage: typeof msg === 'string' ? msg : JSON.stringify(msg) })
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  adminLogin: (email, password) => api.post('/auth/admin/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePin: (current_pin, new_pin) => api.post('/auth/change-pin', { current_pin, new_pin }),
  changePassword: (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password }),
}

// ── Accounts ──────────────────────────────────────────────────────────────────
export const accountAPI = {
  list: () => api.get('/accounts'),
  get: (id) => api.get(`/accounts/${id}`),
  deposit: (id, amount) => api.post(`/accounts/${id}/deposit`, { amount }),
  withdraw: (id, amount, pin) => api.post(`/accounts/${id}/withdraw`, { amount, pin }),
  withdrawalLimit: (id) => api.get(`/accounts/${id}/withdrawal-limit`),
  transactions: (id, params = {}) => api.get(`/accounts/${id}/transactions`, { params }),
  close: (id, pin) => api.post(`/accounts/${id}/close`, null, { params: { pin } }),
  reopen: (id, pin) => api.post(`/accounts/${id}/reopen`, null, { params: { pin } }),
}

// ── Transfers ──────────────────────────────────────────────────────────────────
export const transferAPI = {
  initiate: (data) => api.post('/transfers', data),
  simulateSuspicious: (data) => api.post('/transfers/simulate-suspicious', data),
}

// ── Beneficiaries ─────────────────────────────────────────────────────────────
export const beneficiaryAPI = {
  list: () => api.get('/beneficiaries'),
  add: (data) => api.post('/beneficiaries', data),
  delete: (id) => api.delete(`/beneficiaries/${id}`),
}

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionAPI = {
  list: (params = {}) => api.get('/transactions', { params }),
  get: (id) => api.get(`/transactions/${id}`),
  downloadStatement: (from_date, to_date, format = 'csv') =>
    `/api/transactions/statement/download?from_date=${from_date}&to_date=${to_date}&format=${format}`,
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  get: () => api.get('/analytics'),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  list: (params = {}) => api.get('/notifications', { params }),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}

// ── Security ──────────────────────────────────────────────────────────────────
export const securityAPI = {
  overview: () => api.get('/security/overview'),
  loginHistory: () => api.get('/security/login-history'),
  devices: () => api.get('/security/devices'),
}

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (message) => api.post('/ai/chat', { message }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  customers: (params = {}) => api.get('/admin/customers', { params }),
  accounts: (params = {}) => api.get('/admin/accounts', { params }),
  transactions: (params = {}) => api.get('/admin/transactions', { params }),
  unlock: (id) => api.post(`/admin/accounts/${id}/unlock`),
  report: () => api.get('/admin/report'),
  auditLogs: (params = {}) => api.get('/admin/audit-logs', { params }),
  // Fraud
  fraudAlerts: (params = {}) => api.get('/admin/fraud', { params }),
  fraudAlert: (id) => api.get(`/admin/fraud/${id}`),
  resolveAlert: (id, data) => api.post(`/admin/fraud/${id}/resolve`, data),
}

export default api
