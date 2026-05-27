<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../stores/api';
import { usePreferencesStore } from '../stores/preferences';
import PageHeader from '../components/PageHeader.vue';
import { Line, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineController,
  DoughnutController,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler,
} from 'chart.js';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Plus,
  Upload,
  Wallet,
  TrendingUp,
} from 'lucide-vue-next';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineController,
  DoughnutController,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler
);

const router = useRouter();
const preferences = usePreferencesStore();

const isLoading = ref(true);
const totalExpenses = ref(0);
const totalIncomes = ref(0);
const balance = ref(0);
const recentTransactions = ref([]);
const budgets = ref([]);
const expensesByCategory = ref([]);
const monthlyData = ref([]);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#8ca0b3', boxWidth: 10, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: 'rgba(12, 18, 34, 0.95)',
      borderColor: 'rgba(238, 246, 251, 0.12)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#eef6fb',
    },
  },
  scales: {
    x: { grid: { color: 'rgba(238, 246, 251, 0.04)' }, ticks: { color: '#8ca0b3' } },
    y: { grid: { color: 'rgba(238, 246, 251, 0.06)' }, ticks: { color: '#8ca0b3' } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '64%',
  plugins: chartOptions.plugins,
};

const savingsRate = computed(() => {
  if (!totalIncomes.value) return 0;
  return Math.round(((totalIncomes.value - totalExpenses.value) / totalIncomes.value) * 100);
});

const overBudget = computed(() =>
  budgets.value.filter((budget) => Number(budget.spent || 0) > Number(budget.amount || budget.limit || 0))
);

const trendChart = computed(() => ({
  labels: monthlyData.value.map((item) =>
    new Date(item.month).toLocaleDateString('uk-UA', { month: 'short' })
  ),
  datasets: [
    {
      label: 'Доходи',
      data: monthlyData.value.map((item) => Number(item.total_incomes || 0)),
      borderColor: '#30d69a',
      backgroundColor: 'rgba(48, 214, 154, 0.22)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
    {
      label: 'Витрати',
      data: monthlyData.value.map((item) => Math.abs(Number(item.total_expenses || 0))),
      borderColor: '#1f7aff',
      backgroundColor: 'rgba(31, 122, 255, 0.22)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
  ],
}));

const categoryChart = computed(() => {
  const palette = ['#1f7aff', '#30d69a', '#f5ba45', '#f06464', '#9f7aea', '#47c7ff'];
  const rows = expensesByCategory.value.slice(0, 6);
  return {
    labels: rows.map((item) => item.category__name || item.name || 'Категорія'),
    datasets: [
      {
        backgroundColor: palette.slice(0, rows.length),
        borderWidth: 0,
        data: rows.map((item) => Math.abs(Number(item.total || item.value || item.expenses || 0))),
      },
    ],
  };
});

function formatCurrency(value) {
  return preferences.formatCurrency(Number(value || 0), { maximumFractionDigits: 0 });
}

function formatDate(value) {
  return preferences.formatDate(value, { day: 'numeric', month: 'short' });
}

function transactionAmount(transaction) {
  return Number(transaction.amount || 0);
}

async function fetchDashboard() {
  isLoading.value = true;
  try {
    const [dashRes, statsRes, budgetRes] = await Promise.all([
      api.getDashboard(),
      api.getStatistics(6),
      api.getBudgets(new Date().toISOString().slice(0, 7) + '-01'),
    ]);

    totalExpenses.value = Number(dashRes.data.total_expenses || 0);
    totalIncomes.value = Number(dashRes.data.total_incomes || 0);
    balance.value = Number(dashRes.data.balance || 0);
    recentTransactions.value = dashRes.data.recent_transactions || [];
    expensesByCategory.value = dashRes.data.expenses_by_category || statsRes.data.expense_categories || [];
    monthlyData.value = statsRes.data.monthly_summary || [];
    budgets.value = budgetRes.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchDashboard);
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Огляд простору"
      title="Добрий день"
      subtitle="Ось як складається ваш місяць: баланс, витрати, доходи й бюджети в одному місці."
    >
      <template #actions>
        <button class="mh-button-secondary" @click="router.push('/files')">
          <Upload :size="18" /> Імпорт виписки
        </button>
        <button class="mh-button-primary" @click="router.push('/operations')">
          <Plus :size="18" /> Нова операція
        </button>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="glass-strong rounded-xl p-12 text-center text-[color:var(--app-muted)]">
      Завантаження панелі...
    </div>

    <template v-else>
      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <article class="glass-strong rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Баланс</p>
            <span class="size-8 rounded-lg bg-sky-500/15 text-sky-300 grid place-items-center"><Wallet :size="17" /></span>
          </div>
          <strong class="font-accent text-3xl tabular text-white">{{ formatCurrency(balance) }}</strong>
          <p class="text-xs text-[color:var(--app-muted)] mt-2">Поточний чистий результат</p>
        </article>
        <article class="glass-strong rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Витрати</p>
            <span class="size-8 rounded-lg bg-rose-500/15 text-rose-300 grid place-items-center"><ArrowUpRight :size="17" /></span>
          </div>
          <strong class="font-accent text-3xl tabular text-white">{{ formatCurrency(totalExpenses) }}</strong>
          <p class="text-xs text-[color:var(--app-muted)] mt-2">За вибраний період</p>
        </article>
        <article class="glass-strong rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Доходи</p>
            <span class="size-8 rounded-lg bg-emerald-500/15 text-emerald-300 grid place-items-center"><ArrowDownLeft :size="17" /></span>
          </div>
          <strong class="font-accent text-3xl tabular text-white">{{ formatCurrency(totalIncomes) }}</strong>
          <p class="text-xs text-[color:var(--app-muted)] mt-2">Надходження місяця</p>
        </article>
        <article class="glass-strong rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Заощадження</p>
            <span class="size-8 rounded-lg bg-amber-500/15 text-amber-300 grid place-items-center"><TrendingUp :size="17" /></span>
          </div>
          <strong class="font-accent text-3xl tabular text-white">{{ savingsRate }}%</strong>
          <p class="text-xs text-[color:var(--app-muted)] mt-2">Частка доходів після витрат</p>
        </article>
      </section>

      <section class="grid xl:grid-cols-3 gap-4 mb-8">
        <article class="xl:col-span-2 glass-strong rounded-xl p-5 lg:p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Динаміка</p>
              <h2 class="font-accent text-2xl text-white mt-1">Доходи проти витрат</h2>
            </div>
          </div>
          <div class="h-72">
            <Line :data="trendChart" :options="chartOptions" />
          </div>
        </article>

        <article class="glass-strong rounded-xl p-5 lg:p-6">
          <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Структура витрат</p>
          <h2 class="font-accent text-2xl text-white mt-1 mb-4">За категоріями</h2>
          <div class="h-44">
            <Doughnut :data="categoryChart" :options="doughnutOptions" />
          </div>
          <div class="space-y-2 mt-4">
            <div
              v-for="(item, index) in expensesByCategory.slice(0, 5)"
              :key="item.category__name || item.name || index"
              class="flex items-center justify-between gap-3 text-sm"
            >
              <span class="truncate text-[color:var(--app-muted)]">{{ item.category__name || item.name || 'Категорія' }}</span>
              <span class="tabular font-medium text-white">{{ formatCurrency(item.total || item.value || item.expenses) }}</span>
            </div>
          </div>
        </article>
      </section>

      <section class="grid xl:grid-cols-3 gap-4">
        <article class="xl:col-span-2 glass-strong rounded-xl p-5 lg:p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Активність</p>
              <h2 class="font-accent text-2xl text-white mt-1">Останні операції</h2>
            </div>
            <button class="mh-button-secondary min-h-8 py-1.5" @click="router.push('/operations')">Всі</button>
          </div>
          <div class="divide-y divide-white/10">
            <div
              v-for="transaction in recentTransactions.slice(0, 6)"
              :key="transaction.id"
              class="flex items-center gap-3 py-3"
            >
              <div class="size-9 rounded-lg bg-white/5 grid place-items-center shrink-0">
                <Wallet v-if="transactionAmount(transaction) < 0" :size="17" class="text-[color:var(--app-muted)]" />
                <TrendingUp v-else :size="17" class="text-emerald-300" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-white truncate">{{ transaction.description || 'Без опису' }}</p>
                <p class="text-xs text-[color:var(--app-muted)]">
                  {{ transaction.category?.name || 'Без категорії' }} · {{ formatDate(transaction.transaction_date) }}
                </p>
              </div>
              <strong class="tabular text-sm" :class="transactionAmount(transaction) >= 0 ? 'text-success' : 'text-danger'">
                {{ transactionAmount(transaction) > 0 ? '+' : '' }}{{ formatCurrency(transactionAmount(transaction)) }}
              </strong>
            </div>
            <p v-if="!recentTransactions.length" class="py-10 text-center text-sm text-[color:var(--app-muted)]">Операцій ще немає.</p>
          </div>
        </article>

        <article class="glass-strong rounded-xl p-5 lg:p-6">
          <div class="flex items-center gap-2 mb-1">
            <AlertTriangle :size="17" class="text-warning" />
            <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Попередження</p>
          </div>
          <h2 class="font-accent text-2xl text-white mt-1 mb-4">Бюджети місяця</h2>
          <div v-if="!overBudget.length" class="text-sm text-[color:var(--app-muted)] py-8 text-center">
            <CircleDollarSign class="mx-auto mb-2 text-white/30" :size="34" />
            Усі бюджети в межах ліміту.
          </div>
          <div v-else class="space-y-3">
            <div v-for="budget in overBudget" :key="budget.id" class="p-3 rounded-lg bg-rose-500/10 border border-rose-400/20">
              <div class="flex items-center justify-between gap-2 text-sm mb-2">
                <span class="font-medium text-white">{{ budget.category_name }}</span>
                <span class="text-danger tabular">{{ formatCurrency(budget.spent) }} / {{ formatCurrency(budget.amount) }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full bg-[color:var(--app-danger)]"
                  :style="{ width: Math.min(100, (Number(budget.spent || 0) / Number(budget.amount || 1)) * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <button class="mh-button-secondary w-full mt-4" @click="router.push('/budgets')">Керувати бюджетами</button>
        </article>
      </section>
    </template>
  </div>
</template>
