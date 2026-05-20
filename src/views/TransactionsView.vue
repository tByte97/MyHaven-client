<script setup>
import { ref, onMounted } from 'vue';
import api from '../stores/api';
import { usePreferencesStore } from '../stores/preferences';
import { Search, Filter, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-vue-next';

const transactions = ref([]);
const categories = ref([]);
const isLoading = ref(true);
const pagination = ref({ count: 0, num_pages: 1, current_page: 1 });
const preferencesStore = usePreferencesStore();

// Filters
const filters = ref({
  search: '',
  category: '',
  type: '',
  date_from: '',
  date_to: '',
  page: 1,
});

// Manual add modal
const showAddModal = ref(false);
const newTransaction = ref({
  amount: '',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0],
  category: '',
});

const formatCurrency = (val) => preferencesStore.formatCurrency(val);
const formatDate = (val) => preferencesStore.formatDate(val);

async function fetchTransactions() {
  isLoading.value = true;
  try {
    const params = { ...filters.value };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    const res = await api.getTransactions(params);
    transactions.value = res.data.results;
    pagination.value = {
      count: res.data.count,
      num_pages: res.data.num_pages,
      current_page: res.data.current_page,
    };
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

async function fetchCategories() {
  try {
    const res = await api.getCategories();
    categories.value = res.data;
  } catch (e) { console.error(e); }
}

function applyFilters() {
  filters.value.page = 1;
  fetchTransactions();
}

function goToPage(p) {
  filters.value.page = p;
  fetchTransactions();
}

async function addTransaction() {
  try {
    await api.createTransaction(newTransaction.value);
    showAddModal.value = false;
    newTransaction.value = { amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0], category: '' };
    fetchTransactions();
  } catch (e) {
    console.error(e);
    alert('Помилка при додаванні транзакції');
  }
}

async function deleteTransaction(id) {
  if (!confirm('Видалити цю транзакцію?')) return;
  try {
    await api.deleteTransaction(id);
    fetchTransactions();
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  fetchTransactions();
  fetchCategories();
});
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <header class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Транзакції</h1>
        <p class="text-gray-500 text-sm">{{ pagination.count }} записів</p>
      </div>
      <button
        @click="showAddModal = true"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
      >
        <Plus :size="18" /> Додати
      </button>
    </header>

    <!-- Filters -->
    <div class="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[180px]">
        <label class="text-xs text-gray-500 mb-1 block">Пошук</label>
        <div class="relative">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="filters.search"
            @keyup.enter="applyFilters"
            placeholder="Опис транзакції..."
            class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label class="text-xs text-gray-500 mb-1 block">Тип</label>
        <select v-model="filters.type" @change="applyFilters" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Всі</option>
          <option value="expense">Витрати</option>
          <option value="income">Доходи</option>
        </select>
      </div>

      <div>
        <label class="text-xs text-gray-500 mb-1 block">Категорія</label>
        <select v-model="filters.category" @change="applyFilters" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Всі</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div>
        <label class="text-xs text-gray-500 mb-1 block">Від</label>
        <input v-model="filters.date_from" @change="applyFilters" type="date" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label class="text-xs text-gray-500 mb-1 block">До</label>
        <input v-model="filters.date_to" @change="applyFilters" type="date" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <button @click="applyFilters" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition flex items-center gap-1">
        <Filter :size="16" /> Фільтр
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center text-gray-400">Завантаження...</div>

      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Дата</th>
            <th class="px-4 py-3 text-left">Опис</th>
            <th class="px-4 py-3 text-left">Категорія</th>
            <th class="px-4 py-3 text-right">Сума</th>
            <th class="px-4 py-3 text-center w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="t in transactions" :key="t.id" class="hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-600">{{ formatDate(t.transaction_date) }}</td>
            <td class="px-4 py-3 text-gray-900 font-medium">{{ t.description }}</td>
            <td class="px-4 py-3">
              <span v-if="t.category" class="px-2 py-0.5 text-xs rounded-full"
                :class="t.category.type === 'EXPENSE' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'">
                {{ t.category.name }}
              </span>
              <span v-else class="text-gray-400 text-xs">—</span>
            </td>
            <td class="px-4 py-3 text-right font-semibold" :class="t.amount > 0 ? 'text-green-600' : 'text-red-500'">
              {{ t.amount > 0 ? '+' : '' }}{{ formatCurrency(t.amount) }}
            </td>
            <td class="px-4 py-3 text-center">
              <button @click="deleteTransaction(t.id)" class="text-gray-400 hover:text-red-500 transition">
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="!transactions.length">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400">Транзакції не знайдено</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.num_pages > 1" class="flex justify-center items-center gap-2 mt-6">
      <button
        @click="goToPage(pagination.current_page - 1)"
        :disabled="pagination.current_page <= 1"
        class="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
      >
        <ChevronLeft :size="18" />
      </button>

      <template v-for="p in pagination.num_pages" :key="p">
        <button
          v-if="Math.abs(p - pagination.current_page) < 3 || p === 1 || p === pagination.num_pages"
          @click="goToPage(p)"
          class="w-9 h-9 rounded-lg text-sm font-medium transition"
          :class="p === pagination.current_page ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'"
        >
          {{ p }}
        </button>
        <span v-else-if="Math.abs(p - pagination.current_page) === 3" class="text-gray-400">...</span>
      </template>

      <button
        @click="goToPage(pagination.current_page + 1)"
        :disabled="pagination.current_page >= pagination.num_pages"
        class="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Add Transaction Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showAddModal = false">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Нова транзакція</h3>
        <form @submit.prevent="addTransaction" class="space-y-4">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Сума (від'ємна для витрат)</label>
            <input v-model="newTransaction.amount" type="number" step="0.01" required
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="-150.00" />
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Опис</label>
            <input v-model="newTransaction.description" required
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="На що витратили?" />
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Дата</label>
            <input v-model="newTransaction.transaction_date" type="date" required
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Категорія</label>
            <select v-model="newTransaction.category"
              class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Без категорії</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }} ({{ c.type === 'EXPENSE' ? 'Витрата' : 'Дохід' }})</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="showAddModal = false" class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Скасувати
            </button>
            <button type="submit" class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
              Додати
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
