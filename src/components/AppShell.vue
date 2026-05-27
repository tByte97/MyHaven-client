<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { usePreferencesStore } from '../stores/preferences';
import BrandMark from './BrandMark.vue';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PiggyBank,
  Upload,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const preferences = usePreferencesStore();
const menuOpen = ref(false);

const navItems = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/operations', label: 'Операції', icon: ArrowLeftRight },
  { to: '/analytics', label: 'Аналітика', icon: BarChart3 },
  { to: '/budgets', label: 'Бюджети', icon: PiggyBank },
  { to: '/files', label: 'Виписки', icon: Upload },
  { to: '/settings', label: 'Налаштування', icon: Settings },
];

const fullName = computed(() => {
  const user = auth.user || {};
  return [user.first_name || user.firstName, user.last_name || user.lastName].filter(Boolean).join(' ');
});

const initials = computed(() => {
  const name = fullName.value || auth.user?.username || 'MH';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

function isActive(to) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to));
}

function logout() {
  auth.logout();
  router.push('/login');
}

onMounted(() => {
  preferences.setLanguage('uk', false);
  preferences.setDisplayCurrency('UAH', false);
  if (!auth.user) {
    auth.fetchUser();
  }
});
</script>

<template>
  <div class="mh-shell min-h-screen text-[color:var(--app-ink)]">
    <aside class="mh-sidebar hidden lg:flex">
      <div class="px-5 py-5 flex items-center gap-3 border-b border-[color:var(--app-border)]">
        <BrandMark class="size-9 rounded-lg gradient-sky shadow-glow" image-class="h-[74%] w-[74%] object-contain" />
        <div>
          <div class="font-accent text-xl leading-none text-[color:var(--app-heading)]">MyHaven</div>
          <div class="text-[10px] text-[color:var(--app-muted)] uppercase tracking-[0.24em] mt-1">
            Особисті фінанси
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="mh-nav-item"
          :class="{ 'mh-nav-item-active': isActive(item.to) }"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="px-3 py-3 border-t border-[color:var(--app-border)]">
        <div class="glass rounded-lg p-3">
          <div class="text-xs text-[color:var(--app-muted)] mb-1">Робочий простір</div>
          <div class="text-sm font-medium truncate text-[color:var(--app-heading)]">{{ fullName || auth.user?.username || 'MyHaven' }}</div>
          <div class="text-[11px] text-[color:var(--app-muted)] truncate">{{ auth.user?.email || 'UAH · Українська' }}</div>
        </div>
      </div>
    </aside>

    <div class="min-w-0 flex-1 flex flex-col">
      <header class="mh-topbar">
        <div class="relative hidden sm:block max-w-md w-full">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--app-muted)]" :size="17" />
          <input class="mh-input h-9 pl-9 text-sm" placeholder="Пошук транзакцій, категорій..." />
        </div>
        <div class="sm:hidden flex items-center gap-2">
          <BrandMark class="size-8 rounded-lg gradient-sky" image-class="h-[72%] w-[72%] object-contain" />
          <span class="font-accent text-lg">MyHaven</span>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button class="mh-icon-button relative" type="button" aria-label="Сповіщення">
            <Bell :size="17" />
            <span class="absolute top-2 right-2 size-1.5 rounded-full bg-[color:var(--app-accent)]"></span>
          </button>
          <div class="relative">
            <button class="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[color:var(--app-soft-hover)] transition" @click="menuOpen = !menuOpen">
              <span class="size-8 rounded-full bg-sky-500/15 text-sky-300 grid place-items-center text-xs font-semibold">
                {{ initials }}
              </span>
              <span class="hidden md:block text-sm">{{ fullName || auth.user?.username || 'Профіль' }}</span>
              <ChevronDown :size="15" class="text-[color:var(--app-muted)]" />
            </button>
            <div v-if="menuOpen" class="absolute right-0 mt-2 w-56 glass-strong rounded-lg shadow-elevated overflow-hidden z-50">
              <RouterLink class="block px-4 py-3 text-sm hover:bg-[color:var(--app-soft-hover)]" to="/settings" @click="menuOpen = false">
                Налаштування
              </RouterLink>
              <button class="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-300 hover:bg-rose-500/10" @click="logout">
                <LogOut :size="16" /> Вийти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="mh-main">
        <slot />
      </main>
    </div>
  </div>
</template>
