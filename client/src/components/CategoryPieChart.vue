<script>
import { defineComponent, ref, computed, watch } from 'vue';
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

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
      default: 'EUR',
    },
    exchangeRates: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const loading = ref(false);

    const getCategoryName = (categoryId) => {
      const category = props.categories.find((c) => c.id === categoryId);
      return category ? category.name : 'Uncategorized';
    };

    const categoryData = computed(() => {
      const expenseData = {};

      props.transactions.forEach((t) => {
        if (t.transaction_type !== 'Ausgabe') return;

        const categoryName = getCategoryName(t.category_id);
        const rate = props.exchangeRates[props.currency] / (props.exchangeRates[t.currency] || 1);
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

      return {
        tooltip: {
          trigger: 'item',
          formatter: ({ data }) => {
            return `${data.name}: ${data.value} ${props.currency} (${data.percentage}%)`;
          },
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: categoryBreakdown.value.map((item) => item.name),
        },
        series: [
          {
            name: 'Expenses by Category',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold',
                formatter: (params) => {
                  return `{b|${params.name}}\n{per|${params.data.percentage}%}`;
                },
                rich: {
                  b: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    lineHeight: 26,
                    align: 'center',
                  },
                  per: {
                    fontSize: 14,
                    color: '#999',
                    lineHeight: 20,
                    align: 'center',
                  },
                },
              },
            },
            labelLine: {
              show: false,
            },
            data: categoryBreakdown.value.map((item) => ({
              name: item.name,
              value: item.value,
              percentage: item.percentage,
              itemStyle: { color: getCategoryColor(item.name) },
            })),
          },
        ],
      };
    });

    const getCategoryColor = (categoryName) => {
      const colors = [
        '#5470C6',
        '#91CC75',
        '#FAC858',
        '#EE6666',
        '#73C0DE',
        '#3BA272',
        '#FC8452',
        '#9A60B4',
        '#EA7CCC',
        '#FF9F7F',
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
      { deep: true },
    );

    return {
      loading,
      hasData,
      categoryBreakdown,
      pieChartOptions,
      getCategoryColor,
    };
  },
});
</script>

<template>
  <q-card class="q-mt-md">
    <q-card-section class="bg-primary text-white">
      <div class="text-h6">Expenses by Category</div>
      <div class="text-caption" v-if="dateRange">
        Showing data from {{ dateRange.from }} to {{ dateRange.to }}
      </div>
    </q-card-section>

   <q-card-section>
  <div v-if="hasData" class="row">
    <div class="col-md-8">
      <v-chart class="chart" :option="pieChartOptions" autoresize :loading="loading" />
    </div>
    <div class="col-md-4 q-pl-md">
      <q-list bordered separator class="category-list">
        <q-item v-for="item in categoryBreakdown" :key="item.name">
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
            <q-item-label caption>
              {{ item.value }} {{ currency }} ({{ item.percentage }}%)
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="getCategoryColor(item.name)" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>


      <div v-else class="text-center q-pa-lg">
        <q-icon name="pie_chart" size="xl" color="grey-5" />
        <div class="text-h6 q-mt-md">No expense data available</div>
        <div class="text-caption">Try adjusting your filters</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.chart {
  width: 100%;
  height: 400px;
  min-height: 300px;
}

/* Responsiv für Mobile */
@media (max-width: 768px) {
  .chart {
    height: 300px;
  }

  .q-list {
    max-height: 250px;
    overflow-y: auto;
  }
}

.q-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

body[data-theme='dark'] {
  .category-list {
    q-item {
      q-item-label,
      q-item-label[caption] {
        color: #fff; // Weißer Text im Darkmode
      }

      &:hover {
        background-color: #2a2a2a; // Optional Hover-Effekt im Darkmode
      }
    }
  }
}
</style>

