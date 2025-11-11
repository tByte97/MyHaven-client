<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const totalExpenses = ref(0);
const recentTransactions = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

onMounted(() => {
  fetchDashboardData();
});

async function fetchDashboardData() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await axios.get(
      "http://127.0.0.1:8000/transactions/api/dashboard/",
      {
        withCredentials: true,
      }
    );

    totalExpenses.value = response.data.total_expenses;
    recentTransactions.value = response.data.recent_transactions;
  } catch (error) {
    console.error("Помилка завантаження даних:", error);
    errorMessage.value =
      "Не вдалося завантажити дані. Можливо, ви не авторизовані.";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="dashboard">
    <h2>Мій Дашборд</h2>

    <div v-if="isLoading">Завантаження даних з Django...</div>

    <div v-if="errorMessage" style="color: red">
      {{ errorMessage }}
    </div>

    <div v-if="!isLoading && !errorMessage">
      <h3>Загальні витрати: {{ totalExpenses }} грн</h3>

      <h4>Останні 10 транзакцій:</h4>
      <ul>
        <li v-for="t in recentTransactions" :key="t.id">
          {{ t.description }}: <strong>{{ t.amount }} грн</strong>
          <span v-if="t.category"> (Категорія: {{ t.category.name }})</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 20px;
}
ul {
  list-style: none;
  padding-left: 0;
}
li {
  background-color: #fff;
  margin-bottom: 5px;
  padding: 10px;
}
</style>
