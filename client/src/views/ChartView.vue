<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import axios from "axios";
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, DataZoomComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import { jwtDecode } from "jwt-decode";
import AddTransaction from "../components/AddTransaction.vue";

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, DataZoomComponent]);

export default defineComponent({
  components: { VChart, AddTransaction },
  setup() {
    const transactions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const showAddTransactionDialog = ref(false);

    const exchangeRates = ref({});
    const selectedCurrency = ref("EUR");

    // const getExchangeRates = async () => {
    //   try {
    //     const response = await axios.get(
    //       'https://v6.exchangerate-api.com/v6/1bfd15eb1d48a0a8759f2adf/latest/EUR',
    //     );
    //     exchangeRates.value = response.data.conversion_rates;
    //   } catch (error) {
    //     console.error('Failed to fetch exchange rates:', error);
    //   }
    // };

    const getCurrentMonthRange = () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    };

    const decodeToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found! Please log in.");
        return null;
      }

      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.id || null;
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    };

    const userid = decodeToken();
    const dateRange = ref(getCurrentMonthRange());

    const fetchTransactions = async () => {
      loading.value = true;
      try {
        const response = await axios.get(
          `http://localhost:3000/transactions/users/${userid}`,
          {
            params: {
              startDate: dateRange.value.from,
              endDate: dateRange.value.to,
            },
          }
        );

        transactions.value = response.data.map((transaction) => ({
          date: transaction.date,
          income: transaction.transaction_type === "Einnahme" ? transaction.amount : 0,
          expense: transaction.transaction_type === "Ausgabe" ? transaction.amount : 0,
          category: transaction.category_id,
          currency: transaction.currency,
          description: transaction.description,
        }));
      } catch (err) {
        console.error("Error fetching transactions:", err);
        error.value = "Failed to fetch data.";
      } finally {
        loading.value = false;
      }
    };

    const filteredData = computed(() => {
      const groupedData = {};

      transactions.value.forEach((t) => {
        const dateKey = new Date(t.date).toISOString().split("T")[0];
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = { date: dateKey, income: 0, expense: 0 };
        }
        groupedData[dateKey].income += Number(t.income);
        groupedData[dateKey].expense += Number(t.expense);
      });

      return Object.values(groupedData).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    });

    // Neue berechnete Eigenschaften für die Statistiken
    const totalIncome = computed(() => {
      return filteredData.value.reduce((sum, t) => sum + t.income, 0);
    });

    const totalExpense = computed(() => {
      return filteredData.value.reduce((sum, t) => sum + t.expense, 0);
    });

    const totalBalance = computed(() => {
      return totalIncome.value - totalExpense.value;
    });

    const chartOptions = computed(() => {
      const currency = selectedCurrency.value;
      const rate = exchangeRates.value[currency] || 1;

      const sortedData = [...filteredData.value].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      let cumulativeBalance = 0;
      const balanceData = sortedData.map((t) => {
        cumulativeBalance += (t.income - t.expense) * rate;
        return [new Date(t.date).getTime(), cumulativeBalance];
      });

      return {
        tooltip: {
          trigger: "axis",
          formatter: (params) => {
            let result = `${new Date(params[0].value[0]).toLocaleDateString()}<br/>`;
            params.forEach((item) => {
              if (item.value[1] !== 0) {
                result += `${item.marker} ${item.seriesName}: ${item.value[1].toFixed(
                  2
                )} ${currency}<br/>`;
              }
            });
            return result;
          },
        },
        xAxis: {
          type: "time",
          axisLabel: { formatter: "{yyyy}-{MM}-{dd}" },
        },
        yAxis: { type: "value", name: `Amount (${currency})` },
        series: [
          {
            name: "Income",
            type: "line",
            data: sortedData.map((t) => [new Date(t.date).getTime(), t.income * rate]),
            itemStyle: { color: "green" },
          },
          {
            name: "Expense",
            type: "line",
            data: sortedData.map((t) => [new Date(t.date).getTime(), t.expense * rate]),
            itemStyle: { color: "red" },
          },
          {
            name: "Total Balance",
            type: "line",
            data: balanceData,
            itemStyle: { color: "blue" },
          },
        ],
        dataZoom: [{ type: "slider", start: 0, end: 100 }],
      };
    });

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

    onMounted(() => {
      fetchTransactions();
      // ExchangeRateAPI
      //getExchangeRates();
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
      selectedCurrency,
      exchangeRates,
      totalIncome,
      totalExpense,
      totalBalance,
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
          <q-input
            filled
            v-model="dateRange"
            label="Select Date Range"
            mask="date"
            class="col"
          >
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
            v-model="selectedCurrency"
            :options="Object.keys(exchangeRates)"
            label="Currency"
            class="col"
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
        <v-chart class="chart" :option="chartOptions" autoresize />
      </q-card-section>
    </q-card>

    <!-- Neue Statistik-Sektion -->
    <q-card class="stats-card q-mt-md">
      <q-card-section>
        <div class="row q-gutter-md">
          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-green-1">
              <div class="text-h6">Income</div>
              <div class="text-h4 text-green">
                {{ (totalIncome * (exchangeRates[selectedCurrency] || 1)).toFixed(2) }}
                {{ selectedCurrency }}
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-red-1">
              <div class="text-h6">Expenses</div>
              <div class="text-h4 text-red">
                {{ (totalExpense * (exchangeRates[selectedCurrency] || 1)).toFixed(2) }}
                {{ selectedCurrency }}
              </div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card col" flat bordered>
            <q-card-section class="bg-blue-1">
              <div class="text-h6">Balance</div>
              <div class="text-h4" :class="totalBalance >= 0 ? 'text-green' : 'text-red'">
                {{ (totalBalance * (exchangeRates[selectedCurrency] || 1)).toFixed(2) }}
                {{ selectedCurrency }}
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

body.body--dark .bg-green-1,
body.body--dark .bg-red-1,
body.body--dark .bg-blue-1 {
  background-color: #2c2c2c !important;
}
</style>
