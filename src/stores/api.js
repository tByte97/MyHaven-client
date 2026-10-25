import axios from 'axios';
import { API_BASE } from '../config';

const API = API_BASE;

export default {
  // ─── Auth ─────────────────────────────
  login: (data) => axios.post(`${API}/api/users/auth/login/`, data),
  verifyLoginTOTP: (data) => axios.post(`${API}/api/users/auth/verify-totp/`, data),
  register: (data) => axios.post(`${API}/api/users/register/`, data),
  getCurrentUser: () => axios.get(`${API}/api/users/me/`),

  // ─── Dashboard ────────────────────────
  getDashboard: () => axios.get(`${API}/transactions/api/dashboard/`),
  getStatistics: (months = 6) => axios.get(`${API}/transactions/api/statistics/`, { params: { months } }),

  // ─── Transactions ─────────────────────
  getTransactions: (params = {}) => axios.get(`${API}/transactions/api/list/`, { params }),
  createTransaction: (data) => axios.post(`${API}/transactions/api/create/`, data),
  deleteTransaction: (id) => axios.delete(`${API}/transactions/api/${id}/`),

  // ─── Categories ───────────────────────
  getCategories: () => axios.get(`${API}/transactions/api/categories/`),

  // ─── Calendar ─────────────────────────
  getCalendar: (year, month) => axios.get(`${API}/transactions/api/calendar/`, { params: { year, month } }),
  getCalendarDay: (year, month, day) => axios.get(`${API}/transactions/api/calendar/${year}/${month}/${day}/`),

  // ─── Budgets ──────────────────────────
  getBudgets: (month) => axios.get(`${API}/api/budgets/`, { params: month ? { month } : {} }),
  createBudget: (data) => axios.post(`${API}/api/budgets/`, data),
  updateBudget: (id, data) => axios.patch(`${API}/api/budgets/${id}/`, data),
  deleteBudget: (id) => axios.delete(`${API}/api/budgets/${id}/`),

  // ─── Uploads / Files ──────────────────
  getUploads: () => axios.get(`${API}/transactions/api/uploads/`),
  uploadFile: (formData, config = {}) => axios.post(`${API}/transactions/api/uploads/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  }),
  deleteUpload: (id) => axios.delete(`${API}/transactions/api/uploads/${id}/`),
  getBanks: () => axios.get(`${API}/transactions/api/banks/`),

  // ─── Profile ──────────────────────────
  getProfile: () => axios.get(`${API}/api/users/profile/`),
  updateProfile: (data) => axios.patch(`${API}/api/users/profile/`, data),
  changePassword: (data) => axios.post(`${API}/api/users/change-password/`, data),
  deleteAccount: (data) => axios.post(`${API}/api/users/delete-account/`, data),
  exportData: () => axios.get(`${API}/api/users/export-data/`),

  // ─── Telegram Link ───────────────────
  telegramWebAppAuth: (initData) => axios.post(`${API}/api/telegram/webapp-auth/`, { init_data: initData }),
  createTelegramLinkCode: () => axios.post(`${API}/api/users/telegram/link-code/`),
  unlinkTelegram: () => axios.delete(`${API}/api/users/telegram/unlink/`),

  // ─── TOTP 2FA ─────────────────────────
  getTOTPSetup: () => axios.get(`${API}/api/users/totp/setup/`),
  enableTOTP: (data) => axios.post(`${API}/api/users/totp/enable/`, data),
  disableTOTP: (data) => axios.post(`${API}/api/users/totp/disable/`, data),
  verifyTOTP: (data) => axios.post(`${API}/api/users/totp/verify/`, data),

  // ─── Preferences & Notifications ──────
  updatePreferences: (data) => axios.patch(`${API}/api/users/preferences/`, data),
  updateNotificationSettings: (data) => axios.patch(`${API}/api/users/notifications/`, data),
};
