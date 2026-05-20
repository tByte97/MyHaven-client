  <script setup>
  import { ref, onMounted, computed } from "vue";
  import axios from "axios";
  import { API_BASE } from "../config";
  import { Line, Doughnut } from "vue-chartjs";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    CategoryScale,
    LinearScale,
    ArcElement,
  } from "chart.js";

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    CategoryScale,
    LinearScale,
    ArcElement
  );

  const monthlyData = ref([]);
  const expenseData = ref([]);
  const incomeData = ref([]);
  const bankData = ref([]);
  const isLoading = ref(true);


  const selectedMonths = ref('6'); 
  const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: true,
  });

  //дані для лінійного графіка (доходи/витрати)
  const lineChartData = computed(() => {
    if (!monthlyData.value.length) return { datasets: [] };

    const labels = monthlyData.value.map((d) =>
      new Date(d.month).toISOString().slice(0, 7)
    );

    return {
      labels: labels,
      datasets: [
        {
          label: "Доходи",
          backgroundColor: "green",
          borderColor: "green",
          data: monthlyData.value.map((d) => d.total_incomes || 0),
        },
        {
          label: "Витрати",
          backgroundColor: "red",
          borderColor: "red",
          data: monthlyData.value.map((d) => Math.abs(d.total_expenses || 0)),
        },
      ],
    };
  });

  // дані для кругового графік(витрати)
  const expenseDoughnutData = computed(() => {
    if (!expenseData.value.length) return { datasets: [] };

    return {
      labels: expenseData.value.map((d) => d.category__name),
      datasets: [
        {
          backgroundColor: [
            "#E74C3C",
            "#A93226",
            "#F1948A",
            "#C0392B",
            "#EC7063",
          ],
          data: expenseData.value.map((d) => Math.abs(d.total)),
        },
      ],
    };
  });

  // дані ля кругового графік(доходи)
  const incomeDoughnutData = computed(() => {
    if (!incomeData.value.length) return { datasets: [] };

    return {
      labels: incomeData.value.map((d) => d.category__name),
      datasets: [
        {
          backgroundColor: ["#2ECC71", "#27AE60", "#7DCEA0", "#229954"],
          data: incomeData.value.map((d) => d.total),
        },
      ],
    };
  });

  // дані для кругового графіка (по банках)
  const bankChartData = computed(() => {
    if (!bankData.value.length) return { datasets: [] };

    return {
      labels: bankData.value.map((d) => d.account__bank__name || 'Невідомий'),
      datasets: [
        {
          backgroundColor: ["#3498DB", "#2980B9", "#1ABC9C", "#16A085", "#F39C12"],
          data: bankData.value.map((d) => Math.abs((d.expenses || 0)) + (d.incomes || 0)),
        },
      ],
    };
  });

  onMounted(() => {
    fetchStatistics();
  });

async function fetchStatistics() {
  isLoading.value = true;
  try {
    const response = await axios.get(
      `${API_BASE}/transactions/api/statistics/`,
      {
        params: {
            months: selectedMonths.value
        },
        withCredentials: true,
      }
    );
    monthlyData.value = response.data.monthly_summary;
    expenseData.value = response.data.expense_categories;
    incomeData.value = response.data.income_categories;
    bankData.value = response.data.by_bank_stats || [];
  } catch (error) {
    console.error("Помилка завантаження статистики:", error);
  } finally {
    isLoading.value = false;
  }
}
  </script>

  <template>
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div>
          <h1>Фінансова Аналітика</h1>
          <p class="subtitle">Огляд ваших фінансів за вибраний період</p>
        </div>

        <div class="filter-wrapper">
          <label for="period">Період:</label>
          <select
            id="period"
            v-model="selectedMonths"
            @change="fetchStatistics"
            class="styled-select"
          >
            <option value="1">Останній місяць</option>
            <option value="3">3 місяці</option>
            <option value="6">6 місяців</option>
            <option value="12">Рік</option>
            <option value="24">2 роки</option>
          </select>
        </div>
      </header>

      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Аналізуємо дані...</p>
      </div>

      <div v-else class="stats-grid">
        <section class="stats-card full-width">
          <div class="card-header">
            <h3>Динаміка (Доходи vs Витрати)</h3>
          </div>
          <div class="chart-wrapper large-chart">
            <Line :data="lineChartData" :options="chartOptions" />
          </div>
        </section>

        <section class="stats-card">
          <div class="card-header">
            <h3>Структура Витрат</h3>
          </div>
          <div class="chart-wrapper">
            <Doughnut
              v-if="expenseData.length"
              :data="expenseDoughnutData"
              :options="chartOptions"
            />
            <div v-else class="no-data">Немає даних про витрати</div>
          </div>
        </section>

        <section class="stats-card">
          <div class="card-header">
            <h3>Структура Доходів</h3>
          </div>
          <div class="chart-wrapper">
            <Doughnut
              v-if="incomeData.length"
              :data="incomeDoughnutData"
              :options="chartOptions"
            />
            <div v-else class="no-data">Немає даних про доходи</div>
          </div>
        </section>

        <section class="stats-card">
          <div class="card-header">
            <h3>По Банках (Net Flow)</h3>
          </div>
          <div class="chart-wrapper">
            <Doughnut
              v-if="bankData && bankData.length"
              :data="bankChartData"
              :options="chartOptions"
            />
            <div v-else class="no-data">Немає даних по банках</div>
          </div>
        </section>
      </div>
    </div>
  </template>

  <style scoped>
  .dashboard-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 30px 20px;
    font-family: "Inter", sans-serif;
    color: #2c3e50;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    flex-wrap: wrap;
    gap: 20px;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    color: #1e293b;
  }

  .subtitle {
    margin-top: 5px;
    color: #64748b;
    font-size: 0.95rem;
  }

  .filter-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    padding: 10px 20px;
    border-radius: 50px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .styled-select {
    border: none;
    background: transparent;
    font-size: 1rem;
    font-weight: 500;
    color: #3b82f6;
    cursor: pointer;
    outline: none;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;
  }

  .stats-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
  }

  .stats-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  }

  .full-width {
    grid-column: 1 / -1;
  }

  .card-header h3 {
    margin: 0 0 20px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #334155;
    border-left: 4px solid #3b82f6;
    padding-left: 10px;
  }

  .chart-wrapper {
    position: relative;
    height: 300px;
    width: 100%;
  }

  .large-chart {
    height: 400px;
  }

  .no-data {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-style: italic;
  }

  .loading-container {
    text-align: center;
    padding: 100px 0;
    color: #64748b;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .large-chart {
      height: 300px;
    }
  }
  </style>
