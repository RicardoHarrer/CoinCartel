<script>
import { defineComponent, ref, computed, watch } from "vue";
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import { useQuasar } from "quasar";

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent]);

export default defineComponent({
  components: { VChart },
  props: {
    transactions: {
      type: Array,
      required: true,
      default: () => [],
    },
    categories: {
      type: Array,
      required: true,
      default: () => [],
    },
    dateRange: {
      type: Object,
      default: null,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    exchangeRates: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const $q = useQuasar();
    const loading = ref(false);
    const chartRef = ref(null);
    const hoveredCategory = ref(null);
    const categoryDialogOpen = ref(false);
    const selectedCategoryName = ref("");

    const formatAmount = (value, decimals = 2) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return Number(0).toLocaleString("de-DE", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }

      return numeric.toLocaleString("de-DE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    const formatDateDMY = (value) => {
      if (!value) return "";

      if (typeof value === "string") {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          return `${match[3]}.${match[2]}.${match[1]}`;
        }
      }

      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return `${String(date.getDate()).padStart(2, "0")}.${String(
        date.getMonth() + 1
      ).padStart(2, "0")}.${date.getFullYear()}`;
    };

    const formattedDateRange = computed(() => {
      const from = formatDateDMY(props.dateRange?.from);
      const to = formatDateDMY(props.dateRange?.to);
      if (!from || !to) return "";
      return `${from} - ${to}`;
    });

    const getCategoryName = (categoryId) => {
      const category = props.categories.find((c) => c.id === categoryId);
      return category ? category.name : "Uncategorized";
    };

    const categoryData = computed(() => {
      const expenseData = {};

      props.transactions.forEach((t) => {
        if (t.transaction_type !== "Ausgabe") return;

        const categoryName = getCategoryName(t.category_id);
        const rate =
          props.exchangeRates[props.currency] / (props.exchangeRates[t.currency] || 1);
        const amount = t.amount * rate;

        if (!expenseData[categoryName]) {
          expenseData[categoryName] = 0;
        }
        expenseData[categoryName] += amount;
      });

      return expenseData;
    });

    const hasData = computed(() => {
      return Object.keys(categoryData.value).length > 0;
    });

    const categoryBreakdown = computed(() => {
      const data = categoryData.value;
      const total = Object.values(data).reduce((sum, val) => sum + val, 0);

      return Object.entries(data)
        .map(([name, value]) => ({
          name,
          value: parseFloat(value.toFixed(2)),
          percentage: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.value - a.value);
    });

    const pieChartOptions = computed(() => {
      if (!hasData.value) return {};

      const isDark = $q.dark.isActive;
      const textColor = isDark ? "#f8fafc" : "#2d3748";
      const tooltipBgColor = isDark
        ? "rgba(30, 30, 30, 0.96)"
        : "rgba(255, 255, 255, 0.95)";
      const tooltipBorderColor = isDark
        ? "rgba(255, 255, 255, 0.18)"
        : "rgba(0, 0, 0, 0.1)";
      const tooltipTextColor = isDark ? "#f8fafc" : "#2d3748";
      const legendTextColor = isDark ? "#cbd5e1" : "#6b7280";
      const labelColor = isDark ? "#f8fafc" : "#2d3748";

      return {
        backgroundColor: "transparent",
        textStyle: {
          color: textColor,
        },
        tooltip: {
          trigger: "item",
          formatter: ({ data }) => {
            return `
          <div class="custom-tooltip" style="color: ${tooltipTextColor}">
            <strong>${data.name}</strong><br/>
            ${formatAmount(data.value)} ${props.currency}<br/>
            <small>${data.percentage}% of total</small>
          </div>
        `;
          },
          backgroundColor: tooltipBgColor,
          borderColor: tooltipBorderColor,
          textStyle: {
            color: tooltipTextColor,
          },
          extraCssText:
            "box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 8px; padding: 12px;",
        },
        legend: {
          orient: "vertical",
          right: 20,
          top: "center",
          textStyle: {
            color: legendTextColor,
            fontSize: 12,
          },
          itemGap: 15,
          formatter: (name) => {
            const item = categoryBreakdown.value.find((cat) => cat.name === name);
            return item ? `${name} (${item.percentage}%)` : name;
          },
        },
        series: [
          {
            name: "Expenses by Category",
            type: "pie",
            radius: ["45%", "75%"],
            center: ["35%", "50%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: isDark ? "#1e1e1e" : "#fff",
              borderWidth: 3,
              shadowColor: isDark ? "rgba(0, 0, 0, 0.32)" : "rgba(0, 0, 0, 0.1)",
              shadowBlur: 8,
              shadowOffsetX: 2,
              shadowOffsetY: 2,
            },
            animationDurationUpdate: 350,
            label: {
              show: false,
              position: "center",
              formatter: ({ name, value, percent }) =>
                `${name}\n${formatAmount(value)} ${props.currency}\n(${percent}%)`,
              fontSize: 14,
              fontWeight: "bold",
              color: labelColor,
            },
            emphasis: {
              scale: true,
              scaleSize: 8,
              label: {
                show: true,
                fontSize: 16,
                fontWeight: "bold",
                formatter: ({ name, value }) => `${name}\n${formatAmount(value)} ${props.currency}`,
                color: labelColor,
              },
              itemStyle: {
                shadowColor: isDark ? "rgba(0, 0, 0, 0.45)" : "rgba(0, 0, 0, 0.3)",
                shadowBlur: 12,
                shadowOffsetX: 4,
                shadowOffsetY: 4,
              },
            },
            labelLine: {
              show: false,
            },
            data: categoryBreakdown.value.map((item) => ({
              name: item.name,
              value: item.value,
              percentage: item.percentage,
              itemStyle: {
                color: getCategoryColor(item.name),
                borderColor: isDark ? "#1e1e1e" : "#ffffff",
              },
              emphasis: {
                itemStyle: {
                  borderWidth: 4,
                  shadowColor: isDark ? "rgba(0, 0, 0, 0.45)" : "rgba(0, 0, 0, 0.3)",
                },
              },
            })),
          },
        ],
      };
    });

    const getCategoryColor = (categoryName) => {
      const colors = [
        "#667eea",
        "#764ba2",
        "#f093fb",
        "#f5576c",
        "#4facfe",
        "#00f2fe",
        "#43e97b",
        "#38f9d7",
        "#fa709a",
        "#fee140",
        "#a8edea",
        "#fed6e3",
        "#ff9a9e",
        "#fecfef",
        "#f6d365",
        "#fda085",
      ];
      const index = Math.abs(hashCode(categoryName)) % colors.length;
      return colors[index];
    };

    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    };

    watch(
      () => props.transactions,
      () => {
        if (props.transactions.length > 0) {
          loading.value = true;
          setTimeout(() => {
            loading.value = false;
          }, 300);
        }
      },
      { deep: true }
    );

    const getCategoryIndex = (categoryName) =>
      categoryBreakdown.value.findIndex((item) => item.name === categoryName);

    const getChartInstance = () => chartRef.value?.chart || chartRef.value || null;

    const onCategoryHover = (categoryName) => {
      const dataIndex = getCategoryIndex(categoryName);
      const chart = getChartInstance();
      if (dataIndex < 0 || !chart?.dispatchAction) return;

      hoveredCategory.value = categoryName;
      chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
      chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex });
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex });
    };

    const onCategoryLeave = () => {
      hoveredCategory.value = null;
      const chart = getChartInstance();
      if (!chart?.dispatchAction) return;
      chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
      chart.dispatchAction({ type: "hideTip" });
    };

    const convertTransactionAmount = (transaction) => {
      const sourceCurrency = transaction?.currency || props.currency;
      const sourceRate = Number(props.exchangeRates[sourceCurrency] || 1);
      const targetRate = Number(props.exchangeRates[props.currency] || 1);
      const numericAmount = Number(transaction?.amount);

      if (!Number.isFinite(numericAmount)) return 0;
      if (!Number.isFinite(sourceRate) || sourceRate <= 0) return numericAmount;
      if (!Number.isFinite(targetRate) || targetRate <= 0) return numericAmount;

      return numericAmount * (targetRate / sourceRate);
    };

    const selectedCategoryTransactions = computed(() => {
      if (!selectedCategoryName.value) return [];

      return props.transactions
        .filter(
          (transaction) => getCategoryName(transaction?.category_id) === selectedCategoryName.value
        )
        .slice()
        .sort(
          (a, b) =>
            (new Date(b?.date).getTime() || 0) - (new Date(a?.date).getTime() || 0)
        );
    });

    const getSignedTransactionAmount = (transaction, convertedAmount) => {
      const normalizedAmount = Math.abs(Number(convertedAmount) || 0);
      if (transaction?.transaction_type === "Ausgabe") return -normalizedAmount;
      if (transaction?.transaction_type === "Einnahme") return normalizedAmount;
      return Number(convertedAmount) || 0;
    };

    const selectedCategoryTotal = computed(() =>
      selectedCategoryTransactions.value.reduce(
        (sum, transaction) =>
          sum + getSignedTransactionAmount(transaction, convertTransactionAmount(transaction)),
        0
      )
    );

    const formatTransactionAmount = (transaction) => {
      const convertedAmount = convertTransactionAmount(transaction);
      const signedConvertedAmount = getSignedTransactionAmount(transaction, convertedAmount);
      const sourceCurrency = transaction?.currency || props.currency;
      const sourceAmount = Number(transaction?.amount);
      const transactionSign = signedConvertedAmount < 0 ? "-" : "+";
      const convertedDisplay = `${transactionSign}${formatAmount(Math.abs(signedConvertedAmount))} ${props.currency}`;

      if (sourceCurrency !== props.currency && Number.isFinite(sourceAmount)) {
        return `${convertedDisplay} (${transactionSign}${formatAmount(
          Math.abs(sourceAmount)
        )} ${sourceCurrency})`;
      }

      return convertedDisplay;
    };

    const openCategoryTransactions = (categoryName) => {
      if (!categoryName) return;
      selectedCategoryName.value = categoryName;
      categoryDialogOpen.value = true;
    };

    const onCategoryDialogHide = () => {
      selectedCategoryName.value = "";
      onCategoryLeave();
    };

    return {
      loading,
      hasData,
      categoryBreakdown,
      pieChartOptions,
      formattedDateRange,
      formatAmount,
      formatDateDMY,
      getCategoryColor,
      chartRef,
      hoveredCategory,
      onCategoryHover,
      onCategoryLeave,
      categoryDialogOpen,
      selectedCategoryName,
      selectedCategoryTransactions,
      selectedCategoryTotal,
      formatTransactionAmount,
      openCategoryTransactions,
      onCategoryDialogHide,
    };
  },
});
</script>

