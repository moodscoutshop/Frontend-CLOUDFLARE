/**
 * API Service — Axios instance with Firebase token injection
 * 
 * Automatically attaches the Firebase ID token as Authorization header
 * when a user is logged in. Anonymous requests go through without a token.
 */
import axios from 'axios';
import { auth } from './firebase';

export const API_URL = process.env.REACT_APP_API_URL || 'https://backend-cloudflare.moodscoutshop.workers.dev';

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
  approveAllWithdrawals: (token, withdrawalIds) => api.post('/api/admin/withdrawals/approve-all', {
    withdrawalIds
  }, { headers: { Authorization: `Admin ${token}` } }),
  updateUserWithdrawalMode: (token, userId, mode) => api.put(`/api/admin/users/${userId}/withdrawal-mode`, {
    mode
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
  initiateConnectOnboarding: (returnPath) => api.post('/api/referral/payout/connect/onboard', { returnPath }),
  getConnectStatus: () => api.get('/api/referral/payout/connect/status'),
  openConnectPayoutManagement: () => api.post('/api/referral/payout/connect/manage'),

  // Notifications
  getNotifications: (unread) => api.get('/api/referral/notifications', { params: { unread } }),
  markNotificationsRead: (notificationIds) => api.post('/api/referral/notifications/read', { notificationIds }),

  // Profile (role info)
  getProfile: () => api.get('/api/referral/profile'),
};

export const shopifyAffiliateAPI = {
  submitApplication: (data) => api.post('/api/shopify-affiliates/apply', data),
  getApplications: () => api.get('/api/shopify-affiliates/applications'),
  getDashboard: () => api.get('/api/shopify-affiliates/dashboard'),
  getWithdrawals: () => api.get('/api/shopify-affiliates/withdrawals'),
  requestWithdrawal: (amount) => api.post('/api/shopify-affiliates/withdrawals', { amount }),
  getCode: () => api.get('/api/shopify-affiliates/code'),
  setCode: (referralCode) => api.put('/api/shopify-affiliates/code', { referralCode }),
};

// ─── Bug / Crash Report API ───────────────────────────────────────
export const reportAPI = {
  // type: 'auto' | 'user'
  submit: (payload) => api.post('/api/report', payload),
};

export const adminReportAPI = {
  list: (token, { status, type } = {}) => api.get('/api/admin/reports', {
    headers: { Authorization: `Admin ${token}` },
    params: { ...(status ? { status } : {}), ...(type ? { type } : {}) },
  }),
  stats: (token) => api.get('/api/admin/reports/stats', { headers: { Authorization: `Admin ${token}` } }),
  setStatus: (token, id, status) => api.patch(`/api/admin/reports/${id}`, { status }, { headers: { Authorization: `Admin ${token}` } }),
  remove: (token, id) => api.delete(`/api/admin/reports/${id}`, { headers: { Authorization: `Admin ${token}` } }),
  migrate: (token) => api.post('/api/admin/migrate-error-reports', {}, { headers: { Authorization: `Admin ${token}` } }),
};

// ─── Blog API (public) ────────────────────────────────────────────
export const blogAPI = {
  list: ({ limit = 20, offset = 0, featured } = {}) =>
    api.get('/api/blog', { params: { limit, offset, ...(featured ? { featured: true } : {}) } }),
  nav: () => api.get('/api/blog/nav'),
  getBySlug: (slug) => api.get(`/api/blog/${encodeURIComponent(slug)}`),
};

// ─── Blog API (admin) ─────────────────────────────────────────────
const adminHeaders = (token) => ({ headers: { Authorization: `Admin ${token}` } });
export const adminBlogAPI = {
  list: (token) => api.get('/api/admin/blog', adminHeaders(token)),
  get: (token, id) => api.get(`/api/admin/blog/${id}`, adminHeaders(token)),
  create: (token, data) => api.post('/api/admin/blog', data, adminHeaders(token)),
  update: (token, id, data) => api.put(`/api/admin/blog/${id}`, data, adminHeaders(token)),
  setStatus: (token, id, status) => api.patch(`/api/admin/blog/${id}/status`, { status }, adminHeaders(token)),
  remove: (token, id) => api.delete(`/api/admin/blog/${id}`, adminHeaders(token)),
  uploadImage: (token, file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/api/admin/blog/upload', form, {
      headers: { Authorization: `Admin ${token}`, 'Content-Type': 'multipart/form-data' },
    });
  },
  migrate: (token) => api.post('/api/admin/migrate-blog', {}, adminHeaders(token)),
};

export const adminShopifyAffiliateAPI = {
  getApplications: (token, status) => api.get('/api/admin/shopify-affiliates/applications', {
    headers: { Authorization: `Admin ${token}` },
    params: status ? { status } : {},
  }),
  reviewApplication: (token, id, status, adminNotes) => api.put(`/api/admin/shopify-affiliates/applications/${id}`, {
    status,
    adminNotes,
  }, { headers: { Authorization: `Admin ${token}` } }),
  getDevelopers: (token) => api.get('/api/admin/shopify-affiliates/developers', {
    headers: { Authorization: `Admin ${token}` },
  }),
  updateCommission: (token, userId, commissionRate) => api.put(`/api/admin/shopify-affiliates/developers/${userId}/commission`, {
    commissionRate,
  }, { headers: { Authorization: `Admin ${token}` } }),
  getAttributions: (token) => api.get('/api/admin/shopify-affiliates/attributions', {
    headers: { Authorization: `Admin ${token}` },
  }),
  updateAttribution: (token, shopDomain, referralCode, plan = 'pro') => api.put(`/api/admin/shopify-affiliates/attributions/${encodeURIComponent(shopDomain)}`, {
    referralCode,
    plan,
  }, { headers: { Authorization: `Admin ${token}` } }),
  getLedger: (token) => api.get('/api/admin/shopify-affiliates/ledger', {
    headers: { Authorization: `Admin ${token}` },
  }),
  addManualLedger: (token, data) => api.post('/api/admin/shopify-affiliates/ledger/manual', data, {
    headers: { Authorization: `Admin ${token}` },
  }),
};


export default api;
