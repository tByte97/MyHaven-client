<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import api from '../stores/api';
import { usePreferencesStore } from '../stores/preferences';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CreditCard,
  History,
  ListChecks,
  Loader2,
  Menu,
  PiggyBank,
  RefreshCw,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-vue-next';

const ABYSS = '#0A0F1E';
const FROST = '#E4F0F6';

const preferences = usePreferencesStore();
const activeTab = ref('money');
const isLoading = ref(true);
const isRefreshing = ref(false);
const errorMessage = ref('');
const lastSyncedAt = ref(null);
const refreshTimer = ref(null);
const searchText = ref('');

const dashboard = ref({
  total_expenses: 0,
  total_incomes: 0,
  balance: 0,
  recent_transactions: [],
  expenses_by_category: [],
});
const transactions = ref([]);
const budgets = ref([]);
const statistics = ref({
  monthly_summary: [],
  expense_categories: [],
  income_categories: [],
  by_bank_stats: [],
});

const tabs = [
  { id: 'money', label: 'Гроші', icon: Wallet },
  { id: 'history', label: 'Історія', icon: History },
  { id: 'reports', label: 'Звіти', icon: ListChecks },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
  { id: 'ai', label: 'AI', icon: Bot },
];

const aiHints = [
  'Додай витрату 250 грн на їжу вчора',
  'Покажи витрати за цей місяць',
  'Створи бюджет на продукти 3000 грн',
];

const monthStart = computed(() => `${new Date().toISOString().slice(0, 7)}-01`);
const totalIncomes = computed(() => Number(dashboard.value.total_incomes || 0));
const totalExpenses = computed(() => Number(dashboard.value.total_expenses || 0));
const balance = computed(() => Number(dashboard.value.balance || 0));
const savingsRate = computed(() => {
  if (!totalIncomes.value) return 0;
  return Math.max(0, Math.round(((totalIncomes.value - totalExpenses.value) / totalIncomes.value) * 100));
});

const filteredTransactions = computed(() => {
  const query = searchText.value.trim().toLowerCase();
  if (!query) return transactions.value;
  return transactions.value.filter((item) => {
    const description = String(item.description || '').toLowerCase();
    const category = String(item.category?.name || '').toLowerCase();
    return description.includes(query) || category.includes(query);
  });
});

const topCategories = computed(() => {
  const source = statistics.value.expense_categories?.length
    ? statistics.value.expense_categories
    : dashboard.value.expenses_by_category;
  return (source || []).slice(0, 5);
});

const monthlyBars = computed(() => {
  const items = statistics.value.monthly_summary || [];
  const max = Math.max(
    1,
    ...items.map((item) => Math.max(Math.abs(Number(item.total_expenses || 0)), Number(item.total_incomes || 0)))
  );
  return items.slice(-6).map((item) => ({
    ...item,
    expenseHeight: Math.max(8, (Math.abs(Number(item.total_expenses || 0)) / max) * 100),
    incomeHeight: Math.max(8, (Number(item.total_incomes || 0) / max) * 100),
  }));
});

function formatCurrency(value) {
  return preferences.formatCurrency(Number(value || 0), { maximumFractionDigits: 0 });
}

function formatDate(value) {
  if (!value) return 'Без дати';
  return preferences.formatDate(value, { day: '2-digit', month: 'short' });
}

