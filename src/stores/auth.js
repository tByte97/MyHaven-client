import { defineStore } from 'pinia';
import axios from 'axios';
import api from './api';
import { usePreferencesStore } from './preferences';

function applyAccessToken(accessToken) {
  if (accessToken) {
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    user: null,
    pendingLoginToken: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    requiresTotp: (state) => !!state.pendingLoginToken,
  },

  actions: {
    completeSession(payload) {
      const accessToken = payload?.access || null;
      const refreshToken = payload?.refresh || null;

      this.token = accessToken;
      this.refreshToken = refreshToken;
      this.pendingLoginToken = null;

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      } else {
        localStorage.removeItem('access_token');
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      } else {
        localStorage.removeItem('refresh_token');
      }

      applyAccessToken(accessToken);
    },

    async login(username, password) {
      const response = await api.login({ username, password });

      if (response.data.requires_totp) {
        this.pendingLoginToken = response.data.login_token;
        return { requiresTotp: true };
      }

      this.completeSession(response.data);
      await this.fetchUser();
      await usePreferencesStore().hydrateFromServer();
      return { requiresTotp: false };
    },

    async verifyTotp(code) {
      const response = await api.verifyLoginTOTP({
        login_token: this.pendingLoginToken,
        code,
      });
      this.completeSession(response.data);
      await this.fetchUser();
      await usePreferencesStore().hydrateFromServer();
      return true;
    },

    async register(payload) {
      await api.register(payload);
      return this.login(payload.username, payload.password);
    },

    async fetchUser() {
      try {
        const response = await api.getCurrentUser();
        this.user = response.data;
      } catch (e) {
        console.error('Failed to fetch user:', e);
      }
    },

    clearPendingLogin() {
      this.pendingLoginToken = null;
    },

    // Сесія Telegram WebApp: токен лише в пам'яті. У web.telegram.org WebApp
    // відкривається в iframe з нашим origin і через localStorage підмінив би
    // сесію основного сайту.
    async startWebAppSession(initData) {
      const response = await api.telegramWebAppAuth(initData);
      this.token = response.data.access;
      this.refreshToken = null;
      this.pendingLoginToken = null;
      applyAccessToken(this.token);
    },

    logout() {
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      this.pendingLoginToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      applyAccessToken(null);
    },
  },
});

applyAccessToken(localStorage.getItem('access_token'));
