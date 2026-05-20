<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '../stores/api';
import { useUserConfigStore } from '../stores/userConfig';
import { usePreferencesStore } from '../stores/preferences';
import { Line, Doughnut, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Filler,
} from 'chart.js';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  BarChart3,
  Plus,
  GripVertical,
  Pin,
  Sparkles,
  X,
} from 'lucide-vue-next';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Filler
);

const router = useRouter();
const userConfig = useUserConfigStore();
const preferencesStore = usePreferencesStore();

// State
const totalExpenses = ref(0);
const totalIncomes = ref(0);
const balance = ref(0);
const recentTransactions = ref([]);
const budgets = ref([]);
const expensesByCategory = ref([]);
const monthlyData = ref([]);
const expenseCategories = ref([]);
const incomeCategories = ref([]);
const bankStats = ref([]);
const isLoading = ref(true);

// Manual add modal
const showAddModal = ref(false);
const categories = ref([]);
const newTransaction = ref({
  amount: '',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0],
  category: '',
});

// Chart builder
const showChartBuilder = ref(false);
const chartDraft = ref({
  title: '',
  chartType: 'line',
  dataset: 'monthly',
  metric: 'net',
});

// Drag & drop
const draggingWidgetId = ref(null);
const dragOverWidgetId = ref(null);

const widgets = computed(() => userConfig.config.dashboardWidgets || []);
const displayWidgets = computed(() => {
  const pinned = widgets.value.filter((widget) => widget.pinned);
  const regular = widgets.value.filter((widget) => !widget.pinned);
  return [...pinned, ...regular];
});

const widgetTitles = computed(() => {
  const isEnglish = preferencesStore.language === 'en';
  return {
    'widget.summary': isEnglish ? 'Balance snapshot' : 'Баланс',
    'widget.monthlyLine': isEnglish ? 'Income vs Expenses' : 'Динаміка доходів/витрат',
    'widget.expenseCategories': isEnglish ? 'Expense categories' : 'Витрати по категоріях',
    'widget.recentTransactions': isEnglish ? 'Recent transactions' : 'Останні транзакції',
    'widget.budgets': isEnglish ? 'Budgets' : 'Бюджети',
  };
});

const chartDatasetOptions = computed(() => {
  const isEnglish = preferencesStore.language === 'en';
  if (chartDraft.value.chartType === 'line') {
    return [{ value: 'monthly', label: isEnglish ? 'Monthly summary' : 'Місячна динаміка' }];
  }
  if (chartDraft.value.chartType === 'doughnut') {
    return [
      { value: 'expense_categories', label: isEnglish ? 'Expense categories' : 'Категорії витрат' },
      { value: 'income_categories', label: isEnglish ? 'Income categories' : 'Категорії доходів' },
      { value: 'bank_stats', label: isEnglish ? 'Bank flow' : 'Рух по банках' },
    ];
  }
  return [
    { value: 'monthly', label: isEnglish ? 'Monthly summary' : 'Місячна динаміка' },
    { value: 'expense_categories', label: isEnglish ? 'Expense categories' : 'Категорії витрат' },
    { value: 'income_categories', label: isEnglish ? 'Income categories' : 'Категорії доходів' },
    { value: 'bank_stats', label: isEnglish ? 'Bank flow' : 'Рух по банках' },
  ];
});

const chartMetricOptions = computed(() => {
  const isEnglish = preferencesStore.language === 'en';
  if (chartDraft.value.dataset !== 'monthly') {
    return [{ value: 'total', label: isEnglish ? 'Total' : 'Сума' }];
  }
  return [
    { value: 'income', label: isEnglish ? 'Income' : 'Доходи' },
    { value: 'expense', label: isEnglish ? 'Expenses' : 'Витрати' },
    { value: 'net', label: isEnglish ? 'Net flow' : 'Чистий потік' },
    { value: 'split', label: isEnglish ? 'Income vs expenses' : 'Доходи проти витрат' },
  ];
});

watch(
  () => [chartDraft.value.chartType, chartDraft.value.dataset],
  () => {
    const datasetValues = chartDatasetOptions.value.map((option) => option.value);
    if (!datasetValues.includes(chartDraft.value.dataset)) {
      chartDraft.value.dataset = datasetValues[0];
    }
    if (chartDraft.value.dataset !== 'monthly') {
      chartDraft.value.metric = 'total';
    } else if (!chartMetricOptions.value.some((option) => option.value === chartDraft.value.metric)) {
      chartDraft.value.metric = 'net';
    }
  }
);

const baseChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { enabled: true },
  },
}));

function formatCurrency(value) {
  return preferencesStore.formatCurrency(value);
}

function formatDate(value, options = {}) {
  return preferencesStore.formatDate(value, options);
}

function resolveTitle(widget) {
  return widget.title || widgetTitles.value[widget.titleKey] || 'Widget';
}

