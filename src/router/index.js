import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  // Transactions → Operations
  {
    path: '/transactions',
    redirect: '/operations',
  },
  {
    path: '/operations',
    name: 'Operations',
    component: () => import('../views/TransactionsView.vue'),
    meta: { requiresAuth: true },
  },
  // Statistics + Calendar → Analytics
  {
    path: '/statistics',
    redirect: '/analytics',
  },
  {
    path: '/calendar',
    redirect: '/analytics',
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../views/AnalyticsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/budgets',
    name: 'Budgets',
    component: () => import('../views/BudgetsView.vue'),
    meta: { requiresAuth: true },
  },
  // Profile → Settings
  {
    path: '/profile',
    redirect: '/settings',
  },
  {
    path: '/files',
    name: 'Files',
    component: () => import('../views/FilesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/uploads',
    redirect: '/files',
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/telegram-webapp',
    name: 'TelegramWebApp',
    component: () => import('../views/TelegramWebAppView.vue'),
    meta: { requiresAuth: true, webApp: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  const queryToken = to.query.access_token || to.query.token;

  if (queryToken && typeof queryToken === 'string') {
    auth.token = queryToken;
    localStorage.setItem('access_token', queryToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${queryToken}`;

    const cleanQuery = { ...to.query };
    delete cleanQuery.access_token;
    delete cleanQuery.token;
    next({ path: to.path, query: cleanQuery, replace: true });
    return;
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login');
  } else if ((to.name === 'Login' || to.name === 'Register') && auth.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
