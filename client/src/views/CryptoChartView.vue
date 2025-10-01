<script>
import { defineComponent, ref, watch, onMounted } from 'vue';
import axios from 'axios';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
]);

export default defineComponent({
  components: { VChart },
  setup() {
    const chartOptions = ref({});
    const loading = ref(false);

    const availableCoins = ref([]);
    const topCoins = ref([]);
    const selectedCoins = ref([]);
    const cryptoData = ref({});

    async function fetchTopCoins() {
      try {
        const { data } = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'eur',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
          },
        });
        topCoins.value = data.map((coin) => ({
          label: `${coin.name} (${coin.symbol.toUpperCase()})`,
          value: coin.id,
        }));
        selectedCoins.value = [topCoins.value[0].value];
      } catch (error) {
        console.error('Fehler beim Laden der Top-Coins:', error);
      }
    }

    async function fetchAllCoins() {
      try {
        const { data } = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        availableCoins.value = data.map((coin) => ({
          label: `${coin.name} (${coin.symbol.toUpperCase()})`,
          value: coin.id,
        }));
      } catch (error) {
        console.error('Fehler beim Laden der Coin-Liste:', error);
      }
    }

    async function fetchData() {
      if (!selectedCoins.value.length) return;
      loading.value = true;

      try {
        const promises = selectedCoins.value.map((coin) =>
          axios.get(`http://localhost:3000/api/crypto/${coin}`),
        );

        const results = await Promise.all(promises);
        cryptoData.value = {};

        results.forEach((res, idx) => {
          const coin = selectedCoins.value[idx];
          cryptoData.value[coin] = res.data.prices.map(([timestamp, price]) => [timestamp, price]);
        });

        updateChart();
      } catch (error) {
        console.error('Fehler beim Laden der Kurse vom Server:', error);
      } finally {
        loading.value = false;
      }
    }

    function updateChart() {
      const series = Object.keys(cryptoData.value).map((coin) => ({
        name: coin.toUpperCase(),
        type: 'line',
        data: cryptoData.value[coin],
        smooth: true,
        symbol: 'circle',
        symbolSize: false,
      }));

      chartOptions.value = {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const date = new Date(params[0].value[0]);
            let result = `${date.getHours()}:${date
              .getMinutes()
              .toString()
              .padStart(2, '0')} Uhr<br>`;
            params.forEach((item) => {
              result += `${item.marker} ${item.seriesName}: €${item.value[1].toFixed(2)}<br>`;
            });
            return result;
          },
        },
        xAxis: {
          type: 'time',
          axisLabel: {
            formatter: (value) => {
              const date = new Date(value);
              return `${date.getHours()}:00`;
            },
          },
        },
        yAxis: { type: 'value', name: 'EUR' },
        legend: { top: 'bottom' },
        dataZoom: [{ type: 'slider', start: 0, end: 100 }],
        series,
      };
    }

    watch(selectedCoins, fetchData);

    onMounted(() => {
      fetchTopCoins();
      fetchAllCoins();
      setInterval(fetchData, 60000);
    });

    return {
      chartOptions,
      loading,
      availableCoins,
      topCoins,
      selectedCoins,
      cryptoData,
    };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <q-card>
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Live Crypto Chart (24h, €)</div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedCoins"
          :options="topCoins"
          :options-dense="true"
          use-input
          input-debounce="300"
          :filter="
            (val, update, abort) => {
              if (!val) {
                update(() => topCoins);
                return;
              }
              update(() =>
                availableCoins.filter((coin) =>
                  coin.label.toLowerCase().includes(val.toLowerCase()),
                ),
              );
            }
          "
          multiple
          label="Wähle Kryptowährungen"
          emit-value
          map-options
          filled
          class="q-mb-md"
        />

        <v-chart class="crypto-chart" :option="chartOptions" autoresize :loading="loading" />
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
.crypto-chart {
  width: 100%;
  height: 500px;
}
</style>
