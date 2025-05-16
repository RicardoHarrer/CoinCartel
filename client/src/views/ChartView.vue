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
    const chartLoading = ref(false);

    const getCurrentMonthRange = () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from: firstDay.toISOString().split('T')[0],
        to: lastDay.toISOString().split('T')[0],
      };
    };

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
    const loadingPreferences = ref(true);
    const error = ref(null);
    const showAddTransactionDialog = ref(false);
    const exchangeRates = ref({});
    const userid = decodeToken();
    const dateRange = ref(getCurrentMonthRange());

    const userPreferences = ref({
      preferred_currency: 'EUR',
      saldo: 1000.0,
    });

    const currentCurrency = computed(() => {
      return userPreferences.value?.preferred_currency || 'EUR';
    });

    const getExchangeRates = async () => {
      try {
        const response = await axios.get(
          'https://v6.exchangerate-api.com/v6/1bfd15eb1d48a0a8759f2adf/latest/EUR',
        );
        exchangeRates.value = response.data.conversion_rates;
        if (!exchangeRates.value[currentCurrency.value]) {
          exchangeRates.value[currentCurrency.value] = 1;
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        exchangeRates.value = { EUR: 1 };
        if (currentCurrency.value !== 'EUR') {
          exchangeRates.value[currentCurrency.value] = 1;
        }
        $q.notify({
          type: 'negative',
          message: 'Failed to update exchange rates. Using default rates.',
        });
      }
    };

    const fetchUserPreferences = async () => {
      loadingPreferences.value = true;
      try {
        const response = await axios.get(`http://localhost:3000/preferences/${userid}`);
        console.log('API Response:', response.data);

        if (response.data && response.data.length > 0) {
          const prefsFromServer = response.data[0];

          userPreferences.value = {
            preferred_currency: prefsFromServer.preferred_currency || 'EUR',
            saldo: parseFloat(prefsFromServer.saldo) || 1000.0,
          };

          console.log('Merged Preferences:', userPreferences.value);
        }
        await getExchangeRates();
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        userPreferences.value.preferred_currency = 'EUR';
        await getExchangeRates();
      } finally {
        loadingPreferences.value = false;
      }
    };

    const fetchTransactions = async () => {
      if (loadingPreferences.value) return;

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
        const income =
          t.currency === currentCurrency.value
            ? t.income
            : t.income *
              (exchangeRates.value[currentCurrency.value] / (exchangeRates.value[t.currency] || 1));
        const expense =
          t.currency === currentCurrency.value
            ? t.expense
            : t.expense *
              (exchangeRates.value[currentCurrency.value] / (exchangeRates.value[t.currency] || 1));

        groupedData[dateKey].income += Number(income);
        groupedData[dateKey].expense += Number(expense);
      });
      return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    const totalIncome = computed(() => filteredData.value.reduce((sum, t) => sum + t.income, 0));
    const totalExpense = computed(() => filteredData.value.reduce((sum, t) => sum + t.expense, 0));
    const totalBalance = computed(() => totalIncome.value - totalExpense.value);

    const chartOptions = computed(() => {
      if (!userPreferences.value?.preferred_currency) return {};

      const currency = currentCurrency.value;
      const sortedData = [...filteredData.value].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      let previousIncome = 0;
      const incomeData = sortedData.map((t) => {
        const income = t.income;
        previousIncome = Math.max(income, previousIncome);
        return [new Date(t.date).getTime(), previousIncome];
      });

      let previousExpense = 0;
      const expenseData = sortedData.map((t) => {
        const expense = t.expense;
        previousExpense = Math.max(expense, previousExpense);
        return [new Date(t.date).getTime(), previousExpense];
      });

      let previousBalance = 0;
      const balanceData = sortedData.map((t) => {
        previousBalance += Math.max(0, t.income - t.expense);
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
      () => userPreferences.value?.preferred_currency,
      async (newCurrency) => {
        if (newCurrency) {
          chartLoading.value = true;
          try {
            await getExchangeRates();
            await fetchTransactions();
          } finally {
            chartLoading.value = false;
          }
        }
      },
    );

    watch(
      () => dateRange.value,
      () => {
        fetchTransactions();
      },
      { deep: true },
    );

    function updateChart() {
      fetchTransactions();
    }

    function resetToCurrentMonth() {
      dateRange.value = getCurrentMonthRange();
    }

    function handleTransactionAdded() {
      showAddTransactionDialog.value = false;
      fetchTransactions();
    }

    onMounted(async () => {
      try {
        await fetchUserPreferences();
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

    const isPreferencesLoaded = computed(() => !loadingPreferences.value);

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
      isPreferencesLoaded,
      chartLoading,
    };
  },
});
</script>

<template>
  <div v-if="isPreferencesLoaded" class="q-pa-md">
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
            :loading="loadingPreferences"
            @update:model-value="updateChart"
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
        <v-chart
          class="chart"
          :option="chartOptions"
          autoresize
          :loading="chartLoading || loading"
        />
      </q-card-section>
    </q-card>

    <q-card class="stats-card q-mt-md">
      <q-card-section>
        <div class="row q-gutter-md">
          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-green-1">
              <div class="text-h6">Income</div>
              <div class="text-h4 text-green">
                {{ totalIncome.toFixed(2) }}
                <br />
                {{ currentCurrency }}
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-red-1">
              <div class="text-h6">Expenses</div>
              <div class="text-h4 text-red">
                {{ totalExpense.toFixed(2) }}
                <br />
                {{ currentCurrency }}
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-blue-1">
              <div class="text-h6">Balance</div>
              <div class="text-h4" :class="totalBalance >= 0 ? 'text-green' : 'text-red'">
                {{ totalBalance.toFixed(2) }}
                <br />
                {{ currentCurrency }}
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-purple-1">
              <div class="text-h6">Monthly Budget</div>
              <div class="text-h4">
                {{ userPreferences.saldo * exchangeRates[currentCurrency].toFixed(2) }}
                {{ currentCurrency }}
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
  <div v-else class="q-pa-md flex flex-center" style="height: 100vh">
    <q-spinner-gears size="xl" color="primary" />
    <div class="q-ml-md">Loading user preferences...</div>
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
