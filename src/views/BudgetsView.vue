<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../stores/api';
import { usePreferencesStore } from '../stores/preferences';
import { Plus, Trash2, PiggyBank } from 'lucide-vue-next';

const budgets = ref([]);
const categories = ref([]);
const isLoading = ref(true);
const showAddModal = ref(false);
const preferencesStore = usePreferencesStore();

// Current month selector
const currentMonth = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM

const monthLabel = computed(() => {
  const [y, m] = currentMonth.value.split('-');
  const date = new Date(y, m - 1);
  return date.toLocaleDateString(preferencesStore.locale, { year: 'numeric', month: 'long' });
});

const monthParam = computed(() => currentMonth.value + '-01');

const newBudget = ref({ category: '', amount: '' });

const formatCurrency = (val) => preferencesStore.formatCurrency(val);

function progressPercent(spent, limit) {
  if (!limit) return 0;
  return Math.min(100, Math.round((spent / limit) * 100));
}

function progressColor(spent, limit) {
  const pct = progressPercent(spent, limit);
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-orange-500';
  return 'bg-green-500';
}

async function fetchBudgets() {
  isLoading.value = true;
  try {
    const res = await api.getBudgets(monthParam.value);
    budgets.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

async function fetchCategories() {
  try {
    const res = await api.getCategories();
    categories.value = res.data.filter((c) => c.type === 'EXPENSE');
  } catch (e) { console.error(e); }
}

async function addBudget() {
  try {
    await api.createBudget({
      category: newBudget.value.category,
      amount: newBudget.value.amount,
      month: monthParam.value,
    });
    showAddModal.value = false;
    newBudget.value = { category: '', amount: '' };
    fetchBudgets();
  } catch (e) {
    console.error(e);
    alert('Помилка: можливо бюджет для цієї категорії вже існує на цей місяць.');
  }
}

async function deleteBudget(id) {
  if (!confirm('Видалити цей бюджет?')) return;
  try {
    await api.deleteBudget(id);
    fetchBudgets();
  } catch (e) { console.error(e); }
}

function changeMonth(delta) {
  const [y, m] = currentMonth.value.split('-').map(Number);
  const d = new Date(y, m - 1 + delta);
  currentMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  fetchBudgets();
}

// Totals
const totalBudget = computed(() => budgets.value.reduce((s, b) => s + parseFloat(b.amount), 0));
const totalSpent = computed(() => budgets.value.reduce((s, b) => s + parseFloat(b.spent || 0), 0));

onMounted(() => {
  fetchBudgets();
  fetchCategories();
});
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Бюджети</h1>
        <p class="text-gray-500 text-sm">Контроль витрат по категоріях</p>
      </div>
      <button
        @click="showAddModal = true"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
      >
        <Plus :size="18" /> Новий бюджет
      </button>
    </header>

    <!-- Month selector -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <button @click="changeMonth(-1)" class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm transition">&larr;</button>
      <span class="text-lg font-semibold text-gray-900 capitalize">{{ monthLabel }}</span>
      <button @click="changeMonth(1)" class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm transition">&rarr;</button>
    </div>

    <!-- Summary card -->
    <div class="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-xs text-gray-500 mb-1">Загальний бюджет</p>
          <p class="text-xl font-bold text-gray-900">{{ formatCurrency(totalBudget) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Витрачено</p>
          <p class="text-xl font-bold text-red-500">{{ formatCurrency(totalSpent) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Залишок</p>
          <p class="text-xl font-bold" :class="totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-500'">
            {{ formatCurrency(totalBudget - totalSpent) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-gray-400">Завантаження...</div>

    <!-- Budget list -->
    <div v-else class="space-y-4">
      <div v-if="!budgets.length" class="text-center py-12 text-gray-400">
        <PiggyBank :size="48" class="mx-auto mb-3 text-gray-300" />
        <p>Бюджети на цей місяць не створені</p>
      </div>

      <div
        v-for="b in budgets"
        :key="b.id"
        class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      >
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-gray-900">{{ b.category_name }}</h3>
            <p class="text-sm text-gray-500">
              {{ formatCurrency(b.spent) }} з {{ formatCurrency(b.amount) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold" :class="progressPercent(b.spent, b.amount) >= 90 ? 'text-red-500' : 'text-gray-600'">
              {{ progressPercent(b.spent, b.amount) }}%
            </span>
            <button @click="deleteBudget(b.id)" class="text-gray-400 hover:text-red-500 transition">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="progressColor(b.spent, b.amount)"
            :style="{ width: progressPercent(b.spent, b.amount) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Add Budget Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showAddModal = false">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Новий бюджет на {{ monthLabel }}</h3>
        <form @submit.prevent="addBudget" class="space-y-4">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Категорія витрат</label>
            <select v-model="newBudget.category" required
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" disabled>Оберіть категорію</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Ліміт (₴)</label>
            <input v-model="newBudget.amount" type="number" step="0.01" min="1" required
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5000" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="showAddModal = false" class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Скасувати
            </button>
            <button type="submit" class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
              Створити
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
