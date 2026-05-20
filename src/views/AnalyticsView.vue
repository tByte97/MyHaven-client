<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../stores/api';
import { usePreferencesStore } from '../stores/preferences';
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
} from 'chart.js';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next';

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
  ArcElement
);

// ===== TAB MANAGEMENT =====
const activeTab = ref('charts');

const tabs = [
  { id: 'charts', label: 'Графіки', icon: BarChart3 },
  { id: 'calendar', label: 'Календар', icon: CalendarDays },
];

// ===== STATISTICS DATA (Charts Tab) =====
const monthlyData = ref([]);
const expenseData = ref([]);
const incomeData = ref([]);
const bankData = ref([]);
const isLoadingStats = ref(true);
const selectedMonths = ref('6');
const preferencesStore = usePreferencesStore();

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { enabled: true },
  },
});

const lineChartData = computed(() => {
  if (!monthlyData.value.length) return { datasets: [] };

  const labels = monthlyData.value.map((d) =>
    new Date(d.month).toLocaleDateString(preferencesStore.locale, { month: 'short', year: '2-digit' })
  );

  return {
    labels: labels,
    datasets: [
      {
        label: 'Доходи',
        backgroundColor: 'green',
        borderColor: 'green',
        data: monthlyData.value.map((d) => d.total_incomes || 0),
      },
      {
        label: 'Витрати',
        backgroundColor: 'red',
        borderColor: 'red',
        data: monthlyData.value.map((d) => Math.abs(d.total_expenses || 0)),
      },
    ],
  };
});

const expenseDoughnutData = computed(() => {
  if (!expenseData.value.length) return { datasets: [] };

  return {
    labels: expenseData.value.map((d) => d.category__name),
    datasets: [
      {
        backgroundColor: ['#E74C3C', '#A93226', '#F1948A', '#C0392B', '#EC7063'],
        data: expenseData.value.map((d) => Math.abs(d.total)),
      },
    ],
  };
});

const incomeDoughnutData = computed(() => {
  if (!incomeData.value.length) return { datasets: [] };

  return {
    labels: incomeData.value.map((d) => d.category__name),
    datasets: [
      {
        backgroundColor: ['#2ECC71', '#27AE60', '#7DCEA0', '#229954'],
        data: incomeData.value.map((d) => d.total),
      },
    ],
  };
});

const bankChartData = computed(() => {
  if (!bankData.value.length) return { datasets: [] };

  return {
    labels: bankData.value.map((d) => d.account__bank__name || 'Невідомий'),
    datasets: [
      {
        backgroundColor: ['#3498DB', '#2980B9', '#1ABC9C', '#16A085', '#F39C12'],
        data: bankData.value.map((d) => Math.abs((d.expenses || 0)) + (d.incomes || 0)),
      },
    ],
  };
});

async function fetchStatistics() {
  isLoadingStats.value = true;
  try {
    const response = await api.getStatistics(selectedMonths.value);
    monthlyData.value = response.data.monthly_summary;
    expenseData.value = response.data.expense_categories;
    incomeData.value = response.data.income_categories;
    bankData.value = response.data.by_bank_stats || [];
  } catch (error) {
    console.error('Помилка завантаження статистики:', error);
  } finally {
    isLoadingStats.value = false;
  }
}

// ===== CALENDAR DATA (Calendar Tab) =====
const calendarData = ref([]);
const dayTransactions = ref([]);
const selectedDay = ref(null);
const isLoadingCalendar = ref(true);

const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth() + 1);

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1);
  return d.toLocaleDateString(preferencesStore.locale, { year: 'numeric', month: 'long' });
});

const formatCurrency = (val) => preferencesStore.formatCurrency(val);

const calendarGrid = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();

  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const grid = [];

  for (let i = 0; i < startDay; i++) {
    grid.push({ day: null });
  }

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const data = calendarData.value.find((item) => item.day === dateStr);
    grid.push({
      day: d,
      date: dateStr,
      expenses: data ? data.expenses : 0,
      incomes: data ? data.incomes : 0,
      isToday: year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate(),
    });
  }

  return grid;
});

