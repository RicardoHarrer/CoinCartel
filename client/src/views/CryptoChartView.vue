<script>
import { defineComponent, ref, watch, onMounted } from "vue";
import axios from "axios";
import { use } from "echarts/core";
import { CandlestickChart, LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import { useQuasar } from "quasar";

use([
  CanvasRenderer,
  CandlestickChart,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
]);

export default defineComponent({
  components: { VChart },
  setup() {
    const $q = useQuasar();
    const chartOptions = ref({});
    const loading = ref(false);

    const topCoins = ref([]);
    const availableCoins = ref([]);
    const selectedCoin = ref(null);
    const cryptoData = ref({});
    const volumeData = ref({});
    const rawPriceData = ref({});

    const chartTypes = ref([
      { label: "Candlestick", value: "candlestick" },
      { label: "Line", value: "line" },
    ]);
    const selectedChartType = ref("candlestick");

    const showVolume = ref(false);
    const indicators = ref([
      { label: "EMA 20", value: "ema20" },
      { label: "SMA 50", value: "sma50" },
      { label: "EMA 50", value: "ema50" },
    ]);
    const selectedIndicators = ref([]);

    const priceAlerts = ref([]);
    const newAlertPrice = ref("");
    const notifications = ref([]);
    const showAlertDialog = ref(false);

    const timeframeMinutes = 15;

    // Hilfsfunktion für Indikator-Farben
    const getIndicatorColor = (indicator) => {
      switch (indicator) {
        case "ema20":
          return "#ff9900";
        case "sma50":
          return "#9966ff";
        case "ema50":
          return "#ff66cc";
        default:
          return "#667eea";
      }
    };

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

    function addNotification(coin, price, currentPrice) {
      const notification = {
        id: Date.now(),
        coin: coin,
        targetPrice: price,
        currentPrice: currentPrice,
        type: "success",
        timestamp: new Date(),
      };

      notifications.value.unshift(notification);

      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }

    function removeNotification(notificationId) {
      notifications.value = notifications.value.filter((n) => n.id !== notificationId);
    }

    function calculateEMA(prices, period) {
      if (!prices || prices.length < period) return [];

      const ema = [];
      const multiplier = 2 / (period + 1);
      let emaValue = prices[0][1];

      ema.push([prices[0][0], emaValue]);

      for (let i = 1; i < prices.length; i++) {
        emaValue = (prices[i][1] - emaValue) * multiplier + emaValue;
        ema.push([prices[i][0], emaValue]);
      }

      return ema;
    }

    function calculateSMA(prices, period) {
      if (!prices || prices.length < period) return [];

      const sma = [];

      for (let i = period - 1; i < prices.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += prices[i - j][1];
        }
        const average = sum / period;
        sma.push([prices[i][0], average]);
      }

      return sma;
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

        if (timestamp < chunkStartTime + timeframeMinutes * 60000) {
          currentChunk.push([timestamp, value]);
        } else {
          if (currentChunk.length > 0) {
            const open = currentChunk[0][1];
            const close = currentChunk[currentChunk.length - 1][1];
            const high = Math.max(...currentChunk.map((c) => c[1]));
            const low = Math.min(...currentChunk.map((c) => c[1]));

            ohlc.push([chunkStartTime, open, close, low, high]);
          }

          currentChunk = [[timestamp, value]];
          chunkStartTime = calculateIntervalStart(timestamp, timeframeMinutes);
        }
      });

      if (currentChunk.length > 0) {
        const open = currentChunk[0][1];
        const close = currentChunk[currentChunk.length - 1][1];
        const high = Math.max(...currentChunk.map((c) => c[1]));
        const low = Math.min(...currentChunk.map((c) => c[1]));

        ohlc.push([chunkStartTime, open, close, low, high]);
      }

      return ohlc;
    }

    function createVolumeData(volumes, timeframeMinutes = 15) {
      if (!volumes || volumes.length === 0) return [];

      const aggregatedVolume = [];
      let currentChunk = [];
      let chunkStartTime = null;

      const sortedVolumes = [...volumes].sort((a, b) => a[0] - b[0]);

      sortedVolumes.forEach((volume, index) => {
        const timestamp = volume[0];
        const volumeValue = volume[1];

        if (!chunkStartTime) {
          chunkStartTime = calculateIntervalStart(timestamp, timeframeMinutes);
        }

        if (timestamp < chunkStartTime + timeframeMinutes * 60000) {
          currentChunk.push([timestamp, volumeValue]);
        } else {
          if (currentChunk.length > 0) {
            const totalVolume = currentChunk.reduce((sum, vol) => sum + vol[1], 0);
            aggregatedVolume.push([chunkStartTime, totalVolume]);
          }

          currentChunk = [[timestamp, volumeValue]];
          chunkStartTime = calculateIntervalStart(timestamp, timeframeMinutes);
        }
      });

      if (currentChunk.length > 0) {
        const totalVolume = currentChunk.reduce((sum, vol) => sum + vol[1], 0);
        aggregatedVolume.push([chunkStartTime, totalVolume]);
      }

      return aggregatedVolume;
    }

    function createLineData(prices) {
      if (!prices || prices.length === 0) return [];
      return prices.map((price) => [price[0], price[1]]);
    }

    function addPriceAlert() {
      if (!newAlertPrice.value || !selectedCoin.value) return;

      const alert = {
        id: Date.now(),
        coin: selectedCoin.value,
        price: parseFloat(newAlertPrice.value),
        active: true,
        createdAt: new Date(),
        triggered: false,
      };

      priceAlerts.value.push(alert);
      newAlertPrice.value = "";
      showAlertDialog.value = false;
      updateChart();

      $q.notify({
        type: "positive",
        message: `Price alert set for ${alert.coin.toUpperCase()} at ${alert.price}€`,
      });
    }

    function removeAlert(alertId) {
      const alert = priceAlerts.value.find((a) => a.id === alertId);
      priceAlerts.value = priceAlerts.value.filter((alert) => alert.id !== alertId);
      updateChart();

      if (alert) {
        $q.notify({
          type: "info",
          message: `Alert removed for ${alert.coin.toUpperCase()}`,
        });
      }
    }

    function checkAlerts() {
      if (!cryptoData.value || !selectedCoin.value) return;

      const coin = selectedCoin.value;
      if (!cryptoData.value[coin]) return;

      priceAlerts.value.forEach((alert) => {
        if (alert.active && alert.coin === coin) {
          const latestData = cryptoData.value[coin];
          if (latestData.length === 0) return;

          const latestPrice = latestData[latestData.length - 1][2];
          const priceDiff = Math.abs(latestPrice - alert.price);
          const tolerance = alert.price * 0.005;

          if (priceDiff <= tolerance && !alert.triggered) {
            alert.triggered = true;
            addNotification(alert.coin, alert.price, latestPrice);

            $q.notify({
              type: "warning",
              message: `🚨 ${alert.coin.toUpperCase()} reached ${latestPrice.toFixed(
                2
              )}€ (Target: ${alert.price}€)`,
              timeout: 0,
              actions: [{ label: "Dismiss", color: "white" }],
            });
          }

          if (priceDiff > tolerance && alert.triggered) {
            alert.triggered = false;
          }
        }
      });
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
        selectedCoin.value = topCoins.value[0].value;
      } catch (error) {
        console.error("Fehler beim Laden der Top-Coins:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load top cryptocurrencies",
        });
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
      if (!selectedCoin.value) return;
      loading.value = true;

      try {
        const response = await axios.get(
          `http://localhost:3000/api/crypto/${selectedCoin.value}`
        );

        cryptoData.value = {};
        volumeData.value = {};
        rawPriceData.value = {};

        const coin = selectedCoin.value;
        rawPriceData.value[coin] = response.data.prices;

        const volumes = response.data.total_volumes || [];

        if (selectedChartType.value === "candlestick") {
          cryptoData.value[coin] = createOHLC(response.data.prices, timeframeMinutes);
          volumeData.value[coin] = createVolumeData(volumes, timeframeMinutes);
        } else {
          cryptoData.value[coin] = createLineData(response.data.prices);
          volumeData.value[coin] = createVolumeData(volumes, timeframeMinutes);
        }

        checkAlerts();
        updateChart();
      } catch (error) {
        console.error("Fehler beim Laden der Kurse vom Server:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load cryptocurrency data",
        });
      } finally {
        loading.value = false;
      }
    }

    function updateChart() {
      if (
        !cryptoData.value ||
        !selectedCoin.value ||
        !cryptoData.value[selectedCoin.value]
      ) {
        chartOptions.value = {
          title: {
            text: "No data available",
            left: "center",
            top: "center",
          },
        };
        return;
      }

      const coin = selectedCoin.value;
      const series = [];
      const color = "#667eea";

      const markLineData = [];
      priceAlerts.value
        .filter((alert) => alert.coin === coin && alert.active)
        .forEach((alert) => {
          markLineData.push({
            yAxis: alert.price,
            name: `Alert: ${alert.price}€`,
            lineStyle: {
              color: alert.triggered ? "#10b981" : "#ef4444",
              type: "dashed",
              width: 2,
            },
            label: {
              formatter: `Alert: ${alert.price}€`,
              position: "end",
            },
          });
        });

      // Haupt-Chart-Serie
      if (selectedChartType.value === "candlestick") {
        series.push({
          name: coin.toUpperCase(),
          type: "candlestick",
          data: cryptoData.value[coin],
          itemStyle: {
            color: "#10b981",
            color0: "#ef4444",
            borderColor: "#10b981",
            borderColor0: "#ef4444",
            borderWidth: 1,
          },
          markLine:
            markLineData.length > 0 ? { data: markLineData, symbol: "none" } : undefined,
        });
      } else {
        series.push({
          name: coin.toUpperCase(),
          type: "line",
          data: cryptoData.value[coin],
          symbol: "none",
          lineStyle: { color: color, width: 3 },
          itemStyle: { color: color },
          markLine:
            markLineData.length > 0 ? { data: markLineData, symbol: "none" } : undefined,
        });
      }

      // Technische Indikatoren
      if (selectedIndicators.value.length > 0 && rawPriceData.value[coin]) {
        const priceData = rawPriceData.value[coin];

        selectedIndicators.value.forEach((indicator) => {
          let indicatorData = [];
          let indicatorColor = getIndicatorColor(indicator);

          switch (indicator) {
            case "ema20":
              indicatorData = calculateEMA(priceData, 20);
              break;
            case "sma50":
              indicatorData = calculateSMA(priceData, 50);
              break;
            case "ema50":
              indicatorData = calculateEMA(priceData, 50);
              break;
          }

          if (indicatorData.length > 0) {
            series.push({
              name: `${coin.toUpperCase()} ${indicator.toUpperCase()}`,
              type: "line",
              data: indicatorData,
              symbol: "none",
              lineStyle: {
                color: indicatorColor,
                width: 2,
                type: "dashed",
              },
              itemStyle: { color: indicatorColor },
            });
          }
        });
      }

      // Volumen
      if (showVolume.value && volumeData.value[coin]) {
        series.push({
          name: `${coin.toUpperCase()} Volume`,
          type: "bar",
          data: volumeData.value[coin],
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: { color: "#667eea", opacity: 0.6 },
        });
      }

      const gridConfig = showVolume.value
        ? [
            {
              left: "3%",
              right: "3%",
              bottom: "40%",
              top: "15%",
              containLabel: true,
            },
            {
              left: "3%",
              right: "3%",
              height: "20%",
              bottom: "5%",
              top: "75%",
              containLabel: true,
            },
          ]
        : [
            {
              left: "3%",
              right: "3%",
              bottom: "15%",
              top: "15%",
              containLabel: true,
            },
          ];

      chartOptions.value = {
        animation: false,
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            lineStyle: { color: "#7581BD", width: 1 },
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
              if (item.seriesName.includes("Volume")) {
                result += `<div style="margin: 2px 0;">
                  <strong>${item.seriesName}</strong><br>
                  Volume: <strong>${(item.value[1] / 1000000).toFixed(2)} Mio. €</strong>
                </div>`;
              } else if (
                selectedChartType.value === "candlestick" &&
                item.value &&
                item.value.length >= 5 &&
                !item.seriesName.includes("EMA") &&
                !item.seriesName.includes("SMA")
              ) {
                const isUp = item.value[2] >= item.value[1];
                const arrow = isUp ? "▲" : "▼";
                const color = isUp ? "#10b981" : "#ef4444";

                result += `<div style="color: ${color}; margin: 2px 0;">
                  <strong>${item.seriesName}</strong> ${arrow}<br>
                  O: <strong>€${item.value[1]?.toFixed(2) || "0.00"}</strong> |
                  H: <strong>€${item.value[4]?.toFixed(2) || "0.00"}</strong><br>
                  C: <strong>€${item.value[2]?.toFixed(2) || "0.00"}</strong> |
                  L: <strong>€${item.value[3]?.toFixed(2) || "0.00"}</strong>
                </div>`;
              } else if (
                item.value &&
                item.value.length >= 2 &&
                !item.seriesName.includes("Volume")
              ) {
                const value =
                  item.seriesName.includes("EMA") || item.seriesName.includes("SMA")
                    ? `€${item.value[1]?.toFixed(2) || "0.00"}`
                    : `€${item.value[1]?.toFixed(2) || "0.00"}`;

                result += `<div style="margin: 2px 0;">
                  <strong>${item.seriesName}</strong><br>
                  ${
                    item.seriesName.includes("EMA") || item.seriesName.includes("SMA")
                      ? "Value"
                      : "Price"
                  }: <strong>${value}</strong>
                </div>`;
              }
            });
            return result;
          },
        },
        legend: {
          top: 10,
          right: 10,
          type: "scroll",
          textStyle: {
            color: "#1f2937",
          },
        },
        grid: gridConfig,
        xAxis: showVolume.value
          ? [
              {
                type: "time",
                gridIndex: 0,
                axisLine: { onZero: false },
                splitLine: { show: true },
                minInterval: 900000,
                axisLabel: {
                  formatter: (value) => {
                    const date = new Date(value);
                    return `${date
                      .getHours()
                      .toString()
                      .padStart(2, "0")}:${date
                      .getMinutes()
                      .toString()
                      .padStart(2, "0")}`;
                  },
                  color: "#6b7280",
                },
              },
              {
                type: "time",
                gridIndex: 1,
                minInterval: 900000,
                axisLabel: { show: false },
              },
            ]
          : {
              type: "time",
              axisLine: { onZero: false },
              splitLine: { show: true },
              minInterval: 900000,
              axisLabel: {
                formatter: (value) => {
                  const date = new Date(value);
                  return `${date
                    .getHours()
                    .toString()
                    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
                },
                color: "#6b7280",
              },
            },
        yAxis: showVolume.value
          ? [
              {
                type: "value",
                name: "EUR",
                scale: true,
                gridIndex: 0,
                splitLine: { show: true },
                axisLabel: {
                  formatter: (value) => `€${value.toLocaleString()}`,
                  color: "#6b7280",
                },
                nameTextStyle: {
                  color: "#6b7280",
                },
              },
              {
                type: "value",
                name: "Volume (Mio. €)",
                gridIndex: 1,
                axisLabel: {
                  formatter: (value) => `${(value / 1000000).toFixed(1)}M`,
                  color: "#6b7280",
                },
                nameTextStyle: {
                  color: "#6b7280",
                },
              },
            ]
          : {
              type: "value",
              name: "EUR",
              scale: true,
              splitLine: { show: true },
              axisLabel: {
                formatter: (value) => `€${value.toLocaleString()}`,
                color: "#6b7280",
              },
              nameTextStyle: {
                color: "#6b7280",
              },
            },
        dataZoom: [
          {
            type: "slider",
            start: 0,
            end: 100,
            bottom: showVolume.value ? "30%" : "20%",
            height: 20,
          },
          { type: "inside" },
        ],
        series,
      };
    }

    // Watch-Funktionen korrigiert
    watch(selectedCoin, (newCoin, oldCoin) => {
      if (newCoin !== oldCoin) {
        fetchData();
      }
    });

    watch(
      [selectedChartType, showVolume, selectedIndicators],
      () => {
        if (selectedCoin.value) {
          updateChart();
        }
      },
      { deep: true }
    );

    watch(
      priceAlerts,
      () => {
        if (selectedCoin.value) {
          updateChart();
        }
      },
      { deep: true }
    );

    onMounted(() => {
      fetchTopCoins();
      fetchAllCoins();
      setTimeout(() => {
        if (selectedCoin.value) {
          fetchData();
        }
      }, 1000);
      setInterval(() => {
        if (selectedCoin.value) {
          fetchData();
        }
      }, 60000);
      setInterval(checkAlerts, 5000);
    });

    return {
      chartOptions,
      loading,
      availableCoins,
      topCoins,
      selectedCoin,
      cryptoData,
      chartTypes,
      selectedChartType,
      showVolume,
      indicators,
      selectedIndicators,
      priceAlerts,
      newAlertPrice,
      notifications,
      showAlertDialog,
      addPriceAlert,
      removeAlert,
      removeNotification,
      getIndicatorColor,
    };
  },
});
</script>

<template>
  <div class="modern-dashboard">
    <!-- Header mit Glas-Effekt -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Crypto Chart Analysis</h1>
        <p>Real-time cryptocurrency data with technical indicators & alerts</p>
      </div>
      <div class="header-actions">
        <q-btn icon="refresh" round flat @click="fetchAllTransactions">
          <q-tooltip>Aktualisieren</q-tooltip>
        </q-btn>
        <q-btn
          icon="notifications"
          round
          flat
          color="red"
          @click="showAlertDialog = true"
          :disable="!selectedCoin"
        >
          <q-tooltip>Alarm erstellen</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-card selected-coin">
        <div class="stat-icon">
          <q-icon name="currency_bitcoin" />
        </div>
        <div class="stat-content">
          <div class="stat-value" v-if="selectedCoin">
            {{ selectedCoin.toUpperCase() }}
          </div>
          <div class="stat-value" v-else>None</div>
          <div class="stat-label">Selected Coin</div>
        </div>
      </div>

      <div class="stat-card alerts">
        <div class="stat-icon">
          <q-icon name="notifications" />
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ priceAlerts.filter((a) => a.active && a.coin === selectedCoin).length }}
          </div>
          <div class="stat-label">Active Alerts</div>
        </div>
      </div>

      <div class="stat-card timeframe">
        <div class="stat-icon">
          <q-icon name="schedule" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ timeframeMinutes }}min</div>
          <div class="stat-label">Timeframe</div>
        </div>
      </div>

      <div class="stat-card indicators">
        <div class="stat-content">
          <div class="stat-value">{{ selectedIndicators.length }}</div>
          <div class="stat-label">Technical Indicators</div>
        </div>
      </div>
    </div>

    <!-- Controls Card -->
    <q-card class="controls-card">
      <q-card-section>
        <div class="row q-gutter-md items-center">
          <q-select
            v-model="selectedCoin"
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
            label="Select Cryptocurrency"
            emit-value
            map-options
            filled
            style="min-width: 300px"
          />

          <q-select
            v-model="selectedChartType"
            :options="chartTypes"
            label="Chart Type"
            emit-value
            map-options
            filled
          />

          <q-select
            v-model="selectedIndicators"
            :options="indicators"
            multiple
            label="Technical Indicators"
            emit-value
            map-options
            filled
          />

          <q-toggle v-model="showVolume" label="Show Volume" color="primary" />

          <q-space />

          <q-btn-group class="col-auto">
            <q-btn
              label="Financial Dashboard"
              color="primary"
              icon="analytics"
              to="/chart"
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

    <!-- Active Alerts -->
    <div
      v-if="selectedCoin && priceAlerts.filter((a) => a.coin === selectedCoin).length > 0"
      class="alerts-section"
    >
      <q-card class="alerts-card">
        <q-card-section>
          <div class="text-subtitle2 q-mb-xs">
            Active Price Alerts for {{ selectedCoin.toUpperCase() }}:
          </div>
          <div class="row q-gutter-sm">
            <q-chip
              v-for="alert in priceAlerts.filter((a) => a.coin === selectedCoin)"
              :key="alert.id"
              :color="alert.triggered ? 'green' : 'red'"
              text-color="white"
              removable
              @remove="removeAlert(alert.id)"
            >
              <q-icon
                :name="alert.triggered ? 'notifications_active' : 'notifications'"
                class="q-mr-xs"
              />
              {{ alert.price }}€
              <q-tooltip v-if="alert.triggered">Alert triggered!</q-tooltip>
            </q-chip>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Main Chart Area -->
    <div class="chart-container">
      <div class="chart-header">
        <h3 v-if="selectedCoin">
          {{ selectedCoin.toUpperCase() }} - Cryptocurrency Analysis
        </h3>
        <h3 v-else>Select a cryptocurrency to view analysis</h3>
        <div class="chart-legend">
          <div class="legend-item" v-if="selectedChartType === 'candlestick'">
            <div class="legend-color bullish"></div>
            <span>Bullish</span>
          </div>
          <div class="legend-item" v-if="selectedChartType === 'candlestick'">
            <div class="legend-color bearish"></div>
            <span>Bearish</span>
          </div>
          <div class="legend-item" v-if="showVolume">
            <div class="legend-color volume"></div>
            <span>Volume</span>
          </div>
          <div
            class="legend-item"
            v-for="indicator in selectedIndicators"
            :key="indicator"
          >
            <div
              class="legend-color"
              :style="{ backgroundColor: getIndicatorColor(indicator) }"
            ></div>
            <span>{{ indicator.toUpperCase() }}</span>
          </div>
        </div>
      </div>

      <div class="chart-wrapper">
        <v-chart
          class="main-chart"
          :option="chartOptions"
          autoresize
          :loading="loading"
        />
      </div>
    </div>

    <!-- Alert Dialog -->
    <q-dialog v-model="showAlertDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Create Price Alert</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-y-md">
            <div class="alert-coin-info">
              <div class="text-subtitle2">Selected Coin:</div>
              <div class="text-h6 text-primary">
                {{ selectedCoin ? selectedCoin.toUpperCase() : "None" }}
              </div>
            </div>

            <q-input
              v-model="newAlertPrice"
              label="Target Price (€)"
              type="number"
              filled
              placeholder="e.g., 45000"
              :disable="!selectedCoin"
            />

            <div class="text-caption text-grey">
              💡 Alert will trigger when price is within 0.5% of target price.
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            label="Create Alert"
            color="red"
            @click="addPriceAlert"
            :disable="!newAlertPrice || !selectedCoin"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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

      .q-btn {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.9);
        border-radius: 9999px;

        &:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(129, 140, 248, 1); /* optional: andere Farbe beim Hover */
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

      &.selected-coin {
        border-left: 4px solid #667eea;
      }

      &.alerts {
        border-left: 4px solid #ef4444;
      }

      &.timeframe {
        border-left: 4px solid #10b981;
      }

      &.indicators {
        border-left: 4px solid #8b5cf6;
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        .selected-coin & {
          background: #dbeafe;
          color: #667eea;
        }
        .alerts & {
          background: #fee2e2;
          color: #ef4444;
        }
        .timeframe & {
          background: #dcfce7;
          color: #10b981;
        }
        .indicators & {
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
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 5px;
          color: #1f2937;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
        }
      }
    }
  }

  .controls-card {
    border-radius: 16px;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }

  .alerts-section {
    margin-bottom: 30px;

    .alerts-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
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
        gap: 15px;
        flex-wrap: wrap;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #6b7280;

          .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 2px;

            &.bullish {
              background: #10b981;
            }
            &.bearish {
              background: #ef4444;
            }
            &.volume {
              background: #667eea;
            }
          }
        }
      }
    }

    .chart-wrapper {
      height: 600px;

      .main-chart {
        width: 100%;
        height: 100%;
      }
    }
  }

  .alert-coin-info {
    padding: 10px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 15px;
  }
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
    .alerts-card,
    .chart-container {
      background: #1f2937;
      color: #f9fafb;

      .stat-label {
        color: #d1d5db;
      }

      .stat-value {
        color: #f9fafb;
      }
    }

    .alert-coin-info {
      background: #374151;
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

    .chart-wrapper {
      height: 400px;
    }
  }
}
</style>
