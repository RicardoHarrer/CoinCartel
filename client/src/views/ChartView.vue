// ChartView.vue
<script>
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { use } from "echarts/core";
import { LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import { jwtDecode } from "jwt-decode";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import CategoryPieChart from "@/components/CategoryPieChart.vue";
import { auth } from "@/utils/auth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
]);

export default defineComponent({
  components: { VChart, CategoryPieChart },
  setup() {
    const $q = useQuasar();
    const route = useRoute();
    const chartLoading = ref(false);
    const categories = ref([]);
    const allTransactions = ref([]); // Store all transactions
    const filteredTransactions = ref([]); // Store filtered transactions
    const loading = ref(false);
    const loadingPreferences = ref(true);
    const error = ref(null);
    const exchangeRates = ref({});
    const dateRange = ref({
      from: null,
      to: null,
    });

    // Initialize with current month
    function initDateRange() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      dateRange.value = {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    }

    const userid = decodeToken();
    const userPreferences = ref({
      preferred_currency: "EUR",
      saldo: 1000.0,
    });

    function decodeToken() {
      const token = auth.getToken();
      if (!token) return null;
      try {
        console.log("Decoding token:", jwtDecode(token));
        return jwtDecode(token).id;
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }

    // PDF Export Funktionen
    const exportPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text("Financial Report - Transaction Overview", 105, 20, { align: "center" });

        // Header Info
        doc.setFontSize(10);
        doc.text(`Date Range: ${dateRange.value.from} to ${dateRange.value.to}`, 20, 35);
        doc.text(`Currency: ${currentCurrency.value}`, 20, 42);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 49);

        const tableData = filteredTransactions.value.map((t) => [
          t.date.split("T")[0],
          t.description || "No description",
          getCategoryName(t.category_id),
          t.transaction_type === "Einnahme" ? "Income" : "Expense",
          `${t.transaction_type === "Einnahme" ? "+" : "-"}${t.amount} ${
            t.currency || currentCurrency.value
          }`,
        ]);

        autoTable(doc, {
          head: [["Date", "Description", "Category", "Type", "Amount"]],
          body: tableData,
          startY: 60,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 133, 244] },
        });

        // Summary Section
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text("Summary", 20, finalY);
        doc.setFontSize(10);
        doc.text(
          `Total Income: ${totalIncome.value.toFixed(2)} ${currentCurrency.value}`,
          20,
          finalY + 8
        );
        doc.text(
          `Total Expenses: ${totalExpense.value.toFixed(2)} ${currentCurrency.value}`,
          20,
          finalY + 16
        );
        doc.text(
          `Net Balance: ${totalBalance.value.toFixed(2)} ${currentCurrency.value}`,
          20,
          finalY + 24
        );
        doc.text(
          `Budget Usage: ${(budgetUsagePercentage.value * 100).toFixed(1)}%`,
          20,
          finalY + 32
        );

        doc.save(`financial_report_${dateRange.value.from}_to_${dateRange.value.to}.pdf`);
        $q.notify({
          type: "positive",
          message: "PDF report successfully generated",
        });
      } catch (err) {
        console.error("PDF Export Error:", err);
        $q.notify({
          type: "negative",
          message: "Error generating PDF report",
        });
      }
    };

    const exportCategoryPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text("Financial Report - Category Summary", 105, 20, { align: "center" });

        // Header Info
        doc.setFontSize(10);
        doc.text(`Date Range: ${dateRange.value.from} to ${dateRange.value.to}`, 20, 35);
        doc.text(`Currency: ${currentCurrency.value}`, 20, 42);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 49);

        const categoryData = computeCategorySummary();
        const tableData = categoryData.map((cat) => [
          cat.name,
          cat.income.toFixed(2),
          cat.expenses.toFixed(2),
          (cat.income - cat.expenses).toFixed(2),
          cat.transactionCount,
        ]);

        autoTable(doc, {
          head: [["Category", "Income", "Expenses", "Balance", "Transactions"]],
          body: tableData,
          startY: 60,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 133, 244] },
        });

        // Summary Section
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text("Category Overview", 20, finalY);
        doc.setFontSize(10);
        doc.text(
          `Total Income: ${categoryData
            .reduce((sum, cat) => sum + cat.income, 0)
            .toFixed(2)} ${currentCurrency.value}`,
          20,
          finalY + 8
        );
        doc.text(
          `Total Expenses: ${categoryData
            .reduce((sum, cat) => sum + cat.expenses, 0)
            .toFixed(2)} ${currentCurrency.value}`,
          20,
          finalY + 16
        );
        doc.text(
          `Net Balance: ${categoryData
            .reduce((sum, cat) => sum + (cat.income - cat.expenses), 0)
            .toFixed(2)} ${currentCurrency.value}`,
          20,
          finalY + 24
        );

        doc.save(`category_report_${dateRange.value.from}_to_${dateRange.value.to}.pdf`);
        $q.notify({
          type: "positive",
          message: "Category PDF report successfully generated",
        });
      } catch (err) {
        console.error("Category PDF Export Error:", err);
        $q.notify({
          type: "negative",
          message: "Error generating category PDF report",
        });
      }
    };

    // Hilfsfunktionen für PDF Export
    const getCategoryName = (categoryId) => {
      const category = categories.value.find((c) => c.id === categoryId);
      return category ? category.name : "Uncategorized";
    };

    const computeCategorySummary = () => {
      const categoryMap = new Map();

      filteredTransactions.value.forEach((tx) => {
        if (!tx.amount || isNaN(tx.amount)) return;

        const categoryId = tx.category_id;
        const categoryName = getCategoryName(categoryId);

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            income: 0,
            expenses: 0,
            transactionCount: 0,
          });
        }

        const category = categoryMap.get(categoryId);

        if (tx.transaction_type === "Einnahme") {
          category.income += Number(tx.amount);
        } else {
          category.expenses += Number(tx.amount);
        }
        category.transactionCount++;
      });

      return Array.from(categoryMap.values()).sort(
        (a, b) => Math.abs(b.income - b.expenses) - Math.abs(a.income - a.expenses)
      );
    };

    const getExchangeRates = async () => {
      try {
        const response = await axios.get(
          "https://v6.exchangerate-api.com/v6/1bfd15eb1d48a0a8759f2adf/latest/EUR"
        );
        exchangeRates.value = response.data.conversion_rates;
        if (!exchangeRates.value[currentCurrency.value]) {
          exchangeRates.value[currentCurrency.value] = 1;
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        exchangeRates.value = { EUR: 1 };
        if (currentCurrency.value !== "EUR") {
          exchangeRates.value[currentCurrency.value] = 1;
        }
        $q.notify({
          type: "negative",
          message: "Failed to update exchange rates. Using default rates.",
        });
      }
    };

    const fetchUserPreferences = async () => {
      loadingPreferences.value = true;
      try {
        const response = await axios.get(`http://localhost:3000/preferences/${userid}`);
        if (response.data && response.data.length > 0) {
          const prefsFromServer = response.data[0];
          userPreferences.value = {
            preferred_currency: prefsFromServer.preferred_currency || "EUR",
            saldo: parseFloat(prefsFromServer.saldo) || 1000.0,
          };
        }
        await getExchangeRates();
      } catch (err) {
        console.error("Error fetching user preferences:", err);
        userPreferences.value.preferred_currency = "EUR";
        await getExchangeRates();
      } finally {
        loadingPreferences.value = false;
      }
    };

    const fetchAllTransactions = async () => {
      loading.value = true;
      try {
        const response = await axios.get(
          `http://localhost:3000/transactions-with-categories/users/${userid}`
        );
        allTransactions.value = response.data;
        applyDateFilter(); // Apply current date range filter
      } catch (err) {
        console.error("Error fetching transactions:", err);
        error.value = "Failed to fetch data.";
        $q.notify({
          type: "negative",
          message: "Failed to load transaction data",
        });
      } finally {
        loading.value = false;
      }
    };

    const applyDateFilter = () => {
      if (!dateRange.value.from || !dateRange.value.to) return;

      filteredTransactions.value = allTransactions.value.filter((t) => {
        const transactionDate = new Date(t.date).toISOString().split("T")[0];
        return (
          transactionDate >= dateRange.value.from && transactionDate <= dateRange.value.to
        );
      });

      // Update categories based on filtered transactions
      const categoryMap = new Map();
      filteredTransactions.value.forEach((t) => {
        if (t.category_id && !categoryMap.has(t.category_id)) {
          categoryMap.set(t.category_id, {
            id: t.category_id,
            name: t.category_name,
            description: t.category_description,
          });
        }
      });
      categories.value = Array.from(categoryMap.values());
    };

    const currentCurrency = computed(() => {
      return userPreferences.value?.preferred_currency || "EUR";
    });

    const filteredData = computed(() => {
      const groupedData = {};
      filteredTransactions.value.forEach((t) => {
        const dateKey = new Date(t.date).toISOString().split("T")[0];
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = {
            date: dateKey,
            income: 0,
            expense: 0,
            currency: t.currency,
          };
        }

        const rate =
          exchangeRates.value[currentCurrency.value] /
          (exchangeRates.value[t.currency] || 1);
        if (t.transaction_type === "Einnahme") {
          groupedData[dateKey].income += t.amount * rate;
        } else {
          groupedData[dateKey].expense += t.amount * rate;
        }
      });

      return Object.values(groupedData).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    });

    const totalIncome = computed(() =>
      filteredData.value.reduce((sum, t) => sum + t.income, 0)
    );
    const totalExpense = computed(() =>
      filteredData.value.reduce((sum, t) => sum + t.expense, 0)
    );
    const totalBalance = computed(() => totalIncome.value - totalExpense.value);
    const convertedBudget = computed(() => {
      if (!exchangeRates.value[currentCurrency.value]) return userPreferences.value.saldo;
      return userPreferences.value.saldo * exchangeRates.value[currentCurrency.value];
    });
    const budgetUsagePercentage = computed(() => {
      if (convertedBudget.value <= 0) return 0;
      return Math.min(totalExpense.value / convertedBudget.value, 1);
    });

    const chartOptions = computed(() => {
      if (!userPreferences.value?.preferred_currency) return {};

      const currency = currentCurrency.value;
      const sortedData = [...filteredData.value].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      let cumulativeIncome = 0;
      let cumulativeExpense = 0;
      let runningBalance = 0;

      const incomeData = [];
      const expenseData = [];
      const balanceData = [];

      sortedData.forEach((t) => {
        const date = new Date(t.date).getTime();
        cumulativeIncome += t.income;
        cumulativeExpense += t.expense;
        runningBalance = cumulativeIncome - cumulativeExpense;

        incomeData.push([date, cumulativeIncome]);
        expenseData.push([date, cumulativeExpense]);
        balanceData.push([date, runningBalance]);
      });

      return {
        tooltip: {
          trigger: "axis",
          formatter: (params) => {
            const date = new Date(params[0].value[0]);
            let result = `${date.toLocaleDateString()}<br/>`;
            params.forEach((item) => {
              result += `${item.marker} ${item.seriesName}: ${item.value[1].toFixed(
                2
              )} ${currency}<br/>`;
            });
            return result;
          },
        },
        xAxis: {
          type: "time",
          axisLabel: {
            formatter: (value) => {
              const date = new Date(value);
              return `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
            },
          },
        },
        yAxis: {
          type: "value",
          name: `Amount (${currency})`,
        },
        series: [
          {
            name: "Cumulative Income",
            type: "line",
            data: incomeData,
            itemStyle: { color: "green" },
            lineStyle: { width: 2 },
            symbol: "circle",
            symbolSize: 6,
            smooth: false,
          },
          {
            name: "Cumulative Expense",
            type: "line",
            data: expenseData,
            itemStyle: { color: "red" },
            lineStyle: { width: 2 },
            symbol: "circle",
            symbolSize: 6,
            smooth: false,
          },
          {
            name: "Running Balance",
            type: "line",
            data: balanceData,
            itemStyle: { color: "blue" },
            lineStyle: { width: 3 },
            symbol: "circle",
            symbolSize: 8,
            smooth: false,
          },
        ],
        dataZoom: [{ type: "slider", start: 0, end: 100 }],
      };
    });

    watch(
      () => userPreferences.value?.preferred_currency,
      async (newCurrency) => {
        if (newCurrency) {
          chartLoading.value = true;
          try {
            await getExchangeRates();
            // No need to fetch transactions again, just use the existing ones
          } finally {
            chartLoading.value = false;
          }
        }
      }
    );

    watch(
      dateRange,
      (newRange) => {
        if (newRange.from && newRange.to) {
          applyDateFilter();
        }
      },
      { deep: true }
    );

    function updateChart() {
      applyDateFilter();
    }

    function resetToCurrentMonth() {
      initDateRange();
    }

    onMounted(async () => {
      try {
        initDateRange();
        await fetchUserPreferences();
        await fetchAllTransactions();

        if (route.query.saved) {
          $q.notify({
            type: "positive",
            message: "Preferences updated successfully!",
          });
        }
      } catch (error) {
        console.error("Initialization error:", error);
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
      userPreferences,
      exchangeRates,
      totalIncome,
      totalExpense,
      totalBalance,
      convertedBudget,
      budgetUsagePercentage,
      loadingPreferences,
      currentCurrency,
      isPreferencesLoaded,
      chartLoading,
      categories,
      transactions: filteredTransactions,
      exportPDF,
      exportCategoryPDF,
    };
  },
});
</script>

<template>
  <div v-if="isPreferencesLoaded" class="modern-dashboard">
    <!-- Header mit Glas-Effekt -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Financial Dashboard</h1>
        <p>Real-time insights into your financial health</p>
      </div>
      <div class="header-actions">
        <q-btn icon="refresh" round flat @click="fetchAllTransactions" />
        <q-btn icon="download" round flat @click="exportPDF" />
        <q-btn icon="pie_chart" round flat @click="exportCategoryPDF" />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-card income">
        <div class="stat-icon">
          <q-icon name="trending_up" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalIncome.toFixed(2) }} {{ currentCurrency }}</div>
          <div class="stat-label">Total Income</div>
        </div>
      </div>

      <div class="stat-card expense">
        <div class="stat-icon">
          <q-icon name="trending_down" />
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ totalExpense.toFixed(2) }} {{ currentCurrency }}
          </div>
          <div class="stat-label">Total Expenses</div>
        </div>
      </div>

      <div class="stat-card balance">
        <div class="stat-icon">
          <q-icon name="account_balance" />
        </div>
        <div class="stat-content">
          <div class="stat-value" :class="totalBalance >= 0 ? 'positive' : 'negative'">
            {{ totalBalance.toFixed(2) }} {{ currentCurrency }}
          </div>
          <div class="stat-label">Net Balance</div>
        </div>
      </div>

      <div class="stat-card budget">
        <div class="stat-content">
          <div class="budget-progress">
            <div class="progress-header">
              <div class="progress-label">Budget Usage</div>
              <div class="progress-value">
                {{ (budgetUsagePercentage * 100).toFixed(1) }}%
              </div>
            </div>
            <q-linear-progress
              :value="budgetUsagePercentage"
              :color="budgetUsagePercentage > 0.8 ? 'red' : 'primary'"
              size="20px"
              rounded
              class="budget-progress-bar"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Card -->
    <q-card class="controls-card">
      <q-card-section>
        <div class="row q-gutter-md items-center">
          <div class="col-auto">
            <q-input
              filled
              v-model="dateRange"
              label="Date Range"
              mask="date"
              class="date-input"
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
          </div>

          <q-select
            v-model="userPreferences.preferred_currency"
            :options="Object.keys(exchangeRates)"
            label="Currency"
            class="col-auto"
            :loading="loadingPreferences"
            @update:model-value="updateChart"
            filled
          />

          <q-btn
            label="Reset to Current Month"
            color="primary"
            class="col-auto"
            @click="resetToCurrentMonth"
            outline
          />

          <q-space />

          <q-btn-group class="col-auto">
            <q-btn
              label="Crypto"
              color="secondary"
              icon="trending_up"
              to="/crypto"
              outline
            />
            <q-btn
              label="Bank Import"
              color="deep-purple"
              icon="account_balance"
              to="/bank-import"
              outline
            />
          </q-btn-group>
        </div>
      </q-card-section>
    </q-card>

    <!-- Main Chart Area -->
    <div class="chart-container">
      <div class="chart-header">
        <h3>Financial Overview</h3>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color income"></div>
            <span>Cumulative Income</span>
          </div>
          <div class="legend-item">
            <div class="legend-color expense"></div>
            <span>Cumulative Expense</span>
          </div>
          <div class="legend-item">
            <div class="legend-color balance"></div>
            <span>Running Balance</span>
          </div>
        </div>
      </div>

      <div class="chart-wrapper">
        <v-chart
          class="main-chart"
          :option="chartOptions"
          autoresize
          :loading="chartLoading || loading"
        />
      </div>
    </div>

    <!-- Bottom Widgets -->
    <div class="widgets-grid">
      <CategoryPieChart
        :transactions="transactions"
        :categories="categories"
        :date-range="dateRange"
        :currency="userPreferences.preferred_currency"
        :exchange-rates="exchangeRates"
        class="widget"
      />
    </div>
  </div>
  <div v-else class="q-pa-md flex flex-center" style="height: 100vh">
    <q-spinner-gears size="xl" color="primary" />
    <div class="q-ml-md">Loading user preferences...</div>
  </div>
</template>

<style scoped>
.modern-dashboard {
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;

  .dashboard-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 30px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.3);

    .header-content {
      h1 {
        margin: 0;
        font-size: 2.5rem;
        background: linear-gradient(45deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      p {
        margin: 5px 0 0 0;
        color: #718096;
        font-size: 1.1rem;
      }
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-5px);
      }

      &.income {
        border-left: 4px solid #10b981;
      }

      &.expense {
        border-left: 4px solid #ef4444;
      }

      &.balance {
        border-left: 4px solid #3b82f6;
      }

      &.budget {
        border-left: 4px solid #8b5cf6;
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        .income & {
          background: #dcfce7;
          color: #10b981;
        }
        .expense & {
          background: #fee2e2;
          color: #ef4444;
        }
        .balance & {
          background: #dbeafe;
          color: #3b82f6;
        }
        .budget & {
          background: #f3e8ff;
          color: #8b5cf6;
        }

        .q-icon {
          font-size: 1.5rem;
        }
      }

      .stat-content {
        flex: 1;

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 5px;

          &.positive {
            color: #10b981;
          }
          &.negative {
            color: #ef4444;
          }
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 5px;
        }
      }
    }
  }

  .controls-card {
    border-radius: 16px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

    .date-input {
      min-width: 250px;
    }
  }

  .chart-container {
    background: white;
    border-radius: 20px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;

      h3 {
        margin: 0;
        font-size: 1.5rem;
        color: #1f2937;
      }

      .chart-legend {
        display: flex;
        gap: 20px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #6b7280;

          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;

            &.income {
              background: green;
            }
            &.expense {
              background: red;
            }
            &.balance {
              background: blue;
            }
          }
        }
      }
    }

    .chart-wrapper {
      height: 400px;

      .main-chart {
        width: 100%;
        height: 100%;
      }
    }
  }

  .widgets-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

/* Budget Progress spezifische Styles */
.budget-progress {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.progress-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.budget-progress-bar {
  width: 100%;
}

/* Dark Mode */
body.body--dark {
  .modern-dashboard {
    background: #111827;

    .dashboard-header {
      background: rgba(31, 41, 55, 0.8);
      border-color: rgba(255, 255, 255, 0.1);

      p {
        color: #d1d5db;
      }
    }

    .quick-stats .stat-card,
    .controls-card,
    .chart-container,
    .widgets-grid .widget {
      background: #1f2937;
      color: #f9fafb;

      .stat-label {
        color: #d1d5db;
      }
    }

    .progress-value {
      color: #f9fafb;
    }

    .progress-label {
      color: #d1d5db;
    }
  }
}

@media (max-width: 768px) {
  .modern-dashboard {
    .quick-stats {
      grid-template-columns: 1fr;
    }

    .chart-container .chart-header {
      flex-direction: column;
      gap: 15px;
      align-items: flex-start;
    }

    .progress-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }
  }
}
</style>
