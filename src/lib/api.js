/**
 * API Service — Axios instance with Firebase token injection
 * 
 * Automatically attaches the Firebase ID token as Authorization header
 * when a user is logged in. Anonymous requests go through without a token.
 */
import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor — attach Firebase token if user is logged in
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // Silent — don't block requests if token retrieval fails
    console.warn('Token retrieval failed:', error.message);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ─── Auth API ─────────────────────────────────────────────────────
export const authAPI = {
  syncUser: (displayName) => api.post('/api/auth/sync', { displayName }),
  getMe: () => api.get('/api/auth/me'),
  adminLogin: (username, password) => api.post('/api/auth/admin/login', { username, password }),
  adminVerify: (token) => api.get('/api/auth/admin/verify', {
    headers: { Authorization: `Admin ${token}` }
  }),
};

// ─── Admin API ────────────────────────────────────────────────────
export const adminAPI = {
  getOverview: (token) => api.get('/api/admin/overview', {
    headers: { Authorization: `Admin ${token}` }
  }),
  getUsers: (token, limit = 50, offset = 0) => api.get('/api/admin/users', {
    headers: { Authorization: `Admin ${token}` },
    params: { limit, offset }
  }),
  getUserHistory: (token, userId, limit = 50) => api.get(`/api/admin/users/${userId}/history`, {
    headers: { Authorization: `Admin ${token}` },
    params: { limit }
  }),
  getAnalytics: (token) => api.get('/api/admin/analytics', {
    headers: { Authorization: `Admin ${token}` }
  }),
  clearCache: (token) => api.post('/api/admin/cache/clear', {}, {
    headers: { Authorization: `Admin ${token}` }
  }),
  getLogs: (token, limit = 100, level) => api.get('/api/admin/logs', {
    headers: { Authorization: `Admin ${token}` },
    params: { limit, level }
  }),

  // ─── Referral Management ──────────────────────────────────────
  updateUserRole: (token, userId, role) => api.put(`/api/admin/users/${userId}/role`, { role }, {
    headers: { Authorization: `Admin ${token}` }
  }),
  getApplications: (token, status) => api.get('/api/admin/applications', {
    headers: { Authorization: `Admin ${token}` },
    params: status ? { status } : {}
  }),
  reviewApplication: (token, appId, status, adminNotes) => api.put(`/api/admin/applications/${appId}`, {
    status, adminNotes
  }, { headers: { Authorization: `Admin ${token}` } }),
  getTransactions: (token, { limit, offset, customId } = {}) => api.get('/api/admin/transactions', {
    headers: { Authorization: `Admin ${token}` },
    params: { limit, offset, customId }
  }),
  importTransactions: (token, startDate, endDate) => api.post('/api/admin/transactions/import', {
    startDate, endDate
  }, { headers: { Authorization: `Admin ${token}` } }),
  getTransactionSummary: (token) => api.get('/api/admin/transactions/summary', {
    headers: { Authorization: `Admin ${token}` }
  }),
  getWithdrawals: (token, status) => api.get('/api/admin/withdrawals', {
    headers: { Authorization: `Admin ${token}` },
    params: status ? { status } : {}
  }),
  processWithdrawal: (token, id, status, adminNotes, paymentReference) => api.put(`/api/admin/withdrawals/${id}`, {
    status, adminNotes, paymentReference
  }, { headers: { Authorization: `Admin ${token}` } }),
  getSystemSettings: (token) => api.get('/api/admin/settings', {
    headers: { Authorization: `Admin ${token}` }
  }),
  updateSystemSetting: (token, key, value) => api.put('/api/admin/settings', { key, value }, {
    headers: { Authorization: `Admin ${token}` }
  }),
  getReferralOverview: (token) => api.get('/api/admin/referral-overview', {
    headers: { Authorization: `Admin ${token}` }
  }),
  getInfluencers: (token) => api.get('/api/admin/influencers', {
    headers: { Authorization: `Admin ${token}` }
  }),
  migrateReferralTables: (token) => api.post('/api/admin/migrate-referral', {}, {
    headers: { Authorization: `Admin ${token}` }
  }),
};

// ─── Referral API (user-facing) ───────────────────────────────────
export const referralAPI = {
  // Settings
  getSettings: (cookieUserId) => api.post('/api/referral/settings', { cookieUserId }),
  updateCode: (referralCode, cookieUserId) => api.put('/api/referral/settings', { referralCode, cookieUserId }),
  markModalSeen: (cookieUserId) => api.post('/api/referral/modal-seen', { cookieUserId }),
  migrateGuest: (cookieUserId) => api.post('/api/referral/migrate', { cookieUserId }),
  verifyCode: (code) => api.get(`/api/referral/verify/${encodeURIComponent(code)}`),

  // Creator application
  submitApplication: (data) => api.post('/api/referral/apply', data),
  getApplications: () => api.get('/api/referral/applications'),

  // Creator features
  getCreatorCode: () => api.get('/api/referral/creator/code'),
  setCreatorCode: (referralCode) => api.put('/api/referral/creator/code', { referralCode }),
  getEarnings: () => api.get('/api/referral/creator/earnings'),
  getChartData: (granularity = 'monthly', startDate, endDate) =>
    api.get('/api/referral/creator/chart', { params: { granularity, startDate, endDate } }),
  requestWithdrawal: (amount) => api.post('/api/referral/creator/withdraw', { amount }),
  getWithdrawals: () => api.get('/api/referral/creator/withdrawals'),

  // Notifications
  getNotifications: (unread) => api.get('/api/referral/notifications', { params: { unread } }),
  markNotificationsRead: (notificationIds) => api.post('/api/referral/notifications/read', { notificationIds }),

  // Profile (role info)
  getProfile: () => api.get('/api/referral/profile'),
};


export default api;