function formatSyncTime(value) {
  if (!value) return 'ще не було';
  return value.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function transactionTone(amount) {
  return Number(amount) >= 0 ? 'income' : 'expense';
}

async function refreshData(showSpinner = true) {
  if (showSpinner) isRefreshing.value = true;
  errorMessage.value = '';
  try {
    const [dashboardRes, transactionsRes, budgetRes, statsRes] = await Promise.all([
      api.getDashboard(),
      api.getTransactions({ page_size: 20 }),
      api.getBudgets(monthStart.value),
      api.getStatistics(6),
    ]);

    dashboard.value = dashboardRes.data || dashboard.value;
    transactions.value = transactionsRes.data?.results || [];
    budgets.value = budgetRes.data || [];
    statistics.value = statsRes.data || statistics.value;
    lastSyncedAt.value = new Date();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Не вдалося оновити дані. Перевірте підключення або авторизацію.';
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
}

function initTelegramChrome() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor(ABYSS);
  webApp.setBackgroundColor(ABYSS);
}

onMounted(() => {
  initTelegramChrome();
  refreshData(true);
  refreshTimer.value = window.setInterval(() => refreshData(false), 8000);
});

onBeforeUnmount(() => {
  if (refreshTimer.value) {
    window.clearInterval(refreshTimer.value);
  }
});
</script>

<template>
  <div class="tg-app-shell">
    <div class="tg-status-spacer"></div>

    <header class="tg-topbar">
      <button class="tg-icon-button" type="button" aria-label="Меню">
        <Menu :size="24" />
      </button>
      <div class="tg-title-block">
        <span class="tg-kicker">MyHaven</span>
        <h1>{{ tabs.find((item) => item.id === activeTab)?.label }}</h1>
      </div>
      <button class="tg-icon-button tg-sync" type="button" aria-label="Оновити" @click="refreshData(true)">
        <Loader2 v-if="isRefreshing" :size="21" class="tg-spin" />
        <RefreshCw v-else :size="21" />
      </button>
    </header>

    <main class="tg-content">
      <section class="tg-live-strip">
        <span class="tg-live-dot"></span>
        <span>Live sync</span>
        <strong>{{ formatSyncTime(lastSyncedAt) }}</strong>
        <ChevronDown :size="16" />
      </section>

      <div v-if="isLoading" class="tg-loading">
        <Loader2 :size="30" class="tg-spin" />
        <p>Оновлюю обліковий запис...</p>
      </div>

      <div v-else-if="errorMessage" class="tg-card tg-error">
        <CircleHelp :size="22" />
        <p>{{ errorMessage }}</p>
      </div>

      <template v-else>
        <section v-if="activeTab === 'money'" class="tg-panel-stack">
          <article class="tg-balance-card">
            <span>Загальний баланс</span>
            <strong>{{ formatCurrency(balance) }}</strong>
            <div class="tg-balance-glow"></div>
          </article>

          <article class="tg-tip-card">
            <div class="tg-soft-icon">
              <Sparkles :size="22" />
            </div>
            <div>
              <h2>Асистент веде облік</h2>
              <p>Надішліть голос у боті, і WebApp оновить цифри автоматично.</p>
            </div>
          </article>

          <section class="tg-grid-two">
            <article class="tg-wallet-card">
              <div>
                <p>Доходи</p>
                <strong>{{ formatCurrency(totalIncomes) }}</strong>
              </div>
              <span class="tg-chip income"><ArrowUp :size="17" /></span>
            </article>
            <article class="tg-wallet-card">
              <div>
                <p>Витрати</p>
                <strong>{{ formatCurrency(totalExpenses) }}</strong>
              </div>
              <span class="tg-chip expense"><ArrowDown :size="17" /></span>
            </article>
          </section>

          <article class="tg-card">
            <div class="tg-section-head">
              <div>
                <span>Останні зміни</span>
                <h2>Нові операції</h2>
              </div>
              <Activity :size="22" />
            </div>
            <div class="tg-transaction-list compact">
              <div v-for="item in transactions.slice(0, 4)" :key="item.id" class="tg-transaction-row">
                <span class="tg-transaction-icon" :class="transactionTone(item.amount)">
                  <CreditCard :size="17" />
                </span>
                <div>
                  <strong>{{ item.description || 'Без опису' }}</strong>
                  <small>{{ item.category?.name || 'Без категорії' }} · {{ formatDate(item.transaction_date) }}</small>
                </div>
                <b :class="transactionTone(item.amount)">
                  {{ Number(item.amount) > 0 ? '+' : '' }}{{ formatCurrency(item.amount) }}
                </b>
              </div>
              <p v-if="!transactions.length" class="tg-empty">Поки немає операцій.</p>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'history'" class="tg-panel-stack">
          <label class="tg-search">
            <Search :size="18" />
            <input v-model="searchText" type="search" placeholder="Пошук за описом або категорією" />
          </label>
          <article class="tg-card">
            <div class="tg-transaction-list">
              <div v-for="item in filteredTransactions" :key="item.id" class="tg-transaction-row">
                <span class="tg-transaction-icon" :class="transactionTone(item.amount)">
                  <CreditCard :size="17" />
                </span>
                <div>
                  <strong>{{ item.description || 'Без опису' }}</strong>
                  <small>{{ item.category?.name || 'Без категорії' }} · {{ formatDate(item.transaction_date) }}</small>
                </div>
                <b :class="transactionTone(item.amount)">
                  {{ Number(item.amount) > 0 ? '+' : '' }}{{ formatCurrency(item.amount) }}
                </b>
              </div>
              <p v-if="!filteredTransactions.length" class="tg-empty">Нічого не знайшов.</p>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'reports'" class="tg-panel-stack">
          <article class="tg-card tg-savings-card">
            <div>
              <span>Рівень заощаджень</span>
              <strong>{{ savingsRate }}%</strong>
            </div>
            <div class="tg-ring" :style="{ '--progress': savingsRate + '%' }">
              <PiggyBank :size="26" />
            </div>
          </article>

          <article class="tg-card">
            <div class="tg-section-head">
              <div>
                <span>Бюджети</span>
                <h2>Ліміти місяця</h2>
              </div>
              <CalendarDays :size="22" />
            </div>
            <div class="tg-budget-list">
              <div v-for="budget in budgets.slice(0, 5)" :key="budget.id" class="tg-budget-row">
                <div>
                  <strong>{{ budget.category_name }}</strong>
                  <small>{{ formatCurrency(budget.spent) }} з {{ formatCurrency(budget.amount) }}</small>
                </div>
                <div class="tg-progress">
                  <i :style="{ width: Math.min(100, (Number(budget.spent || 0) / Number(budget.amount || 1)) * 100) + '%' }"></i>
                </div>
              </div>
              <p v-if="!budgets.length" class="tg-empty">Бюджети ще не створені.</p>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'stats'" class="tg-panel-stack">
          <article class="tg-card">
            <div class="tg-section-head">
              <div>
                <span>Динаміка</span>
                <h2>6 місяців</h2>
              </div>
              <BarChart3 :size="22" />
            </div>
            <div class="tg-bars">
              <div v-for="item in monthlyBars" :key="item.month" class="tg-bar-pair">
                <div class="tg-bar-columns">
                  <i class="income" :style="{ height: item.incomeHeight + '%' }"></i>
                  <i class="expense" :style="{ height: item.expenseHeight + '%' }"></i>
                </div>
                <small>{{ formatDate(item.month) }}</small>
              </div>
            </div>
          </article>

          <article class="tg-card">
            <div class="tg-section-head">
              <div>
                <span>Структура</span>
                <h2>Топ витрат</h2>
              </div>
              <Activity :size="22" />
            </div>
            <div class="tg-category-list">
              <div v-for="item in topCategories" :key="item.category__name || item.name" class="tg-category-row">
                <span>{{ item.category__name || item.name || 'Без категорії' }}</span>
                <strong>{{ formatCurrency(Math.abs(Number(item.total || item.amount || 0))) }}</strong>
              </div>
              <p v-if="!topCategories.length" class="tg-empty">Категорії зʼявляться після перших витрат.</p>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'ai'" class="tg-panel-stack">
          <article class="tg-ai-card">
            <div class="tg-ai-orbit">
              <Bot :size="34" />
            </div>
            <h2>Говоріть з обліком</h2>
            <p>Надішліть голосове повідомлення боту. Асистент створить операцію, уточнить деталі й оновить WebApp.</p>
          </article>
          <article class="tg-card">
            <div class="tg-section-head">
              <div>
                <span>Швидкі фрази</span>
                <h2>Що можна сказати</h2>
              </div>
              <Sparkles :size="22" />
            </div>
            <div class="tg-hints">
              <button v-for="hint in aiHints" :key="hint" type="button">{{ hint }}</button>
            </div>
          </article>
        </section>
      </template>
    </main>

    <nav class="tg-bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="23" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.tg-app-shell {
  --abyss: #0A0F1E;
  --frost: #E4F0F6;
  --panel: rgba(255, 255, 255, 0.055);
  --panel-strong: rgba(255, 255, 255, 0.09);
  --line: rgba(228, 240, 246, 0.12);
  --muted: rgba(228, 240, 246, 0.62);
  min-height: 100vh;
  background:
    radial-gradient(420px 240px at 50% -90px, rgba(31, 141, 255, 0.22), transparent 72%),
    linear-gradient(180deg, #070B16 0%, var(--abyss) 50%, #060A14 100%);
  color: var(--frost);
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: 0;
  overflow-x: hidden;
}

.tg-status-spacer {
  height: max(18px, env(safe-area-inset-top));
}

.tg-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  padding: 14px 18px 12px;
  background: linear-gradient(180deg, rgba(10, 15, 30, 0.98), rgba(10, 15, 30, 0.78));
  backdrop-filter: blur(18px);
}