<template>
  <q-card class="category-pie-chart">
    <q-card-section class="chart-header">
      <div class="header-content">
        <q-icon name="pie_chart" size="24px" class="header-icon" />
        <div>
          <h3>Expense Distribution</h3>
          <p v-if="formattedDateRange" class="date-range">
            {{ formattedDateRange }}
          </p>
        </div>
      </div>
      <div class="total-expenses">
        <div class="total-label">Total Expenses</div>
        <div class="total-amount">
          {{ formatAmount(categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0)) }}
          {{ currency }}
        </div>
      </div>
    </q-card-section>

    <q-card-section class="chart-content">
      <div v-if="hasData" class="chart-container">
        <div class="chart-wrapper">
          <v-chart
            ref="chartRef"
            class="chart"
            :option="pieChartOptions"
            autoresize
            :loading="loading"
          />
        </div>

        <div class="category-details">
          <div class="details-header">
            <h4>Category Breakdown</h4>
            <div class="summary-stats">
              <div class="stat">
                <span class="stat-label">Categories</span>
                <span class="stat-value">{{ categoryBreakdown.length }}</span>
              </div>
            </div>
          </div>

          <div class="categories-list">
            <div
              v-for="item in categoryBreakdown"
              :key="item.name"
              class="category-item"
              :class="{
                'category-item--active':
                  hoveredCategory === item.name || selectedCategoryName === item.name,
              }"
              :style="{ '--category-color': getCategoryColor(item.name) }"
              @mouseenter="onCategoryHover(item.name)"
              @mouseleave="onCategoryLeave"
              @click="openCategoryTransactions(item.name)"
              @keyup.enter="openCategoryTransactions(item.name)"
              tabindex="0"
              role="button"
            >
              <div class="category-info">
                <div class="category-color-indicator"></div>
                <div class="category-text">
                  <div class="category-name">{{ item.name }}</div>
                  <div class="category-percentage">{{ item.percentage }}%</div>
                </div>
              </div>
              <div class="category-amount">{{ formatAmount(item.value) }} {{ currency }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <q-icon name="pie_chart" size="64px" color="grey-4" />
        </div>
        <div class="empty-text">
          <h4>No Expense Data</h4>
          <p>No expense transactions found for the selected period</p>
        </div>
      </div>
    </q-card-section>

    <q-dialog v-model="categoryDialogOpen" @hide="onCategoryDialogHide">
      <q-card class="transactions-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedCategoryName }} Transactions</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <div class="dialog-meta">
            <span>{{ selectedCategoryTransactions.length }} transactions</span>
            <span>
              Net total:
              <strong>{{ formatAmount(selectedCategoryTotal) }} {{ currency }}</strong>
            </span>
          </div>
          <div v-if="formattedDateRange" class="dialog-range">
            {{ formattedDateRange }}
          </div>

          <q-list
            v-if="selectedCategoryTransactions.length > 0"
            bordered
            separator
            class="transactions-list"
          >
            <q-item
              v-for="(transaction, index) in selectedCategoryTransactions"
              :key="`${transaction.id || transaction.date || 'tx'}-${index}`"
            >
              <q-item-section>
                <q-item-label class="transaction-description">
                  {{ transaction.description || "No description" }}
                </q-item-label>
                <q-item-label caption>
                  {{ formatDateDMY(transaction.date) }} | {{
                    transaction.transaction_type || "Transaction"
                  }}
                </q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-item-label class="transaction-amount">
                  {{ formatTransactionAmount(transaction) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="empty-transactions">
            No transactions found for this category.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<style scoped lang="scss">
.category-pie-chart {
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        opacity: 0.9;
      }

      h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .date-range {
        margin: 4px 0 0 0;
        opacity: 0.8;
        font-size: 0.9rem;
      }
    }

    .total-expenses {
      text-align: right;

      .total-label {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-bottom: 4px;
      }

      .total-amount {
        font-size: 1.5rem;
        font-weight: 700;
      }
    }
  }

  .chart-content {
    padding: 0;

    .chart-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 400px;

      .chart-wrapper {
        padding: 20px;

        .chart {
          width: 100%;
          height: 400px;
        }
      }

      .category-details {
        border-left: 1px solid #e5e7eb;
        padding: 24px;
        background: #fafafa;

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;

          h4 {
            margin: 0;
            color: #2d3748;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .summary-stats {
            .stat {
              text-align: center;

              .stat-label {
                display: block;
                font-size: 0.8rem;
                color: #6b7280;
                margin-bottom: 2px;
              }

              .stat-value {
                display: block;
                font-size: 1.2rem;
                font-weight: 700;
                color: #667eea;
              }
            }
          }
        }

        .categories-list {
          max-height: 320px;
          overflow-y: auto;

          .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 8px;
            background: white;
            border-radius: 12px;
            border-left: 4px solid var(--category-color);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            transition: all 0.3s ease;
            cursor: pointer;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            &.category-item--active {
              transform: translateY(-2px);
              box-shadow: 0 6px 14px rgba(0, 0, 0, 0.14);
            }

            .category-info {
              display: flex;
              align-items: center;
              gap: 12px;

              .category-color-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background-color: var(--category-color);
                flex-shrink: 0;
              }

              .category-text {
                .category-name {
                  font-weight: 600;
                  color: #2d3748;
                  margin-bottom: 2px;
                }

                .category-percentage {
                  font-size: 0.8rem;
                  color: #6b7280;
                }
              }
            }

            .category-amount {
              font-weight: 700;
              color: #2d3748;
            }
          }
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;

      .empty-icon {
        margin-bottom: 20px;
        opacity: 0.5;
      }

      .empty-text {
        h4 {
          margin: 0 0 8px 0;
          color: #6b7280;
          font-size: 1.2rem;
        }

        p {
          margin: 0;
          color: #9ca3af;
          font-size: 0.9rem;
        }
      }
    }
  }
}

