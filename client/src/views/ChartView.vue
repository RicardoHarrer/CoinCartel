<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { jwtDecode } from 'jwt-decode';
import AddTransaction from '../components/AddTransaction.vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, DataZoomComponent]);

export default defineComponent({
  components: { VChart, AddTransaction },
  setup() {
    const $q = useQuasar();
    const route = useRoute();
    const getCurrentMonthRange = () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from: firstDay.toISOString().split('T')[0],
        to: lastDay.toISOString().split('T')[0],
      };
    };

    const currentCurrency = computed(() => {
      return userPreferences.value?.preferred_currency || 'EUR';
    });

    const decodeToken = () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      try {
        return jwtDecode(token).id;
      } catch (error) {
        console.error('Invalid token:', error);
        return null;
      }
    };

    const transactions = ref([]);
    const loading = ref(false);
    const loadingPreferences = ref(false);
    const error = ref(null);
    const showAddTransactionDialog = ref(false);
    const exchangeRates = ref({});
    const userid = decodeToken();
    const dateRange = ref(getCurrentMonthRange());

    const userPreferences = ref(null);

    const getExchangeRates = async () => {
      try {
        const response = await axios.get(
          'https://v6.exchangerate-api.com/v6/1bfd15eb1d48a0a8759f2adf/latest/EUR',
        );
        exchangeRates.value = response.data.conversion_rates;
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        exchangeRates.value = { EUR: 1 };
      }
    };

    const fetchUserPreferences = async () => {
      loadingPreferences.value = true;
      try {
        const response = await axios.get(`http://localhost:3000/preferences/${userid}`);
        if (response.data) {
          userPreferences.value = response.data;
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
      } finally {
        loadingPreferences.value = false;
      }
    };

    const fetchTransactions = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`http://localhost:3000/transactions/users/${userid}`, {
          params: {
            startDate: dateRange.value.from,
            endDate: dateRange.value.to,
          },
        });

        transactions.value = response.data.map((transaction) => ({
          date: transaction.date,
          income: transaction.transaction_type === 'Einnahme' ? transaction.amount : 0,
          expense: transaction.transaction_type === 'Ausgabe' ? transaction.amount : 0,
          category: transaction.category_id,
          currency: transaction.currency,
          description: transaction.description,
        }));
      } catch (err) {
        console.error('Error fetching transactions:', err);
        error.value = 'Failed to fetch data.';
      } finally {
        loading.value = false;
      }
    };

    const filteredData = computed(() => {
      const groupedData = {};
      transactions.value.forEach((t) => {
        const dateKey = new Date(t.date).toISOString().split('T')[0];
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = { date: dateKey, income: 0, expense: 0 };
        }
        groupedData[dateKey].income += Number(t.income);
        groupedData[dateKey].expense += Number(t.expense);
      });
      return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    const totalIncome = computed(() => filteredData.value.reduce((sum, t) => sum + t.income, 0));
    const totalExpense = computed(() => filteredData.value.reduce((sum, t) => sum + t.expense, 0));
    const totalBalance = computed(() => totalIncome.value - totalExpense.value);

    const chartOptions = computed(() => {
      const currency = currentCurrency.value;
      const rate = exchangeRates.value[currency] || 1;
      const sortedData = [...filteredData.value].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      let previousIncome = 0;
      const incomeData = sortedData.map((t) => {
        const income = t.income * rate;
        previousIncome = Math.max(income, previousIncome);
        return [new Date(t.date).getTime(), previousIncome];
      });

      let previousExpense = 0;
      const expenseData = sortedData.map((t) => {
        const expense = t.expense * rate;
        previousExpense = Math.max(expense, previousExpense);
        return [new Date(t.date).getTime(), previousExpense];
      });

      let previousBalance = 0;
      const balanceData = sortedData.map((t) => {
        previousBalance += Math.max(0, (t.income - t.expense) * rate);
        return [new Date(t.date).getTime(), previousBalance];
      });

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let result = `${new Date(params[0].value[0]).toLocaleDateString()}<br/>`;
            params.forEach((item) => {
              if (item.value[1] !== 0) {
                result += `${item.marker} ${item.seriesName}: ${item.value[1].toFixed(
                  2,
                )} ${currency}<br/>`;
              }
            });
            return result;
          },
        },
        xAxis: {
          type: 'time',
          axisLabel: { formatter: '{yyyy}-{MM}-{dd}' },
        },
        yAxis: {
          type: 'value',
          name: `Amount (${currency})`,
          min: 0,
        },
        series: [
          {
            name: 'Income',
            type: 'line',
            data: incomeData,
            itemStyle: { color: 'green' },
            lineStyle: { width: 2 },
            symbol: 'circle',
            symbolSize: 6,
            smooth: true,
          },
          {
            name: 'Expense',
            type: 'line',
            data: expenseData,
            itemStyle: { color: 'red' },
            lineStyle: { width: 2 },
            symbol: 'circle',
            symbolSize: 6,
            smooth: true,
          },
          {
            name: 'Total Balance',
            type: 'line',
            data: balanceData,
            itemStyle: { color: 'blue' },
            lineStyle: { width: 3 },
            symbol: 'circle',
            symbolSize: 8,
            smooth: true,
          },
        ],
        dataZoom: [{ type: 'slider', start: 0, end: 100 }],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut',
      };
    });

    watch(
      () => userPreferences.value.preferred_currency,
      (newCurrency) => {
        if (newCurrency) {
          getExchangeRates();
          updateChart();
        }
      },
    );

    function updateChart() {
      fetchTransactions();
    }

    function resetToCurrentMonth() {
      dateRange.value = getCurrentMonthRange();
      fetchTransactions();
    }

    function handleTransactionAdded() {
      showAddTransactionDialog.value = false;
      fetchTransactions();
    }

    onMounted(async () => {
      try {
        await fetchUserPreferences();

        await getExchangeRates();

        await fetchTransactions();

        if (route.query.saved) {
          $q.notify({
            type: 'positive',
            message: 'Preferences updated successfully!',
          });
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    });

    return {
      dateRange,
      chartOptions,
      updateChart,
      resetToCurrentMonth,
      loading,
      error,
      showAddTransactionDialog,
      handleTransactionAdded,
      userPreferences,
      exchangeRates,
      totalIncome,
      totalExpense,
      totalBalance,
      loadingPreferences,
      currentCurrency,
    };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <q-card class="chart-card">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Transaction Overview</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-gutter-md">
          <q-input filled v-model="dateRange" label="Select Date Range" mask="date" class="col">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="dateRange"
                    range
                    mask="YYYY-MM-DD"
                    @update:model-value="updateChart"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-select
            v-model="userPreferences.preferred_currency"
            :options="Object.keys(exchangeRates)"
            label="Currency"
            class="col"
            @update:model-value="updateChart"
            :loading="loadingPreferences"
          />

          <q-btn
            label="Reset to Current Month"
            color="primary"
            class="col-auto"
            @click="resetToCurrentMonth"
          />

          <q-btn
            label="Add Transaction"
            color="positive"
            class="col-auto"
            @click="showAddTransactionDialog = true"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <v-chart class="chart" :option="chartOptions" autoresize />
      </q-card-section>
    </q-card>

    <q-card class="stats-card q-mt-md">
      <q-card-section>
        <div class="row q-gutter-md">
          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-green-1">
              <div class="text-h6">Income</div>
              <div class="text-h4 text-green">
                {{
                  (totalIncome * (exchangeRates[userPreferences.preferred_currency] || 1)).toFixed(
                    2,
                  )
                }}
                {{ userPreferences.preferred_currency }}
              </div>
              <div v-if="userPreferences.preferred_currency !== 'EUR'" class="text-h5">
                ≈ {{ totalIncome.toFixed(2) }} EUR
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-red-1">
              <div class="text-h6">Expenses</div>
              <div class="text-h4 text-red">
                {{
                  (totalExpense * (exchangeRates[userPreferences.preferred_currency] || 1)).toFixed(
                    2,
                  )
                }}
                {{ userPreferences.preferred_currency }}
              </div>
              <div v-if="userPreferences.preferred_currency !== 'EUR'" class="text-h5">
                ≈ {{ totalExpense.toFixed(2) }} EUR
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-blue-1">
              <div class="text-h6">Balance</div>
              <div class="text-h4" :class="totalBalance >= 0 ? 'text-green' : 'text-red'">
                {{
                  (totalBalance * (exchangeRates[userPreferences.preferred_currency] || 1)).toFixed(
                    2,
                  )
                }}
                {{ userPreferences.preferred_currency }}
              </div>
              <div v-if="userPreferences.preferred_currency !== 'EUR'" class="text-h5">
                ≈ {{ totalBalance.toFixed(2) }} EUR
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-purple-1">
              <div class="text-h6">Monthly Budget</div>
              <div class="text-h4">
                {{ userPreferences.saldo.toFixed(2) }}
                {{ userPreferences.preferred_currency }}
              </div>
              <div class="q-mt-sm">
                <q-linear-progress
                  :value="Math.min(totalExpense / userPreferences.saldo, 1)"
                  :color="totalExpense / userPreferences.saldo > 0.8 ? 'red' : 'primary'"
                  size="20px"
                >
                  <div class="absolute-full flex flex-center">
                    <span class="text-white">
                      {{ ((totalExpense / userPreferences.saldo) * 100).toFixed(1) }}% used
                    </span>
                  </div>
                </q-linear-progress>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showAddTransactionDialog">
      <AddTransaction @transaction-added="handleTransactionAdded" />
    </q-dialog>
  </div>
</template>

<style scoped>
.chart-card,
.stats-card {
  width: 100%;
  max-width: 1200px;
  margin: auto;
}

.chart {
  width: 100%;
  height: 400px;
}

.q-card-section {
  padding: 20px;
}

.row.q-gutter-md {
  margin-bottom: 16px;
}

.q-input,
.q-btn {
  margin-bottom: 8px;
}

.stat-card {
  text-align: center;
}

.text-h4 {
  margin-top: 8px;
}

.bg-green-1 {
  background-color: rgba(0, 200, 83, 0.1);
}
.bg-red-1 {
  background-color: rgba(255, 0, 0, 0.1);
}
.bg-blue-1 {
  background-color: rgba(33, 150, 243, 0.1);
}
.bg-purple-1 {
  background-color: rgba(156, 39, 176, 0.1);
}

body.body--dark .bg-green-1,
body.body--dark .bg-red-1,
body.body--dark .bg-blue-1,
body.body--dark .bg-purple-1 {
  background-color: #2c2c2c !important;
}
</style>