.tg-title-block {
  text-align: center;
}

.tg-title-block h1 {
  font-size: 25px;
  line-height: 1.1;
  font-weight: 700;
  margin: 0;
}

.tg-kicker {
  display: block;
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  margin-bottom: 2px;
}

.tg-icon-button {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 8px;
  color: var(--frost);
  background: transparent;
  display: grid;
  place-items: center;
}

.tg-sync {
  color: #6FC7D1;
}

.tg-content {
  width: min(100%, 460px);
  margin: 0 auto;
  padding: 4px 18px 112px;
}

.tg-live-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin: 12px auto 18px;
  padding: 9px 14px;
  border-radius: 8px;
  background: rgba(0, 134, 255, 0.95);
  box-shadow: 0 14px 28px rgba(0, 134, 255, 0.24);
  font-size: 12px;
  font-weight: 700;
}

.tg-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #5EF1D2;
  box-shadow: 0 0 0 5px rgba(94, 241, 210, 0.16);
}

.tg-panel-stack {
  display: grid;
  gap: 16px;
}

.tg-card,
.tg-balance-card,
.tg-tip-card,
.tg-wallet-card,
.tg-ai-card {
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 20px 50px rgba(0, 0, 0, 0.24);
  border-radius: 8px;
}

.tg-balance-card {
  position: relative;
  min-height: 156px;
  padding: 30px 26px;
  overflow: hidden;
}

