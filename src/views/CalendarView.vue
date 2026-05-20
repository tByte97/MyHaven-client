<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../stores/api';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const calendarData = ref([]);
const dayTransactions = ref([]);
const selectedDay = ref(null);
const isLoading = ref(true);

const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth() + 1); // 1-based

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1);
  return d.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' });
});

const formatCurrency = (val) =>
  new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);

// Build calendar grid
const calendarGrid = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();

  // Monday = 0 in our grid
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const grid = [];

  // Empty cells before first day
  for (let i = 0; i < startDay; i++) {
    grid.push({ day: null });
  }

  // Days of the month
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
  isLoading.value = true;
  selectedDay.value = null;
  dayTransactions.value = [];
  try {
    const res = await api.getCalendar(currentYear.value, currentMonth.value);
    calendarData.value = res.data.days;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
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
  if (cell.expenses > 0 && cell.incomes > 0) return 'bg-yellow-50 border-yellow-200';
  if (cell.expenses > 0) return 'bg-red-50 border-red-200';
  return 'bg-green-50 border-green-200';
}

onMounted(() => {
  fetchCalendar();
});

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Календар витрат</h1>
      <p class="text-gray-500 text-sm">Переглядайте витрати та доходи по днях</p>
    </header>

    <!-- Month selector -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <button @click="changeMonth(-1)" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
        <ChevronLeft :size="20" />
      </button>
      <span class="text-lg font-semibold text-gray-900 capitalize min-w-[200px] text-center">{{ monthLabel }}</span>
      <button @click="changeMonth(1)" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
        <ChevronRight :size="20" />
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-400">Завантаження...</div>

    <div v-else class="flex gap-6">
      <!-- Calendar grid -->
      <div class="flex-1">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <!-- Header -->
          <div class="grid grid-cols-7 bg-gray-50">
            <div v-for="d in weekDays" :key="d" class="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
              {{ d }}
            </div>
          </div>

          <!-- Days -->
          <div class="grid grid-cols-7">
            <div
              v-for="(cell, idx) in calendarGrid"
              :key="idx"
              @click="selectDay(cell)"
              class="min-h-[80px] border border-gray-100 p-2 transition cursor-pointer hover:bg-gray-50"
              :class="[
                cellColor(cell),
                cell.isToday ? 'ring-2 ring-blue-400 ring-inset' : '',
                selectedDay && selectedDay.day === cell.day ? 'ring-2 ring-blue-600 ring-inset bg-blue-50' : '',
              ]"
            >
              <div v-if="cell.day" class="text-sm font-medium" :class="cell.isToday ? 'text-blue-600' : 'text-gray-700'">
                {{ cell.day }}
              </div>
              <div v-if="cell.expenses" class="text-xs text-red-500 mt-1">
                -{{ formatCurrency(cell.expenses) }}
              </div>
              <div v-if="cell.incomes" class="text-xs text-green-600">
                +{{ formatCurrency(cell.incomes) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Day details sidebar -->
      <div class="w-80 shrink-0">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
          <h3 class="font-semibold text-gray-900 mb-3">
            {{ selectedDay ? `${selectedDay.day} ${monthLabel}` : 'Оберіть день' }}
          </h3>

          <div v-if="selectedDay" class="mb-4 flex gap-3">
            <div class="flex-1 bg-red-50 rounded-xl p-3 text-center">
              <p class="text-xs text-gray-500">Витрати</p>
              <p class="font-semibold text-red-500 text-sm">{{ formatCurrency(selectedDay.expenses || 0) }}</p>
            </div>
            <div class="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <p class="text-xs text-gray-500">Доходи</p>
              <p class="font-semibold text-green-600 text-sm">{{ formatCurrency(selectedDay.incomes || 0) }}</p>
            </div>
          </div>

          <div class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="t in dayTransactions"
              :key="t.id"
              class="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ t.description }}</p>
                <p class="text-xs text-gray-400">{{ t.category?.name || '—' }}</p>
              </div>
              <span class="text-sm font-semibold" :class="t.amount > 0 ? 'text-green-600' : 'text-red-500'">
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
</template>
