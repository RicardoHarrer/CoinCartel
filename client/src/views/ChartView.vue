<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { jwtDecode } from 'jwt-decode';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, DataZoomComponent]);

export default defineComponent({
  components: { VChart },
  setup() {
    const transactions = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Form fields for adding a new transaction
    const newTransaction = ref({
      date: new Date().toISOString().split('T')[0], // Default to today's date
      amount: 0,
      transaction_type: 'Einnahme', // Default to income
      category_id: '',
      currency: 'EUR', // Default currency
      description: '',
    });

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

    const addTransaction = async () => {
      try {
        // Ensure the user ID is available
        const userid = decodeToken();
        if (!userid) {
          console.error('User ID not found. Please log in.');
          return;
        }

        // Prepare the request payload
        const payload = {
          userId: userid,
          categoryId: newTransaction.value.category_id,
          amount: newTransaction.value.amount,
          transactionType: newTransaction.value.transaction_type,
          currency: newTransaction.value.currency,
          description: newTransaction.value.description,
        };

        // Send the POST request to the backend
        const response = await axios.post('http://localhost:3000/transactions', payload);

        // Handle the response
        if (response.status === 200) {
          console.log('Transaction successfully added');
          // Clear the form
          newTransaction.value = {
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            transaction_type: 'Einnahme',
            category_id: '',
            currency: 'EUR',
            description: '',
          };

          // Refresh the chart
          fetchTransactions();
        } else {
          console.error('Failed to add transaction:', response.data);
          error.value = 'Failed to add transaction.';
        }
      } catch (err) {
        console.error('Error adding transaction:', err);
        error.value = 'Failed to add transaction.';
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

    return {
      dateRange,
      chartOptions,
      updateChart,
      resetToCurrentMonth,
      loading,
      error,
      newTransaction,
      addTransaction,
    };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <q-card class="q-pa-md">
      <q-card-section>
        <!-- Date Range Selector -->
        <q-input filled v-model="dateRange" label="Select Date Range" mask="date">
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
        <q-btn
          label="Reset to Current Month"
          color="primary"
          class="q-mt-md"
          @click="resetToCurrentMonth"
        />
      </q-card-section>

      <!-- Add Transaction Form -->
      <q-card-section>
        <q-form @submit="addTransaction">
          <q-input filled v-model="newTransaction.date" label="Date" type="date" required />
          <q-input
            filled
            v-model="newTransaction.amount"
            label="Amount"
            type="number"
            step="0.01"
            required
          />
          <q-select
            filled
            v-model="newTransaction.transaction_type"
            label="Type"
            :options="['Einnahme', 'Ausgabe']"
            required
          />
          <q-input filled v-model="newTransaction.category_id" label="Category" required />
          <q-input filled v-model="newTransaction.currency" label="Currency" required />
          <q-input filled v-model="newTransaction.description" label="Description" />
          <q-btn label="Add Transaction" type="submit" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>

      <!-- Chart -->
      <v-chart class="chart" :option="chartOptions" autoresize />
    </q-card>
  </div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 400px;
}
</style>
