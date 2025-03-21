<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { jwtDecode } from 'jwt-decode';
import AddTransaction from '../components/AddTransaction.vue';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, DataZoomComponent]);

export default defineComponent({
  components: { VChart, AddTransaction },
  setup() {
    const transactions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const showAddTransactionDialog = ref(false);

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
      if (!token) {
        console.error('No token found! Please log in.');
        return null;
      }

      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.id || null;
      } catch (error) {
        console.error('Invalid token:', error);
        return null;
      }
    };

    const userid = decodeToken();

    const dateRange = ref(getCurrentMonthRange());

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

    const chartOptions = computed(() => {
      const currency = transactions.value.length > 0 ? transactions.value[0].currency : '';

      const sortedData = [...filteredData.value].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      let cumulativeBalance = 0;
      const balanceData = sortedData.map((t) => {
        cumulativeBalance += t.income - t.expense;
        return [new Date(t.date).getTime(), cumulativeBalance];
      });

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let result = `${new Date(params[0].value[0]).toLocaleDateString()}<br/>`;
            params.forEach((item) => {
              if (item.value[1] !== 0) {
                result += `${item.marker} ${item.seriesName}: ${item.value[1]} ${currency}<br/>`;
              }
            });
            return result;
          },
        },
        xAxis: {
          type: 'time',
          axisLabel: { formatter: '{yyyy}-{MM}-{dd}' },
        },
        yAxis: { type: 'value', name: `Amount (${currency})` },
        series: [
          {
            name: 'Income',
            type: 'line',
            data: sortedData.map((t) => [new Date(t.date).getTime(), t.income]),
            itemStyle: { color: 'green' },
          },
          {
            name: 'Expense',
            type: 'line',
            data: sortedData.map((t) => [new Date(t.date).getTime(), t.expense]),
            itemStyle: { color: 'red' },
          },
          {
            name: 'Total Balance',
            type: 'line',
            data: balanceData,
            itemStyle: { color: 'blue' },
          },
        ],
        dataZoom: [{ type: 'slider', start: 0, end: 100 }],
      };
    });

    onMounted(fetchTransactions);

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

    return {
      dateRange,
      chartOptions,
      updateChart,
      resetToCurrentMonth,
      loading,
      error,
      showAddTransactionDialog,
      handleTransactionAdded,
    };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <!-- Main Card -->
    <q-card class="chart-card">
      <!-- Card Header -->
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Transaction Overview</div>
      </q-card-section>

      <!-- Date Range Selector and Buttons -->
      <q-card-section>
        <div class="row q-gutter-md">
          <!-- Date Range Input -->
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

          <!-- Reset to Current Month Button -->
          <q-btn
            label="Reset to Current Month"
            color="primary"
            class="col-auto"
            @click="resetToCurrentMonth"
          />

          <!-- Add Transaction Button -->
          <q-btn
            label="Add Transaction"
            color="positive"
            class="col-auto"
            @click="showAddTransactionDialog = true"
          />
        </div>
      </q-card-section>

      <!-- Chart -->
      <q-card-section>
        <v-chart class="chart" :option="chartOptions" autoresize />
      </q-card-section>
    </q-card>

    <!-- Add Transaction Dialog -->
    <q-dialog v-model="showAddTransactionDialog">
      <AddTransaction @transaction-added="handleTransactionAdded" />
    </q-dialog>
  </div>
</template>



<style scoped>
.chart-card {
  width: 100%;
  max-width: 1200px; /* Adjust the width as needed */
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
</style>