function widgetClass(widget) {
  if (widget.layout === 'wide') {
    return 'lg:col-span-2 xl:col-span-3';
  }
  return '';
}

function chartComponent(widget) {
  if (widget.chartType === 'bar') return Bar;
  if (widget.chartType === 'doughnut') return Doughnut;
  return Line;
}

function chartOptions(widget) {
  if (widget.chartType === 'doughnut') {
    return { ...baseChartOptions.value, cutout: '62%' };
  }
  return baseChartOptions.value;
}

function buildMonthlyChart(metric, useSplit = false) {
  const isEnglish = preferencesStore.language === 'en';
  const labels = monthlyData.value.map((item) =>
    new Date(item.month).toLocaleDateString(preferencesStore.locale, { month: 'short', year: '2-digit' })
  );

  if (useSplit) {
    return {
      labels,
      datasets: [
        {
          label: isEnglish ? 'Income' : 'Доходи',
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          data: monthlyData.value.map((item) => item.total_incomes || 0),
          fill: true,
          tension: 0.3,
        },
        {
          label: isEnglish ? 'Expenses' : 'Витрати',
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          data: monthlyData.value.map((item) => Math.abs(item.total_expenses || 0)),
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }

  const data = monthlyData.value.map((item) => {
    if (metric === 'income') return item.total_incomes || 0;
    if (metric === 'expense') return Math.abs(item.total_expenses || 0);
    return (item.total_incomes || 0) - Math.abs(item.total_expenses || 0);
  });

  return {
    labels,
    datasets: [
      {
        label: isEnglish ? 'Net' : 'Баланс',
        borderColor: '#0F766E',
        backgroundColor: 'rgba(15, 118, 110, 0.25)',
        data,
        fill: true,
        tension: 0.3,
      },
    ],
  };
}

function buildCategoryChart(source, labelKey) {
  if (!source.length) return { labels: [], datasets: [] };
  const palette = ['#0EA5E9', '#14B8A6', '#F97316', '#E11D48', '#6366F1', '#84CC16'];
  return {
    labels: source.map((item) => item[labelKey] || '—'),
    datasets: [
      {
        backgroundColor: palette.slice(0, source.length),
        data: source.map((item) => Math.abs(item.total || item.expenses || 0)),
      },
    ],
  };
}

function buildBankChart() {
  if (!bankStats.value.length) return { labels: [], datasets: [] };
  const palette = ['#0F766E', '#0EA5E9', '#F97316', '#E11D48', '#6366F1', '#84CC16'];
  return {
    labels: bankStats.value.map((item) => item.account__bank__name || '—'),
    datasets: [
      {
        backgroundColor: palette.slice(0, bankStats.value.length),
        data: bankStats.value.map((item) => Math.abs(item.expenses || 0) + (item.incomes || 0)),
      },
    ],
  };
}

function buildChartData(widget) {
  if (widget.dataset === 'monthly') {
    const useSplit = widget.metric === 'split';
    return buildMonthlyChart(widget.metric, useSplit);
  }
  if (widget.dataset === 'expense_categories') {
    const source = expenseCategories.value.length ? expenseCategories.value : expensesByCategory.value;
    return buildCategoryChart(source, 'category__name');
  }
  if (widget.dataset === 'income_categories') {
    return buildCategoryChart(incomeCategories.value, 'category__name');
  }
  if (widget.dataset === 'bank_stats') {
    return buildBankChart();
  }
  return { labels: [], datasets: [] };
}

const chartDataMap = computed(() => {
  const map = {};
  displayWidgets.value.forEach((widget) => {
    if (widget.type === 'chart') {
      map[widget.id] = buildChartData(widget);
    }
  });
  return map;
});

function hasChartData(widget) {
  const data = chartDataMap.value[widget.id];
  if (!data || !data.datasets) return false;
  return data.datasets.some((set) => Array.isArray(set.data) && set.data.length > 0);
}

function togglePin(widget) {
  const updated = widgets.value.map((item) =>
    item.id === widget.id ? { ...item, pinned: !item.pinned } : item
  );
  userConfig.setDashboardWidgets(updated);
}

function removeWidget(widget) {
  if (!widget.custom) return;
  const updated = widgets.value.filter((item) => item.id !== widget.id);
  userConfig.setDashboardWidgets(updated);
}

function onWidgetDragStart(widgetId) {
  draggingWidgetId.value = widgetId;
}

function onWidgetDragOver(event, widgetId) {
  event.preventDefault();
  dragOverWidgetId.value = widgetId;
}

function onWidgetDrop(widgetId) {
  if (!draggingWidgetId.value || draggingWidgetId.value === widgetId) return;
  const ordered = [...displayWidgets.value];
  const fromIndex = ordered.findIndex((item) => item.id === draggingWidgetId.value);
  const toIndex = ordered.findIndex((item) => item.id === widgetId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);
  const newOrderIds = ordered.map((item) => item.id);
  const updated = newOrderIds
    .map((id) => widgets.value.find((item) => item.id === id))
    .filter(Boolean);
  userConfig.setDashboardWidgets(updated);
  draggingWidgetId.value = null;
  dragOverWidgetId.value = null;
}

function onWidgetDragEnd() {
  draggingWidgetId.value = null;
  dragOverWidgetId.value = null;
}

function addCustomChart() {
  const id = `custom-${Date.now()}`;
  const fallbackTitle = preferencesStore.language === 'en' ? 'Custom chart' : 'Користувацький графік';
  const title = chartDraft.value.title.trim() || fallbackTitle;
  const widget = {
    id,
    type: 'chart',
    title,
    chartType: chartDraft.value.chartType,
    dataset: chartDraft.value.dataset,
    metric: chartDraft.value.metric,
    pinned: false,
    custom: true,
    layout: chartDraft.value.chartType === 'line' ? 'wide' : 'standard',
  };
  userConfig.setDashboardWidgets([...widgets.value, widget]);
  showChartBuilder.value = false;
  chartDraft.value = {
    title: '',
    chartType: 'line',
    dataset: 'monthly',
    metric: 'net',
  };
}

async function fetchDashboard() {
  isLoading.value = true;
  try {
    const [dashRes, statsRes, budgetRes] = await Promise.all([
      api.getDashboard(),
      api.getStatistics(6),
      api.getBudgets(new Date().toISOString().slice(0, 7) + '-01'),
    ]);

    totalExpenses.value = dashRes.data.total_expenses || 0;
    totalIncomes.value = dashRes.data.total_incomes || 0;
    balance.value = dashRes.data.balance || 0;
    recentTransactions.value = dashRes.data.recent_transactions || [];
    expensesByCategory.value = dashRes.data.expenses_by_category || [];

    monthlyData.value = statsRes.data.monthly_summary || [];
    expenseCategories.value = statsRes.data.expense_categories || [];
    incomeCategories.value = statsRes.data.income_categories || [];
    bankStats.value = statsRes.data.by_bank_stats || [];

    budgets.value = budgetRes.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function fetchCategories() {
  try {
    const res = await api.getCategories();
    categories.value = res.data;
  } catch (error) {
    console.error(error);
  }
}

async function addTransaction() {
  try {
    await api.createTransaction(newTransaction.value);
    showAddModal.value = false;
    newTransaction.value = {
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      category: '',
    };
    fetchDashboard();
  } catch (error) {
    console.error(error);
    alert('Помилка при додаванні');
  }
}

onMounted(() => {
  fetchDashboard();
  fetchCategories();
});
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto pb-28">
    <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">MyHaven</p>
        <h1 class="text-3xl font-semibold text-slate-900 dark:text-white font-accent">Добрий день</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Ваш персональний фінансовий простір</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button
          @click="showChartBuilder = true"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-dark-card/70 border border-white/30 dark:border-white/10 backdrop-blur-md text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-dark-card/90 transition"
        >
          <Sparkles :size="18" /> Створити графік
        </button>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <Plus :size="18" /> Додати транзакцію
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="text-center py-20 text-slate-400">
      <div class="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
      Завантаження панелі...
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <section
        v-for="widget in displayWidgets"
        :key="widget.id"
        class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-xl shadow-black/5 p-5 transition-all"
        :class="[
          widgetClass(widget),
          dragOverWidgetId === widget.id ? 'ring-2 ring-teal-400' : '',
        ]"
        draggable="true"
        @dragstart="onWidgetDragStart(widget.id)"
        @dragover="(event) => onWidgetDragOver(event, widget.id)"
        @drop="() => onWidgetDrop(widget.id)"
        @dragend="onWidgetDragEnd"
      >
        <header class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <GripVertical :size="16" class="opacity-60" />
            <h3 class="text-sm font-semibold">{{ resolveTitle(widget) }}</h3>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition"
              :class="widget.pinned ? 'text-teal-600' : 'text-slate-400'"
              @click="togglePin(widget)"
            >
              <Pin :size="16" />
            </button>
            <button
              v-if="widget.custom"
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-white/60 dark:hover:bg-white/10 transition"
              @click="removeWidget(widget)"
            >
              <X :size="16" />
            </button>
          </div>
        </header>

        <div v-if="widget.type === 'summary'" class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-slate-500">Загальний баланс</p>
            <span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Live</span>
          </div>
          <h2 class="text-3xl font-semibold text-slate-900 dark:text-white">{{ formatCurrency(balance) }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/5">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft size="20" />
              </div>
              <div>
                <p class="text-xs text-slate-500">Доходи</p>
                <p class="font-semibold text-emerald-600">{{ formatCurrency(totalIncomes) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/5">
              <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                <ArrowUpRight size="20" />
              </div>
              <div>
                <p class="text-xs text-slate-500">Витрати</p>
                <p class="font-semibold text-rose-500">{{ formatCurrency(totalExpenses) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="widget.type === 'chart'">
          <div class="h-64">
            <component
              v-if="hasChartData(widget)"
              :is="chartComponent(widget)"
              :data="chartDataMap[widget.id]"
              :options="chartOptions(widget)"
            />
            <div v-else class="h-full flex items-center justify-center text-slate-400 text-sm">Немає даних</div>
          </div>
        </div>

        <div v-else-if="widget.type === 'transactions'" class="space-y-3">
          <div
            v-for="transaction in recentTransactions.slice(0, 4)"
            :key="transaction.id"
            class="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-white/5"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <Wallet v-if="transaction.amount < 0" size="18" class="text-slate-500" />
                <TrendingUp v-else size="18" class="text-emerald-500" />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-900 dark:text-white">{{ transaction.description }}</p>
                <p class="text-xs text-slate-500">{{ formatDate(transaction.transaction_date) }}</p>
              </div>
            </div>
            <span class="text-sm font-semibold" :class="transaction.amount > 0 ? 'text-emerald-600' : 'text-rose-500'">
              {{ transaction.amount > 0 ? '+' : '' }}{{ formatCurrency(transaction.amount) }}
            </span>
          </div>
          <button
            class="text-sm font-semibold text-teal-600 hover:text-teal-700"
            @click="router.push('/operations')"
          >
            Всі транзакції
          </button>
        </div>

        <div v-else-if="widget.type === 'budgets'" class="space-y-3">
          <div v-if="!budgets.length" class="text-sm text-slate-400">Бюджети не створені</div>
          <div
            v-for="budget in budgets.slice(0, 3)"
            :key="budget.id"
            class="p-3 rounded-xl bg-white/60 dark:bg-white/5"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-900 dark:text-white">{{ budget.category_name }}</span>
              <span class="text-xs text-slate-500">{{ Math.round(budget.spent) }} / {{ Math.round(budget.amount) }}</span>
            </div>
            <div class="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="budget.spent / budget.amount >= 0.9 ? 'bg-rose-500' : budget.spent / budget.amount >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'"
                :style="{ width: Math.min(100, (budget.spent / budget.amount) * 100) + '%' }"
              ></div>
            </div>
          </div>
          <button
            class="text-sm font-semibold text-teal-600 hover:text-teal-700"
            @click="router.push('/budgets')"
          >
            Всі бюджети
          </button>
        </div>
      </section>
    </div>

    <button
      @click="showAddModal = true"
      class="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white hover:bg-emerald-700 hover:scale-105 transition-all z-40"
    >
      <Plus :size="28" />
    </button>

    <!-- Chart Builder Modal -->
    <div
      v-if="showChartBuilder"
      class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="showChartBuilder = false"
    >
      <div class="bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-white/30 dark:border-white/10">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 :size="20" /> Новий графік
          </h3>
          <button class="text-slate-400 hover:text-slate-600" @click="showChartBuilder = false">
            <X :size="18" />
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Назва</label>
            <input
              v-model="chartDraft.title"
              class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
              placeholder="Мій графік"
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Тип</label>
              <select
                v-model="chartDraft.chartType"
                class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
              >
                <option value="line">Лінія</option>
                <option value="bar">Стовпчики</option>
                <option value="doughnut">Кільце</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Дані</label>
              <select
                v-model="chartDraft.dataset"
                class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
              >
                <option v-for="option in chartDatasetOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Метрика</label>
            <select
              v-model="chartDraft.metric"
              :disabled="chartDraft.dataset !== 'monthly'"
              class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
            >
              <option v-for="option in chartMetricOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <button
            class="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
            @click="addCustomChart"
          >
            Створити графік
          </button>
        </div>
      </div>
    </div>

    <!-- Add Transaction Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/30 dark:border-white/10">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Нова транзакція</h3>
        <form @submit.prevent="addTransaction" class="space-y-4">
          <div>
            <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Сума (від'ємна для витрат)</label>
            <input
              v-model="newTransaction.amount"
              type="number"
              step="0.01"
              required
              class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
              placeholder="-150.00"
            />
          </div>
          <div>
            <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Опис</label>
            <input
              v-model="newTransaction.description"
              required
              class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
              placeholder="На що витратили?"
            />
          </div>
          <div>
            <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Дата</label>
            <input
              v-model="newTransaction.transaction_date"
              type="date"
              required
              class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label class="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Категорія</label>
            <select
              v-model="newTransaction.category"
              class="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-dark-input/50 text-slate-900 dark:text-white"
            >
              <option value="">Без категорії</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showAddModal = false"
              class="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
            >
              Додати
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