.transactions-dialog-card {
  width: min(760px, 96vw);
  max-height: 84vh;
  border-radius: 14px;

  .dialog-meta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
    color: #4b5563;
    font-size: 0.9rem;
  }

  .dialog-range {
    margin-bottom: 12px;
    color: #6b7280;
    font-size: 0.85rem;
  }

  .transactions-list {
    max-height: 52vh;
    overflow-y: auto;
    border-radius: 10px;
  }

  .transaction-description {
    font-weight: 600;
    color: #1f2937;
  }

  .transaction-amount {
    font-weight: 700;
    color: #111827;
  }

  .empty-transactions {
    padding: 16px 0;
    color: #6b7280;
  }
}

body.body--dark {
  .category-pie-chart {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
    border: 1px solid rgba(255, 255, 255, 0.14);

    .chart-header {
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    }

    .chart-content {
      background: transparent;

      .chart-wrapper {
        background: transparent;
      }

      .category-details {
        background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
        border-left-color: rgba(255, 255, 255, 0.14);

        .details-header h4 {
          color: #ffffff;
        }

        .details-header .summary-stats .stat .stat-label {
          color: #cbd5e1;
        }

        .details-header .summary-stats .stat .stat-value {
          color: #ffffff;
        }

        .categories-list .category-item {
          background: #262626;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);

          .category-info .category-text .category-name {
            color: #ffffff;
          }

          .category-info .category-text .category-percentage {
            color: #cbd5e1;
          }

          .category-amount {
            color: #ffffff;
          }

          &.category-item--active {
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
          }
        }
      }

      .empty-state .empty-text {
        h4 {
          color: #d1d5db;
        }
        p {
          color: #9ca3af;
        }
      }
    }
  }

  .transactions-dialog-card {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.14);

    .dialog-meta,
    .dialog-range,
    .empty-transactions {
      color: #cbd5e1;
    }

    .transaction-description,
    .transaction-amount {
      color: #ffffff;
    }

    .transactions-list {
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

@media (max-width: 1024px) {
  .category-pie-chart .chart-content .chart-container {
    grid-template-columns: 1fr;

    .category-details {
      border-left: none;
      border-top: 1px solid #e5e7eb;
    }
  }

  body.body--dark .category-pie-chart .chart-content .chart-container .category-details {
    border-top-color: rgba(255, 255, 255, 0.14);
  }
}

@media (max-width: 768px) {
  .category-pie-chart {
    .chart-header {
      flex-direction: column;
      gap: 16px;
      text-align: center;

      .total-expenses {
        text-align: center;
      }
    }

    .chart-content .chart-container {
      .chart-wrapper .chart {
        height: 300px;
      }

      .category-details .categories-list {
        max-height: 250px;
      }
    }
  }
}

@media (max-width: 480px) {
  .category-pie-chart {
    .chart-header {
      padding: 16px;
    }

    .chart-content .chart-container {
      min-height: 0;

      .chart-wrapper {
        padding: 12px;
      }

      .category-details {
        padding: 14px;

        .categories-list .category-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;

          .category-amount {
            width: 100%;
            text-align: left;
          }
        }
      }
    }
  }
}

:deep(.custom-tooltip) {
  font-family: inherit;

  strong {
    color: #2d3748;
  }

  small {
    color: #6b7280;
  }
}

body.body--dark :deep(.custom-tooltip) {
  strong {
    color: #ffffff;
  }

  small {
    color: #cbd5e1;
  }
}
</style>
