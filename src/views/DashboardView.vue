<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  ShoppingBag, 
  TrendingUp,
  MoreHorizontal
} from 'lucide-vue-next';

// --- Стан ---
const totalExpenses = ref(0);
const totalIncomes = ref(0);
const balance = ref(0);
const recentTransactions = ref([]);
const isLoading = ref(true);

const budgets = ref([
  { name: 'Кава', spent: 200, limit: 500, color: 'bg-orange-500' },
  { name: 'Продукти', spent: 4500, limit: 8000, color: 'bg-purple-500' },
]);

onMounted(() => {
  fetchDashboardData();
});

async function fetchDashboardData() {
  isLoading.value = true;
  try {
    const response = await axios.get('http://127.0.0.1:8000/transactions/api/dashboard/');
    totalExpenses.value = response.data.total_expenses || 0;
    totalIncomes.value = response.data.total_incomes || 0;
    balance.value = response.data.balance || 0;
    recentTransactions.value = response.data.recent_transactions || [];
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

const formatCurrency = (val) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto pb-24"> 
    
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Добрий день</h1>
        <p class="text-gray-500 text-sm">Ваш фінансовий огляд</p>
      </div>
      <button class="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">
        <MoreHorizontal class="text-gray-500" />
      </button>
    </header>

    <div class="bg-white rounded-3xl p-8 mb-6 shadow-xl shadow-gray-200/50 relative overflow-hidden border border-gray-100">
      <div class="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <p class="text-gray-500 text-sm font-medium mb-1">Загальний баланс</p>
      <h2 class="text-4xl font-bold text-gray-900 mb-6">{{ formatCurrency(balance) }}</h2>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <ArrowDownLeft size="20" />
          </div>
          <div>
            <p class="text-xs text-gray-500">Дохід</p>
            <p class="font-semibold text-green-600">{{ formatCurrency(totalIncomes) }}</p>
          </div>
        </div>

        <div class="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <ArrowUpRight size="20" />
          </div>
          <div>
            <p class="text-xs text-gray-500">Витрати</p>
            <p class="font-semibold text-red-500">{{ formatCurrency(totalExpenses) }}</p>
          </div>
        </div>
      </div>
    </div>

    <section class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-900">Бюджети</h3>
        <button class="text-blue-600 text-sm font-medium hover:text-blue-700">Всі</button>
      </div>

      <div class="space-y-4">
        <div v-for="budget in budgets" :key="budget.name" class="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag size="20" class="text-gray-500" /> 
          </div>
          <div class="flex-1">
            <div class="flex justify-between mb-2">
              <span class="font-medium text-gray-900">{{ budget.name }}</span>
              <span class="text-sm text-gray-500">
                <span class="text-red-500 font-medium">{{ budget.spent }}</span> / {{ budget.limit }} ₴
              </span>
            </div>
            <div class="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full" 
                :class="budget.color" 
                :style="{ width: (budget.spent / budget.limit) * 100 + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-900">Останні транзакції</h3>
        <button class="text-blue-600 text-sm font-medium hover:text-blue-700">Всі</button>
      </div>

      <div class="space-y-3">
        <div v-for="t in recentTransactions" :key="t.id" class="bg-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer shadow-sm border border-gray-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
               <Wallet v-if="t.amount < 0" size="20" />
               <TrendingUp v-else size="20" class="text-green-600" />
            </div>
            
            <div>
              <p class="font-medium text-gray-900">{{ t.description }}</p>
              <p class="text-xs text-gray-500">{{ new Date(t.transaction_date).toLocaleDateString() }}</p>
            </div>
          </div>

          <span 
            class="font-semibold"
            :class="t.amount > 0 ? 'text-green-600' : 'text-red-500'"
          >
            {{ t.amount > 0 ? '+' : '' }}{{ formatCurrency(t.amount) }}
          </span>
        </div>
      </div>
    </section>

    <button class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center text-white hover:bg-blue-700 hover:scale-105 transition">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

  </div>
</template>

<style>
/* Стилі не потрібні, все через Tailwind */
</style>