.tg-balance-card span,
.tg-card span,
.tg-savings-card span,
.tg-section-head span {
  color: var(--muted);
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.2em;
  font-weight: 700;
}

.tg-balance-card strong {
  display: block;
  margin-top: 18px;
  font-size: 42px;
  line-height: 1;
  color: #ffffff;
}

.tg-balance-glow {
  position: absolute;
  right: -54px;
  bottom: -54px;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  border: 24px solid rgba(89, 226, 218, 0.12);
}

.tg-tip-card {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 16px;
  align-items: center;
  padding: 18px;
}

.tg-tip-card h2,
.tg-section-head h2,
.tg-ai-card h2 {
  margin: 0;
  color: #fff;
  font-size: 20px;
  line-height: 1.18;
}

.tg-tip-card p,
.tg-ai-card p {
  color: var(--muted);
  margin: 5px 0 0;
  font-size: 13px;
  line-height: 1.45;
}

.tg-soft-icon,
.tg-chip,
.tg-transaction-icon {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  display: grid;
  place-items: center;
}

.tg-soft-icon {
  color: #86D9FF;
  background: rgba(0, 134, 255, 0.14);
}

.tg-grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tg-wallet-card {
  padding: 18px 14px;
  min-height: 132px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tg-wallet-card p {
  color: var(--muted);
  margin: 0 0 10px;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.16em;
}

.tg-wallet-card strong {
  color: #fff;
  font-size: 24px;
}

.tg-chip.income,
.tg-transaction-icon.income {
  color: #4BDBD2;
  background: rgba(75, 219, 210, 0.14);
}

.tg-chip.expense,
.tg-transaction-icon.expense {
  color: #FF5E8A;
  background: rgba(255, 94, 138, 0.14);
}

.tg-card {
  padding: 18px;
}

.tg-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: #4BDBD2;
}

