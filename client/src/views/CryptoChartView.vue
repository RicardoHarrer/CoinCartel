<script>
import { defineComponent, ref, watch, onMounted } from "vue";
import axios from "axios";
import { use } from "echarts/core";
import { CandlestickChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";

use([
  CanvasRenderer,
  CandlestickChart,
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

    const topCoins = ref([]);
    const availableCoins = ref([]);
    const selectedCoins = ref([]);
    const cryptoData = ref({});

    // Chart-Typ Auswahl
    const chartTypes = ref([
      { label: "Candlestick", value: "candlestick" },
      { label: "Line", value: "line" },
    ]);
    const selectedChartType = ref("candlestick");

    // Feste Zeitintervall-Einstellung (15 Minuten)
    const timeframeMinutes = 15;

    function calculateIntervalStart(timestamp, minutes) {
      const date = new Date(timestamp);
      const totalMinutes = date.getHours() * 60 + date.getMinutes();
      const intervals = Math.floor(totalMinutes / minutes);
      const startMinutes = intervals * minutes;

      date.setHours(Math.floor(startMinutes / 60));
      date.setMinutes(startMinutes % 60);
      date.setSeconds(0);
      date.setMilliseconds(0);

      return date.getTime();
    }

    function createOHLC(prices, timeframeMinutes = 15) {
      if (!prices || prices.length === 0) return [];

      const ohlc = [];
      let currentChunk = [];
      let chunkStartTime = null;

      const sortedPrices = [...prices].sort((a, b) => a[0] - b[0]);

      sortedPrices.forEach((price, index) => {
        const timestamp = price[0];
        const value = price[1];

        if (!chunkStartTime) {
          chunkStartTime = calculateIntervalStart(timestamp, timeframeMinutes);
        }

        // Prüfe ob wir im aktuellen Intervall sind
        if (timestamp < chunkStartTime + timeframeMinutes * 60000) {
          currentChunk.push([timestamp, value]);
        } else {
          // Erstelle OHLC für den abgeschlossenen Zeitraum
          if (currentChunk.length > 0) {
            const open = currentChunk[0][1];
            const close = currentChunk[currentChunk.length - 1][1];
            const high = Math.max(...currentChunk.map((c) => c[1]));
            const low = Math.min(...currentChunk.map((c) => c[1]));

            ohlc.push([chunkStartTime, open, close, low, high]);
          }

          // Starte neuen Zeitraum
          currentChunk = [[timestamp, value]];
          chunkStartTime = calculateIntervalStart(timestamp, timeframeMinutes);
        }
      });

      // Verbleibende Daten verarbeiten
      if (currentChunk.length > 0) {
        const open = currentChunk[0][1];
        const close = currentChunk[currentChunk.length - 1][1];
        const high = Math.max(...currentChunk.map((c) => c[1]));
        const low = Math.min(...currentChunk.map((c) => c[1]));

        ohlc.push([chunkStartTime, open, close, low, high]);
      }

      return ohlc;
    }

    function createLineData(prices) {
      if (!prices || prices.length === 0) return [];
      return prices.map((price) => [price[0], price[1]]);
    }

    async function fetchTopCoins() {
      try {
        const { data } = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "eur",
              order: "market_cap_desc",
              per_page: 10,
              page: 1,
            },
          }
        );
        topCoins.value = data.map((coin) => ({
          label: `${coin.name} (${coin.symbol.toUpperCase()})`,
          value: coin.id,
        }));
        selectedCoins.value = [topCoins.value[0].value];
      } catch (error) {
        console.error("Fehler beim Laden der Top-Coins:", error);
      }
    }

    async function fetchAllCoins() {
      try {
        const { data } = await axios.get("https://api.coingecko.com/api/v3/coins/list");
        availableCoins.value = data.map((coin) => ({
          label: `${coin.name} (${coin.symbol.toUpperCase()})`,
          value: coin.id,
        }));
      } catch (error) {
        console.error("Fehler beim Laden der Coin-Liste:", error);
      }
    }

    async function fetchData() {
      if (!selectedCoins.value.length) return;
      loading.value = true;

      try {
        const promises = selectedCoins.value.map((coin) =>
          axios.get(`http://localhost:3000/api/crypto/${coin}`)
        );

        const results = await Promise.all(promises);
        cryptoData.value = {};

        results.forEach((res, idx) => {
          const coin = selectedCoins.value[idx];
          if (selectedChartType.value === "candlestick") {
            cryptoData.value[coin] = createOHLC(res.data.prices, timeframeMinutes);
          } else {
            cryptoData.value[coin] = createLineData(res.data.prices);
          }
        });

        updateChart();
      } catch (error) {
        console.error("Fehler beim Laden der Kurse vom Server:", error);
      } finally {
        loading.value = false;
      }
    }

    function updateChart() {
      if (!cryptoData.value || Object.keys(cryptoData.value).length === 0) {
        chartOptions.value = {
          title: {
            text: "Keine Daten verfügbar",
            left: "center",
            top: "center",
          },
        };
        return;
      }

      const series = Object.keys(cryptoData.value).map((coin, index) => {
        const colors = ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"];
        const color = colors[index % colors.length];

        if (selectedChartType.value === "candlestick") {
          return {
            name: coin.toUpperCase(),
            type: "candlestick",
            data: cryptoData.value[coin],
            itemStyle: {
              color: "#06B800",
              color0: "#FA0000",
              borderColor: "#06B800",
              borderColor0: "#FA0000",
              borderWidth: 1,
            },
          };
        } else {
          return {
            name: coin.toUpperCase(),
            type: "line",
            data: cryptoData.value[coin],
            symbol: "none",
            lineStyle: {
              color: color,
              width: 2,
            },
            itemStyle: {
              color: color,
            },
          };
        }
      });

      chartOptions.value = {
        animation: false,
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            lineStyle: {
              color: "#7581BD",
              width: 1,
            },
          },
          formatter: (params) => {
            const date = new Date(params[0].value[0]);
            const dateStr = `${date.getDate().toString().padStart(2, "0")}.${(
              date.getMonth() + 1
            )
              .toString()
              .padStart(
                2,
                "0"
              )}.${date.getFullYear()} ${date
              .getHours()
              .toString()
              .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

            let result = `<div style="font-weight: bold; margin-bottom: 5px;">${dateStr}</div>`;
            params.forEach((item) => {
              if (
                selectedChartType.value === "candlestick" &&
                item.value &&
                item.value.length >= 5
              ) {
                const isUp = item.value[2] >= item.value[1];
                const arrow = isUp ? "▲" : "▼";
                const color = isUp ? "#06B800" : "#FA0000";

                result += `
                  <div style="color: ${color}; margin: 2px 0;">
                    <strong>${item.seriesName}</strong> ${arrow}<br>
                    O: <strong>€${item.value[1]?.toFixed(2) || "0.00"}</strong> |
                    H: <strong>€${item.value[4]?.toFixed(2) || "0.00"}</strong><br>
                    C: <strong>€${item.value[2]?.toFixed(2) || "0.00"}</strong> |
                    L: <strong>€${item.value[3]?.toFixed(2) || "0.00"}</strong>
                  </div>
                `;
              } else if (item.value && item.value.length >= 2) {
                result += `
                  <div style="margin: 2px 0;">
                    <strong>${item.seriesName}</strong><br>
                    Preis: <strong>€${item.value[1]?.toFixed(2) || "0.00"}</strong>
                  </div>
                `;
              }
            });
            return result;
          },
        },
        legend: {
          top: 10,
          right: 10,
          type: "scroll",
        },
        grid: {
          left: "3%",
          right: "3%",
          bottom: "15%",
          top: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "time",
          axisLine: { onZero: false },
          splitLine: { show: true },
          minInterval: 900000, // 15 Minuten
          axisLabel: {
            formatter: (value) => {
              const date = new Date(value);
              return `${date
                .getHours()
                .toString()
                .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
            },
          },
        },
        yAxis: {
          type: "value",
          name: "EUR",
          scale: true,
          splitLine: { show: true },
          axisLabel: {
            formatter: (value) => `€${value.toLocaleString()}`,
          },
        },
        dataZoom: [
          {
            type: "slider",
            start: 0,
            end: 100,
            bottom: 20,
            height: 20,
          },
          {
            type: "inside",
          },
        ],
        series,
      };
    }

    watch([selectedCoins, selectedChartType], fetchData);

    onMounted(() => {
      fetchTopCoins();
      fetchAllCoins();
      setTimeout(fetchData, 1000);
      setInterval(fetchData, 60000);
    });

    return {
      chartOptions,
      loading,
      availableCoins,
      topCoins,
      selectedCoins,
      cryptoData,
      chartTypes,
      selectedChartType,
      updateChart,
      fetchData,
    };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <q-card>
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Crypto Chart Analysis</div>
        <div class="text-caption">15-Minuten Candlesticks</div>
      </q-card-section>

      <q-card-section>
        <!-- Vereinfachte Steuerungsleiste -->
        <div class="row q-gutter-md q-mb-md">
          <q-select
            v-model="selectedCoins"
            :options="topCoins"
            use-input
            input-debounce="300"
            :filter="
              (val, update) => {
                if (!val) {
                  update(() => topCoins);
                  return;
                }
                update(() =>
                  availableCoins.filter((coin) =>
                    coin.label.toLowerCase().includes(val.toLowerCase())
                  )
                );
              }
            "
            multiple
            label="Kryptowährungen"
            emit-value
            map-options
            filled
            style="min-width: 250px"
          />

          <q-select
            v-model="selectedChartType"
            :options="chartTypes"
            label="Chart-Typ"
            emit-value
            map-options
            filled
          />
        </div>

        <v-chart
          class="crypto-chart"
          :option="chartOptions"
          autoresize
          :loading="loading"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
.crypto-chart {
  width: 100%;
  height: 700px;
}

.row {
  flex-wrap: wrap;
}
</style>
