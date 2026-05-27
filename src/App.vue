<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import BottomNav from './components/BottomNav.vue';
import AppShell from './components/AppShell.vue';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PiggyBank,
  Upload,
  Settings,
} from 'lucide-vue-next';

const route = useRoute();
const auth = useAuthStore();

const authlessRoutes = ['Login', 'Register'];
const showDock = computed(() => auth.isAuthenticated && !authlessRoutes.includes(route.name) && !route.meta.webApp);

const navItems = [
  { id: 'dashboard', to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'operations', to: '/operations', label: 'Операції', icon: ArrowLeftRight },
  { id: 'analytics', to: '/analytics', label: 'Аналітика', icon: BarChart3 },
  { id: 'budgets', to: '/budgets', label: 'Бюджети', icon: PiggyBank },
  { id: 'files', to: '/files', label: 'Виписки', icon: Upload },
  { id: 'settings', to: '/settings', label: 'Налаштування', icon: Settings },
];
</script>

<template>
  <div class="min-h-screen bg-app-gradient">
    <AppShell v-if="showDock">
      <router-view />
    </AppShell>

    <main v-else class="min-h-screen">
      <router-view />
    </main>

    <BottomNav v-if="showDock" :items="navItems" />
  </div>
</template>