.tg-transaction-list,
.tg-budget-list,
.tg-category-list {
  display: grid;
  gap: 10px;
}

.tg-transaction-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  min-height: 58px;
}

.tg-transaction-row strong,
.tg-budget-row strong,
.tg-category-row span {
  display: block;
  color: #fff;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tg-transaction-row small,
.tg-budget-row small {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}

.tg-transaction-row b {
  font-size: 13px;
  white-space: nowrap;
}

.tg-transaction-row b.income {
  color: #4BDBD2;
}

.tg-transaction-row b.expense {
  color: #FF6B95;
}

.tg-transaction-icon {
  width: 42px;
  height: 42px;
}

.tg-search {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 14px;
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 8px;
  color: var(--muted);
}

.tg-search input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--frost);
  font-size: 14px;
}

.tg-search input::placeholder {
  color: rgba(228, 240, 246, 0.42);
}

.tg-savings-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 172px;
}

.tg-savings-card strong {
  display: block;
  margin-top: 20px;
  font-size: 52px;
  line-height: 1;
  color: #4BDBD2;
}

.tg-ring {
  --progress: 0%;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #4BDBD2;
  background:
    radial-gradient(circle at center, var(--abyss) 56%, transparent 58%),
    conic-gradient(#4BDBD2 var(--progress), rgba(75, 219, 210, 0.1) 0);
}

.tg-budget-row {
  display: grid;
  gap: 8px;
}

.tg-progress {
  height: 7px;
  background: rgba(228, 240, 246, 0.1);
  overflow: hidden;
  border-radius: 999px;
}

.tg-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4BDBD2, #1686FF);
}

.tg-bars {
  height: 184px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  align-items: end;
}

.tg-bar-pair {
  min-width: 0;
  display: grid;
  gap: 7px;
  align-items: end;
  text-align: center;
}

.tg-bar-columns {
  height: 140px;
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 4px;
}

.tg-bar-columns i {
  width: 10px;
  min-height: 8px;
  border-radius: 999px 999px 2px 2px;
}

.tg-bar-columns .income {
  background: #4BDBD2;
}

.tg-bar-columns .expense {
  background: #FF5E8A;
}

.tg-bar-pair small {
  color: var(--muted);
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
}

.tg-category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 34px;
}

.tg-category-row strong {
  color: #4BDBD2;
  font-size: 13px;
  white-space: nowrap;
}

.tg-ai-card {
  padding: 28px 22px;
  text-align: center;
}

.tg-ai-orbit {
  width: 92px;
  height: 92px;
  margin: 0 auto 18px;
  border: 1px solid rgba(75, 219, 210, 0.24);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #4BDBD2;
  background: rgba(75, 219, 210, 0.08);
}

.tg-hints {
  display: grid;
  gap: 10px;
}

.tg-hints button {
  min-height: 48px;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--frost);
  background: var(--panel-strong);
  text-align: left;
  font-size: 13px;
}

.tg-loading,
.tg-error,
.tg-empty {
  color: var(--muted);
  text-align: center;
}

.tg-loading {
  min-height: 280px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
}

.tg-error {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.tg-empty {
  padding: 18px 0;
  font-size: 13px;
}

.tg-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  padding: 10px 10px max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba(228, 240, 246, 0.1);
  background: rgba(7, 11, 22, 0.94);
  backdrop-filter: blur(18px);
}

.tg-bottom-nav button {
  min-width: 0;
  min-height: 58px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: rgba(228, 240, 246, 0.56);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
}

.tg-bottom-nav button.active {
  color: var(--frost);
}

.tg-bottom-nav button.active svg {
  color: #1686FF;
  filter: drop-shadow(0 0 12px rgba(22, 134, 255, 0.55));
}

.tg-spin {
  animation: tg-spin 0.9s linear infinite;
}

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 360px) {
  .tg-content {
    padding-left: 12px;
    padding-right: 12px;
  }

  .tg-balance-card strong {
    font-size: 36px;
  }

  .tg-wallet-card strong {
    font-size: 20px;
  }

  .tg-bottom-nav button {
    font-size: 10px;
  }
}
</style>
