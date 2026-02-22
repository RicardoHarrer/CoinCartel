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
import { toEnglishCategoryName, toEnglishTransactionType } from "@/utils/displayText";

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
    const allTransactions = ref([]);
    const filteredTransactions = ref([]);
    const loading = ref(false);
    const loadingPreferences = ref(true);
    const error = ref(null);
    const exchangeRates = ref({});
    const dateRange = ref({
      from: null,
      to: null,
    });
    const tipsDialog = ref(false);
    const tipsLoading = ref(false);
    const tipsError = ref("");
    const tipsItems = ref([]);

    const decodeMojibake = (value) => {
      let text = String(value ?? "");
      const fixes = [
        ["Ã¤", "ä"],
        ["Ã¶", "ö"],
        ["Ã¼", "ü"],
        ["ÃŸ", "ß"],
        ["Ã„", "Ä"],
        ["Ã–", "Ö"],
        ["Ãœ", "Ü"],
        ["â‚¬", "€"],
        ["â€“", "-"],
        ["â€”", "-"],
        ["â€œ", '"'],
        ["â€", '"'],
        ["â€ž", '"'],
        ["â†’", "->"],
        ["â‰¥", ">="],
        ["â‰ˆ", "≈"],
        ["Ã—", "x"],
        ["Ã˜", "Ø"],
      ];
      for (const [from, to] of fixes) {
        text = text.split(from).join(to);
      }
      return text;
    };

    const TIP_TRANSLATIONS = [
      [/Noch keine Daten/gi, "No data yet"],
      [/Im ausgewählten Zeitraum wurden keine Transaktionen gefunden\./gi, "No transactions were found in the selected date range."],
      [/Nächster Schritt:/gi, "Next step:"],
      [/Budget überschritten/gi, "Budget exceeded"],
      [/Budget-Pacing: nahe am Limit/gi, "Budget pacing: near the limit"],
      [/Budget-Pacing aktivieren/gi, "Enable budget pacing"],
      [/Cashflow ist negativ/gi, "Cashflow is negative"],
      [/Automatisiere Sparen/gi, "Automate savings"],
      [/Notgroschen als nächster Step/gi, "Emergency fund as the next step"],
      [/Größter steuerbarer Hebel/gi, "Largest controllable lever"],
      [/Mikro-Leak erkannt/gi, "Micro leak detected"],
      [/Wochenenden treiben die Ausgaben/gi, "Weekends drive spending"],
      [/Händler-Fokus/gi, "Merchant focus"],
      [/Ausgaben-Spike/gi, "Spending spike"],
      [/Transport-Kostenhebel/gi, "Transport cost lever"],
      [/Trend: steuerbare Ausgaben gestiegen/gi, "Trend: controllable spending increased"],
      [/Trend: du bist besser geworden/gi, "Trend: you improved"],
      [/Ziel\(e\) überfällig/gi, "Goal(s) overdue"],
      [/Ziel-Fortschritt niedrig/gi, "Goal progress is low"],
      [/Schneller Hebel: 24h-Regel/gi, "Quick win: 24-hour rule"],
      [/Monatlicher Fixposten/gi, "Monthly recurring expense"],
      [/Wöchentlicher Fixposten/gi, "Weekly recurring expense"],
      [/Regelmäßiger Fixposten/gi, "Recurring expense"],
      [/Du bist bei/gi, "You are at"],
      [/Fokus: steuerbare Posten deckeln\./gi, "Focus: cap controllable spending."],
      [/Für den Rest: Tageslimit setzen \+ keine Spontankäufe\./gi, "For the rest of the month: set a daily limit and avoid impulse purchases."],
      [/Ab jetzt nur geplante Ausgaben, keine „weil gerade Bock“\./gi, "From now on, only planned spending and no impulse buys."],
      [/Orientierung: 3 Monats-Fixkosten ≈/gi, "Reference point: 3 months of fixed costs ≈"],
      [/Danach Investieren priorisieren\./gi, "Then prioritize investing."],
      [/Ausgaben ≤/gi, "expenses <="],
      [/summieren sich auf/gi, "add up to"],
      [/Tipp: Kleinzeug-Limit oder Cash-Envelope\./gi, "Tip: set a small-purchases limit or use a cash envelope."],
      [/Am Wochenende entstehen/gi, "On weekends, "],
      [/deiner steuerbaren Ausgaben/gi, "of your controllable expenses"],
      [/Wochenend-Budget setzen\./gi, "set a weekend budget."],
      [/Smart-Cap fürs nächste Monat:/gi, "Smart cap for next month:"],
      [/Rücklage-Idee:/gi, "Reserve idea:"],
      [/für 6 Monate\./gi, "for 6 months."],
      [/Ticket\/Monatskarte prüfen \+ klare Taxi-Regel\./gi, "Check ticket/monthly pass options and define a clear taxi rule."],
      [/Aktion: kündigen\/downgraden oder Zielwert/gi, "Action: cancel/downgrade or set a target of"],
      [/Vormonat:/gi, "Previous month:"],
      [/jetzt:/gi, "now:"],
      [/Fokus: Abos\/Recurring \+ Wochenenden \+ Mikro-Leaks\./gi, "Focus: subscriptions/recurring costs + weekends + micro leaks."],
      [/Steuerbare Ausgaben sind um/gi, "Controllable expenses are down by"],
      [/gesunken/gi, "decreased"],
      [/Fixbetrag\/Monat \+ automatisieren\./gi, "Set a fixed monthly amount + automate it."],
      [/Bei nicht notwendigen Ausgaben >50€: 24h warten\. Reduziert Impulskäufe extrem\./gi, "For non-essential purchases over €50: wait 24h. This strongly reduces impulse spending."],
      [/Sofort spürbar/gi, "Immediately noticeable"],
      [/Sehr wichtig/gi, "Very important"],
      [/Routine & Stabilität/gi, "Routine & stability"],
      [/Langfristig/gi, "Long-term"],
      [/Spikes planbar machen/gi, "Make spending spikes predictable"],
      [/variabel/gi, "variable"],
      [/Sehr gut/gi, "Very good"],
      [/Zielerreichung/gi, "Goal achievement"],
      [/Impuls reduzieren/gi, "Reduce impulse spending"],
      [/möglich/gi, "possible"],
    ];

    const toEnglishTipText = (value) => {
      let text = decodeMojibake(value);
      for (const [pattern, replacement] of TIP_TRANSLATIONS) {
        text = text.replace(pattern, replacement);
      }
      return text;
    };

    const localizedTipsItems = computed(() => {
      return (tipsItems.value || []).map((tip) => ({
        ...tip,
        title: toEnglishTipText(tip?.title || ""),
        message: toEnglishTipText(tip?.message || tip?.text || ""),
        text: toEnglishTipText(tip?.text || ""),
        reason: toEnglishTipText(tip?.reason || ""),
        action: toEnglishTipText(tip?.action || ""),
        impact: toEnglishTipText(tip?.impact || ""),
        priority:
          tip?.priority === "hoch"
            ? "high"
            : tip?.priority === "mittel"
              ? "medium"
              : tip?.priority || "info",
      }));
    });

    const isIncomeType = (type) => {
      const normalized = String(type || "").trim().toLowerCase();
      return normalized === "einnahme" || normalized === "income";
    };

    function formatDateForModel(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function formatDateDMY(value) {
      if (!value) return "";

      if (typeof value === "string") {
        const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoDateMatch) {
          const [, year, month, day] = isoDateMatch;
          return `${day}.${month}.${year}`;
        }
      }

      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }

    function formatAmount(value, decimals = 2) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return Number(0).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }

      return numeric.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    const dateRangeString = computed(() => {
      if (dateRange.value.from && dateRange.value.to) {
        return `${formatDateDMY(dateRange.value.from)} - ${formatDateDMY(
          dateRange.value.to
        )}`;
      }
      return "";
    });

    function initDateRange() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      dateRange.value = {
        from: formatDateForModel(firstDay),
        to: formatDateForModel(lastDay),
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

    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);
    };

    const openTipsDialog = async () => {
      tipsDialog.value = true;
      tipsLoading.value = true;
      tipsError.value = "";
      try {
        const response = await axios.get(`http://localhost:3000/api/tips/${userid}`, {
          params: {
            startDate: dateRange.value?.from || undefined,
            endDate: dateRange.value?.to || undefined,
          },
        });
        tipsItems.value = Array.isArray(response.data?.tips) ? response.data.tips : [];
      } catch (err) {
        console.error("Error fetching tips:", err);
        tipsError.value = "Could not load tips.";
        tipsItems.value = [];
      } finally {
        tipsLoading.value = false;
      }
    };

    const exportPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text("Financial Report - Transaction Overview", 105, 20, { align: "center" });

        doc.setFontSize(10);
        doc.text(
          `Date Range: ${formatDateDMY(dateRange.value.from)} to ${formatDateDMY(
            dateRange.value.to
          )}`,
          20,
          35
        );
        doc.text(`Currency: ${currentCurrency.value}`, 20, 42);
        doc.text(`Generated: ${formatDateDMY(new Date())}`, 20, 49);

        const tableData = filteredTransactions.value.map((t) => [
          formatDateDMY(t.date),
          t.description || "No description",
          getCategoryName(t.category_id),
	          toEnglishTransactionType(t.transaction_type),
	          `${isIncomeType(t.transaction_type) ? "+" : "-"}${t.amount} ${
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

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text("Summary", 20, finalY);
        doc.setFontSize(10);
        doc.text(
          `Total Income: ${formatAmount(totalIncome.value)} ${currentCurrency.value}`,
          20,
          finalY + 8
        );
        doc.text(
          `Total Expenses: ${formatAmount(totalExpense.value)} ${currentCurrency.value}`,
          20,
          finalY + 16
        );
        doc.text(
          `Net Balance: ${formatAmount(totalBalance.value)} ${currentCurrency.value}`,
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

        doc.setFontSize(10);
        doc.text(
          `Date Range: ${formatDateDMY(dateRange.value.from)} to ${formatDateDMY(
            dateRange.value.to
          )}`,
          20,
          35
        );
        doc.text(`Currency: ${currentCurrency.value}`, 20, 42);
        doc.text(`Generated: ${formatDateDMY(new Date())}`, 20, 49);

        const categoryData = computeCategorySummary();
        const tableData = categoryData.map((cat) => [
          cat.name,
          formatAmount(cat.income),
          formatAmount(cat.expenses),
          formatAmount(cat.income - cat.expenses),
          cat.transactionCount,
        ]);

        autoTable(doc, {
          head: [["Category", "Income", "Expenses", "Balance", "Transactions"]],
          body: tableData,
          startY: 60,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 133, 244] },
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text("Category Overview", 20, finalY);
        doc.setFontSize(10);
        const totalCategoryIncome = categoryData.reduce((sum, cat) => sum + cat.income, 0);
        const totalCategoryExpenses = categoryData.reduce((sum, cat) => sum + cat.expenses, 0);
        const totalCategoryBalance = categoryData.reduce(
          (sum, cat) => sum + (cat.income - cat.expenses),
          0
        );

        doc.text(
          `Total Income: ${formatAmount(totalCategoryIncome)} ${currentCurrency.value}`,
          20,
          finalY + 8
        );
        doc.text(
          `Total Expenses: ${formatAmount(totalCategoryExpenses)} ${currentCurrency.value}`,
          20,
          finalY + 16
        );
        doc.text(
          `Net Balance: ${formatAmount(totalCategoryBalance)} ${currentCurrency.value}`,
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

	    const getCategoryName = (categoryId) => {
	      const category = categories.value.find((c) => c.id === categoryId);
	      return category ? toEnglishCategoryName(category.name) : "Uncategorized";
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

	        if (isIncomeType(tx.transaction_type)) {
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
          `http://localhost:3000/transactions-with-categories/users/${userid}`,
          {
            params: {
              startDate: dateRange.value?.from || undefined,
              endDate: dateRange.value?.to || undefined,
            },
          }
        );
        allTransactions.value = response.data;
        applyDateFilter();
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
      filteredTransactions.value = Array.isArray(allTransactions.value)
        ? allTransactions.value
        : [];

      const categoryMap = new Map();
      filteredTransactions.value.forEach((t) => {
        if (t.category_id && !categoryMap.has(t.category_id)) {
	          categoryMap.set(t.category_id, {
	            id: t.category_id,
	            name: toEnglishCategoryName(t.category_name),
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
	        if (isIncomeType(t.transaction_type)) {
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

      const isDark = $q.dark.isActive;
      const textColor = isDark ? "#ffffff" : "#374151";
      const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
      const backgroundColor = isDark ? "#121212" : "#ffffff";

      return {
        backgroundColor: backgroundColor,
        tooltip: {
          trigger: "axis",
          backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
          borderColor: isDark ? "#333333" : "#e2e8f0",
          textStyle: {
            color: textColor,
          },
          formatter: (params) => {
            const date = new Date(params[0].value[0]);
            let result = `<div style="color: ${textColor}">${formatDateDMY(date)}<br/>`;
            params.forEach((item) => {
              result += `${item.marker} ${item.seriesName}: ${formatAmount(
                item.value[1]
              )} ${currency}<br/>`;
            });
            result += "</div>";
            return result;
          },
        },
        xAxis: {
          type: "time",
          axisLabel: {
            color: textColor,
            formatter: (value) => {
              return formatDateDMY(value);
            },
          },
          axisLine: {
            lineStyle: {
              color: gridColor,
            },
          },
          splitLine: {
            lineStyle: {
              color: gridColor,
              type: "dashed",
            },
          },
        },
        yAxis: {
          type: "value",
          name: `Amount (${currency})`,
          nameTextStyle: {
            color: textColor,
          },
          axisLabel: {
            color: textColor,
            formatter: (value) => `${formatAmount(value)} ${currency}`,
          },
          axisLine: {
            lineStyle: {
              color: gridColor,
            },
          },
          splitLine: {
            lineStyle: {
              color: gridColor,
              type: "dashed",
            },
          },
        },
        series: [
          {
            name: "Cumulative Income",
            type: "line",
            data: incomeData,
            itemStyle: { color: "#10b981" },
            lineStyle: { width: 3 },
            symbol: "circle",
            symbolSize: 6,
            smooth: false,
          },
          {
            name: "Cumulative Expense",
            type: "line",
            data: expenseData,
            itemStyle: { color: "#ef4444" },
            lineStyle: { width: 3 },
            symbol: "circle",
            symbolSize: 6,
            smooth: false,
          },
          {
            name: "Running Balance",
            type: "line",
            data: balanceData,
            itemStyle: { color: "#3b82f6" },
            lineStyle: { width: 4 },
            symbol: "circle",
            symbolSize: 8,
            smooth: false,
          },
        ],
        dataZoom: [
          {
            type: "slider",
            start: 0,
            end: 100,
            backgroundColor: backgroundColor,
            dataBackground: {
              lineStyle: {
                color: gridColor,
              },
              areaStyle: {
                color: gridColor,
              },
            },
            borderColor: gridColor,
            textStyle: {
              color: textColor,
            },
          },
        ],
        legend: {
          textStyle: {
            color: textColor,
          },
        },
      };
    });

    watch(
      () => userPreferences.value?.preferred_currency,
      async (newCurrency) => {
        if (newCurrency) {
          chartLoading.value = true;
          try {
            await getExchangeRates();
          } finally {
            chartLoading.value = false;
          }
        }
      }
    );

    watch(
      dateRange,
      async (newRange) => {
        if (newRange.from && newRange.to) {
          await fetchAllTransactions();
        }
      },
      { deep: true }
    );

    function updateChart() {
      applyDateFilter();
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
      dateRangeString, // Computed property for date range display
      chartOptions,
      updateChart,
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
      formatAmount,
      exportPDF,
      exportCategoryPDF,
      toggleDarkMode,
      openTipsDialog,
      tipsDialog,
      tipsLoading,
      tipsError,
      tipsItems,
      localizedTipsItems,
    };
  },
});
</script>

<template>
  <div v-if="isPreferencesLoaded" class="modern-dashboard">
    <div class="dark-mode-toggle">
      <q-btn
        round
        :color="$q.dark.isActive ? 'grey-9' : 'yellow'"
        :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
        class="toggle-btn"
        @click="toggleDarkMode"
        size="lg"
      >
      </q-btn>
    </div>

    <div class="dashboard-header">
      <div class="header-content">
        <h1>Financial Dashboard</h1>
        <p>Real-time insights into your financial health</p>
      </div>
      <div class="header-actions">
        <q-btn icon="refresh" round flat @click="fetchAllTransactions">
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>
        <q-btn icon="download" round flat @click="exportPDF">
          <q-tooltip>PDF</q-tooltip>
        </q-btn>
        <q-btn icon="pie_chart" round flat @click="exportCategoryPDF">
          <q-tooltip>Categorie PDF</q-tooltip>
        </q-btn>
        <q-btn icon="tips_and_updates" round flat @click="openTipsDialog">
          <q-tooltip>Tips</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-dialog v-model="tipsDialog">
      <q-card class="tips-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Financial Tips</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div v-if="tipsLoading" class="text-center q-py-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else-if="tipsError" class="text-negative">{{ tipsError }}</div>
          <q-list v-else separator>
            <q-item v-for="(tip, idx) in localizedTipsItems" :key="`tip-${idx}`">
              <q-item-section avatar>
                <q-icon :name="tip.icon || 'tips_and_updates'" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ tip.title || "Tip" }}
                </q-item-label>
                <q-item-label caption>
                  {{ tip.message || tip.text || "" }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <div v-if="!localizedTipsItems.length" class="text-grey-6">No tips available.</div>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <div class="quick-stats">
      <div class="stat-card income">
        <div class="stat-icon">
          <q-icon name="trending_up" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(totalIncome) }} {{ currentCurrency }}</div>
          <div class="stat-label">Total Income</div>
        </div>
      </div>

      <div class="stat-card expense">
        <div class="stat-icon">
          <q-icon name="trending_down" />
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatAmount(totalExpense) }} {{ currentCurrency }}
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
            {{ formatAmount(totalBalance) }} {{ currentCurrency }}
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

    <q-card class="controls-card">
      <q-card-section>
        <div class="row q-gutter-md items-center controls-row">
          <div class="col-auto">
            <q-input
              filled
              v-model="dateRangeString"
              label="Date Range"
              readonly
              class="date-input"
              :dark="$q.dark.isActive"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="dateRange"
                      range
                      mask="YYYY-MM-DD"
                      @update:model-value="updateChart"
                      :dark="$q.dark.isActive"
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
            class="col-auto currency-select"
            :loading="loadingPreferences"
            @update:model-value="updateChart"
            filled
            :dark="$q.dark.isActive"
          />

          <q-space />

          <div class="col-auto nav-action-group">
            <q-btn
              class="pill-nav-btn"
              label="Market"
              color="secondary"
              icon="trending_up"
              to="/market"
              outline
            />
            <q-btn
              class="pill-nav-btn"
              label="Settings"
              color="deep-purple"
              icon="settings"
              to="/settings"
              outline
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

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
  transition: all 0.3s ease;
  position: relative;
}