async function fetchCalendar() {
  isLoadingCalendar.value = true;
  selectedDay.value = null;
  dayTransactions.value = [];
  try {
    const res = await api.getCalendar(currentYear.value, currentMonth.value);
    calendarData.value = res.data.days;
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingCalendar.value = false;
  }
}

async function selectDay(cell) {
  if (!cell.day) return;
  selectedDay.value = cell;
  try {
    const res = await api.getCalendarDay(currentYear.value, currentMonth.value, cell.day);
    dayTransactions.value = res.data;
  } catch (e) {
    console.error(e);
  }
}

function changeMonth(delta) {
  let m = currentMonth.value + delta;
  let y = currentYear.value;
  if (m > 12) { m = 1; y++; }
  if (m < 1) { m = 12; y--; }
  currentMonth.value = m;
  currentYear.value = y;
  fetchCalendar();
}

function cellColor(cell) {
  if (!cell.day || (!cell.expenses && !cell.incomes)) return '';
  if (cell.expenses > 0 && cell.incomes > 0) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
  if (cell.expenses > 0) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
  return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
}

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

onMounted(() => {
  fetchStatistics();
  fetchCalendar();
});
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Аналітика</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm">Огляд ваших фінансів та календар витрат</p>
    </header>

    <!-- Tab Switcher з glass effect -->
    <div class="flex gap-2 mb-6 bg-white/50 dark:bg-dark-card/50 backdrop-blur-md p-2 rounded-2xl border border-white/30 dark:border-white/10">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300"
        :class="
          activeTab === tab.id
            ? 'bg-white/90 dark:bg-dark-card shadow-lg text-gray-900 dark:text-white backdrop-blur-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/10'
        "
      >
        <component :is="tab.icon" :size="18" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content: Statistics -->
    <div v-if="activeTab === 'charts'">
      <!-- Period Selector -->
      <div class="flex justify-end mb-6">
        <div class="flex items-center gap-3 bg-white/70 dark:bg-dark-card/70 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white/30 dark:border-white/10">
          <label class="text-sm text-gray-600 dark:text-gray-400 font-medium">Період:</label>
          <select
            v-model="selectedMonths"
            @change="fetchStatistics"
            class="border-none bg-transparent font-semibold text-blue-600 dark:text-blue-400 cursor-pointer outline-none"
          >
            <option value="1">Останній місяць</option>
            <option value="3">3 місяці</option>
            <option value="6">6 місяців</option>
            <option value="12">Рік</option>
            <option value="24">2 роки</option>
          </select>
        </div>
      </div>

      <div v-if="isLoadingStats" class="text-center py-24">
        <div class="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-400">Аналізуємо дані...</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Line Chart - Full Width -->
        <section class="lg:col-span-2 bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10 transition-all duration-300 hover:shadow-xl">
          <div class="mb-4 border-l-4 border-blue-500 pl-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Динаміка (Доходи vs Витрати)</h3>
          </div>
          <div class="h-96">
            <Line :data="lineChartData" :options="chartOptions" />
          </div>
        </section>

        <!-- Expense Doughnut -->
        <section class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10 transition-all duration-300 hover:shadow-xl">
          <div class="mb-4 border-l-4 border-red-500 pl-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Структура Витрат</h3>
          </div>
          <div class="h-72">
            <Doughnut v-if="expenseData.length" :data="expenseDoughnutData" :options="chartOptions" />
            <div v-else class="h-full flex items-center justify-center text-gray-400 italic">Немає даних про витрати</div>
          </div>
        </section>

        <!-- Income Doughnut -->
        <section class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10 transition-all duration-300 hover:shadow-xl">
          <div class="mb-4 border-l-4 border-green-500 pl-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Структура Доходів</h3>
          </div>
          <div class="h-72">
            <Doughnut v-if="incomeData.length" :data="incomeDoughnutData" :options="chartOptions" />
            <div v-else class="h-full flex items-center justify-center text-gray-400 italic">Немає даних про доходи</div>
          </div>
        </section>

        <!-- Bank Chart -->
        <section class="lg:col-span-2 bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10 transition-all duration-300 hover:shadow-xl">
          <div class="mb-4 border-l-4 border-blue-500 pl-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">По Банках (Net Flow)</h3>
          </div>
          <div class="h-72">
            <Doughnut v-if="bankData && bankData.length" :data="bankChartData" :options="chartOptions" />
            <div v-else class="h-full flex items-center justify-center text-gray-400 italic">Немає даних по банках</div>
          </div>
        </section>
      </div>
    </div>

    <!-- Tab Content: Calendar -->
    <div v-if="activeTab === 'calendar'">
      <!-- Month Selector -->
      <div class="flex items-center justify-center gap-4 mb-6">
        <button
          @click="changeMonth(-1)"
          class="p-3 bg-white/70 dark:bg-dark-card/70 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl hover:bg-white/90 dark:hover:bg-dark-card/90 transition-all shadow-lg"
        >
          <ChevronLeft :size="20" />
        </button>
        <span class="text-lg font-semibold text-gray-900 dark:text-white capitalize min-w-[200px] text-center">{{ monthLabel }}</span>
        <button
          @click="changeMonth(1)"
          class="p-3 bg-white/70 dark:bg-dark-card/70 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl hover:bg-white/90 dark:hover:bg-dark-card/90 transition-all shadow-lg"
        >
          <ChevronRight :size="20" />
        </button>
      </div>

      <div v-if="isLoadingCalendar" class="text-center py-12 text-gray-400">Завантаження...</div>

      <div v-else class="flex gap-6">
        <!-- Calendar Grid -->
        <div class="flex-1">
          <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 dark:border-white/10 overflow-hidden">
            <!-- Header -->
            <div class="grid grid-cols-7 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
              <div v-for="d in weekDays" :key="d" class="px-2 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {{ d }}
              </div>
            </div>

            <!-- Days -->
            <div class="grid grid-cols-7">
              <div
                v-for="(cell, idx) in calendarGrid"
                :key="idx"
                @click="selectDay(cell)"
                class="min-h-[80px] border border-gray-100/50 dark:border-white/5 p-2 transition-all duration-200 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 backdrop-blur-sm"
                :class="[
                  cellColor(cell),
                  cell.isToday ? 'ring-2 ring-blue-400 ring-inset' : '',
                  selectedDay && selectedDay.day === cell.day ? 'ring-2 ring-blue-600 ring-inset bg-blue-50/50 dark:bg-blue-900/30' : '',
                ]"
              >
                <div v-if="cell.day" class="text-sm font-medium" :class="cell.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'">
                  {{ cell.day }}
                </div>
                <div v-if="cell.expenses" class="text-xs text-red-500 dark:text-red-400 mt-1">
                  -{{ formatCurrency(cell.expenses) }}
                </div>
                <div v-if="cell.incomes" class="text-xs text-green-600 dark:text-green-400">
                  +{{ formatCurrency(cell.incomes) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Day Details Sidebar -->
        <div class="w-80 shrink-0">
          <div class="bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 dark:border-white/10 p-4 sticky top-6">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-3">
              {{ selectedDay ? `${selectedDay.day} ${monthLabel}` : 'Оберіть день' }}
            </h3>

            <div v-if="selectedDay" class="mb-4 flex gap-3">
              <div class="flex-1 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm rounded-xl p-3 text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Витрати</p>
                <p class="font-semibold text-red-500 dark:text-red-400 text-sm">{{ formatCurrency(selectedDay.expenses || 0) }}</p>
              </div>
              <div class="flex-1 bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm rounded-xl p-3 text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Доходи</p>
                <p class="font-semibold text-green-600 dark:text-green-400 text-sm">{{ formatCurrency(selectedDay.incomes || 0) }}</p>
              </div>
            </div>

            <div class="space-y-2 max-h-[400px] overflow-y-auto">
              <div
                v-for="t in dayTransactions"
                :key="t.id"
                class="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50/50 dark:hover:bg-white/5 backdrop-blur-sm transition-all"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t.description }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ t.category?.name || '—' }}</p>
                </div>
                <span class="text-sm font-semibold" :class="t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                  {{ t.amount > 0 ? '+' : '' }}{{ formatCurrency(t.amount) }}
                </span>
              </div>
              <p v-if="selectedDay && !dayTransactions.length" class="text-sm text-gray-400 text-center py-4">
                Транзакцій немає
              </p>
              <p v-if="!selectedDay" class="text-sm text-gray-400 text-center py-4">
                Натисніть на день для перегляду
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
