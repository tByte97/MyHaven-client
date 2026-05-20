<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { usePreferencesStore } from './stores/preferences';
import BottomNav from './components/BottomNav.vue';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PiggyBank,
  Settings,
  LogOut,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const preferences = usePreferencesStore();

const authlessRoutes = ['Login', 'Register'];
const showDock = computed(() => auth.isAuthenticated && !authlessRoutes.includes(route.name) && !route.meta.webApp);

const navItems = computed(() => {
  const isEnglish = preferences.language === 'en';
  return [
    { id: 'dashboard', to: '/dashboard', label: isEnglish ? 'Dashboard' : 'Дашборд', icon: LayoutDashboard },
    { id: 'operations', to: '/operations', label: isEnglish ? 'Operations' : 'Операції', icon: ArrowLeftRight },
    { id: 'analytics', to: '/analytics', label: isEnglish ? 'Analytics' : 'Аналітика', icon: BarChart3 },
    { id: 'budgets', to: '/budgets', label: isEnglish ? 'Budgets' : 'Бюджети', icon: PiggyBank },
    { id: 'settings', to: '/settings', label: isEnglish ? 'Settings' : 'Налаштування', icon: Settings },
  ];
});

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-app-gradient">
    <!-- Top bar (brand + logout) -->
    <header
      v-if="showDock"
      class="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-dark-card/70 border-b border-white/30 dark:border-white/10"
    >
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">MyHaven</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Фінансовий помічник</p>
        </div>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition"
        >
          <LogOut :size="18" />
          {{ preferences.language === 'en' ? 'Logout' : 'Вийти' }}
        </button>
      </div>
    </header>

    <main class="min-h-screen pb-28">
      <router-view />
    </main>

    <BottomNav v-if="showDock" :items="navItems" />
  </div>
</template>