.dark-mode-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;

  .toggle-btn {
    width: 60px;
    height: 60px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
    }

    &:active {
      transform: scale(0.95);
    }

    :deep(.q-icon) {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  }
}

.modern-dashboard {
  .dashboard-header {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.8) 100%
    );
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 30px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    .header-content {
      h1 {
        margin: 0;
        font-size: 2.5rem;
        background: linear-gradient(45deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-weight: 700;
      }

      p {
        margin: 5px 0 0 0;
        color: #64748b;
        font-size: 1.1rem;
        font-weight: 500;
      }
    }

    .header-actions {
      display: flex;
      gap: 10px;

      .q-btn {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.9);
        border-radius: 9999px;

        &:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(129, 140, 248, 1);
          transform: translateY(-2px);
        }
      }
    }
  }

  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .stat-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 16px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
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
        backdrop-filter: blur(10px);

        .income & {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #10b981;
        }
        .expense & {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #ef4444;
        }
        .balance & {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          color: #3b82f6;
        }
        .budget & {
          background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
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
          color: #1e293b;

          &.positive {
            color: #10b981;
          }
          &.negative {
            color: #ef4444;
          }
        }

        .stat-label {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 5px;
        }
      }
    }
  }

  .controls-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);

    .controls-row {
      width: 100%;
    }

    .date-input {
      min-width: 250px;
      max-width: 100%;
    }

    .currency-select {
      min-width: 120px;
    }

    .nav-action-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .pill-nav-btn {
      border-radius: 9999px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    }
  }

  .chart-container {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 20px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;

      h3 {
        margin: 0;
        font-size: 1.5rem;
        color: #1e293b;
        font-weight: 600;
      }

      .chart-legend {
        display: flex;
        gap: 20px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;

          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;

            &.income {
              background: #10b981;
            }
            &.expense {
              background: #ef4444;
            }
            &.balance {
              background: #3b82f6;
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
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.progress-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.budget-progress-bar {
  width: 100%;
}

body.body--dark .modern-dashboard {
  background: #121212 !important;
}

body.body--dark .modern-dashboard .dashboard-header {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(18, 18, 18, 0.8) 100%
  ) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .modern-dashboard .dashboard-header .header-content h1 {
  background: linear-gradient(45deg, #8baafe, #a67fce) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}

body.body--dark .modern-dashboard .dashboard-header .header-content p {
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .dashboard-header .header-actions .q-btn {
  background: rgba(30, 30, 30, 0.7) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .dashboard-header .header-actions .q-btn:hover {
  background: rgba(30, 30, 30, 0.9) !important;
}

.tips-dialog-card {
  min-width: min(560px, 94vw);
  border-radius: 14px;
}

body.body--dark .tips-dialog-card {
  background: #111111 !important;
  color: #ffffff !important;
}

body.body--dark .tips-dialog-card :deep(.q-item__label--caption) {
  color: #cbd5e1 !important;
}

body.body--dark .modern-dashboard .quick-stats .stat-card {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .modern-dashboard .quick-stats .stat-card .stat-content .stat-value {
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .quick-stats .stat-card .stat-content .stat-label {
  color: #b0b0b0 !important;
}

body.body--dark .modern-dashboard .quick-stats .stat-card .stat-icon {
  background: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .modern-dashboard .quick-stats .stat-card .stat-icon .q-icon {
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .controls-card {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .controls-card :deep(.q-field__label) {
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .controls-card :deep(.q-field__native) {
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .controls-card :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.05) !important;
}

body.body--dark .modern-dashboard .controls-card :deep(.q-field__control:before) {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark .modern-dashboard .chart-container {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .modern-dashboard .chart-container .chart-header h3 {
  color: #ffffff !important;
}

body.body--dark
  .modern-dashboard
  .chart-container
  .chart-header
  .chart-legend
  .legend-item {
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .widgets-grid .widget {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .progress-value {
  color: #ffffff !important;
}

body.body--dark .modern-dashboard .progress-label {
  color: #b0b0b0 !important;
}

.modern-dashboard .controls-card .pill-nav-btn {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

body.body--dark :deep(.q-field--filled) .q-field__control {
  background: rgba(255, 255, 255, 0.05) !important;
}

body.body--dark :deep(.q-field--filled) .q-field__label {
  color: #ffffff !important;
}

body.body--dark :deep(.q-field--filled) .q-field__native {
  color: #ffffff !important;
}

body.body--dark :deep(.q-field--filled) .q-field__control:before {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark :deep(.q-btn) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-btn--outline) {
  border-color: rgba(255, 255, 255, 0.3) !important;
}

@media (max-width: 768px) {
  .modern-dashboard {
    padding: 15px;

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

    .dashboard-header {
      flex-direction: column;
      gap: 20px;
      text-align: center;

      .header-content h1 {
        font-size: 2rem;
      }
    }

    .controls-card {
      .controls-row {
        gap: 10px !important;
      }

      .controls-row > .col-auto,
      .controls-row > .currency-select {
        width: 100%;
      }

      .controls-row .q-space {
        display: none;
      }

      .date-input,
      .currency-select,
      .nav-action-group {
        width: 100%;
        min-width: 0 !important;
      }
    }

    .chart-container {
      padding: 18px;
    }

    .chart-container .chart-header .chart-legend {
      gap: 10px;
      flex-wrap: wrap;
    }

    .dark-mode-toggle {
      bottom: 16px;
      right: 16px;

      .toggle-btn {
        width: 50px;
        height: 50px;
      }
    }
  }
}

.q-btn,
.stat-card,
.controls-card,
.chart-container {
  transition: all 0.3s ease;
}

body.body--dark ::-webkit-scrollbar {
  width: 8px;
}

body.body--dark ::-webkit-scrollbar-track {
  background: #1e1e1e;
}

body.body--dark ::-webkit-scrollbar-thumb {
  background: #444444;
  border-radius: 4px;
}

body.body--dark ::-webkit-scrollbar-thumb:hover {
  background: #666666;
}
</style>
