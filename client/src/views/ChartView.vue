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
        console.log('Decoded Token:', decodedToken);
        return decodedToken.id || null;
      } catch (error) {
        console.error('Invalid token:', error);
        return null;
      }
    };

    const userid = decodeToken();
    console.log('User ID:', userid);

    if (!userid || isNaN(userid)) {
      console.error('Invalid or missing user ID!');
    } else {
      console.log('Valid user ID:', userid);
    }

    const dateRange = ref(getCurrentMonthRange());

    const fetchTransactions = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`http://localhost:3000/transactions/users/${userid}`, {
          params: { startDate: dateRange.value.from, endDate: dateRange.value.to },
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
      return transactions.value.filter(
        (t) => t.date >= dateRange.value.from && t.date <= dateRange.value.to,
      );
    });

    const chartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          let result = `${new Date(params[0].value[0]).toLocaleDateString()}<br/>`; // Fix date
          params.forEach((item) => {
            if (item.value[1] !== 0) {
              result += `${item.marker} ${item.seriesName}: ${item.value[1]} ${filteredData.value[0]?.currency}<br/>`;
            }
          });
          return result;
        },
      },
      xAxis: {
        type: 'time',
        axisLabel: { formatter: '{yyyy}-{MM}-{dd}' },
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Income',
          type: 'line',
          data: filteredData.value
            .filter((t) => t.date)
            .map((t) => [new Date(t.date).getTime(), t.income]),
          itemStyle: { color: 'green' },
        },
        {
          name: 'Expense',
          type: 'line',
          data: filteredData.value
            .filter((t) => t.date)
            .map((t) => [new Date(t.date).getTime(), t.expense]),
          itemStyle: { color: 'red' },
        },
      ],
      dataZoom: [{ type: 'slider', start: 0, end: 100 }],
    }));

    onMounted(fetchTransactions);

    function updateChart() {
      fetchTransactions();
    }

    function resetToCurrentMonth() {
      dateRange.value = getCurrentMonthRange();
      fetchTransactions();
    }

    return { dateRange, chartOptions, updateChart, resetToCurrentMonth, loading, error };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <q-card class="q-pa-md">
      <q-card-section>
        <q-input
          filled
          v-model="dateRange"
          label="Select Date Range"
          mask="YYYY-MM-DD - YYYY-MM-DD"
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
        <q-btn
          label="Reset to Current Month"
          color="primary"
          class="q-mt-md"
          @click="resetToCurrentMonth"
        />
      </q-card-section>

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
