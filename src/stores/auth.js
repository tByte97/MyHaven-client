import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('access_token') || null,
    user: null, 
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post('http://127.0.0.1:8000/api/token/', {
          username: username,
          password: password
        });

        const accessToken = response.data.access;
        this.token = accessToken;
        localStorage.setItem('access_token', accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        return true;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('access_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }
});