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
    const chartOptions = ref({});
    const loading = ref(false);

    const topCoins = ref([]);
    const availableCoins = ref([]);
    const selectedCoins = ref([]);
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
    const newAlertCoin = ref("");
    const notifications = ref([]);
    const showAlertDialog = ref(false);

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
            // Summiere alle Volumen im Intervall
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
      if (!newAlertPrice.value || !newAlertCoin.value) return;

      const alert = {
        id: Date.now(),
        coin: newAlertCoin.value,
        price: parseFloat(newAlertPrice.value),
        active: true,
        createdAt: new Date(),
        triggered: false,
      };

      priceAlerts.value.push(alert);
      newAlertPrice.value = "";
      newAlertCoin.value = "";
      showAlertDialog.value = false;
      updateChart();
    }

    function removeAlert(alertId) {
      priceAlerts.value = priceAlerts.value.filter((alert) => alert.id !== alertId);
      updateChart();
    }

    function checkAlerts() {
      if (!cryptoData.value || Object.keys(cryptoData.value).length === 0) return;

      priceAlerts.value.forEach((alert) => {
        if (alert.active && cryptoData.value[alert.coin]) {
          const latestData = cryptoData.value[alert.coin];
          if (latestData.length === 0) return;

          const latestPrice = latestData[latestData.length - 1][2];
          const priceDiff = Math.abs(latestPrice - alert.price);
          const tolerance = alert.price * 0.005;

          if (priceDiff <= tolerance && !alert.triggered) {
            alert.triggered = true;
            addNotification(alert.coin, alert.price, latestPrice);
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
        selectedCoins.value = [topCoins.value[0].value];
        newAlertCoin.value = selectedCoins.value[0];
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
        volumeData.value = {};
        rawPriceData.value = {};

        results.forEach((res, idx) => {
          const coin = selectedCoins.value[idx];
          rawPriceData.value[coin] = res.data.prices;

          // ECHTES Volumen von der API verwenden
          const volumes = res.data.total_volumes || [];

          if (selectedChartType.value === "candlestick") {
            cryptoData.value[coin] = createOHLC(res.data.prices, timeframeMinutes);
            volumeData.value[coin] = createVolumeData(volumes, timeframeMinutes);
          } else {
            cryptoData.value[coin] = createLineData(res.data.prices);
            volumeData.value[coin] = createVolumeData(volumes, timeframeMinutes);
          }
        });

        checkAlerts();
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

      const series = [];
      const colors = ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"];

      Object.keys(cryptoData.value).forEach((coin, index) => {
        const color = colors[index % colors.length];

        const markLineData = [];
        priceAlerts.value
          .filter((alert) => alert.coin === coin && alert.active)
          .forEach((alert) => {
            markLineData.push({
              yAxis: alert.price,
              name: `Alarm: ${alert.price}€`,
              lineStyle: {
                color: alert.triggered ? "#00ff00" : "#ff4444",
                type: "dashed",
                width: 2,
              },
              label: {
                formatter: `Alarm: ${alert.price}€`,
                position: "end",
              },
            });
          });

        if (selectedChartType.value === "candlestick") {
          series.push({
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
            markLine:
              markLineData.length > 0
                ? { data: markLineData, symbol: "none" }
                : undefined,
          });
        } else {
          series.push({
            name: coin.toUpperCase(),
            type: "line",
            data: cryptoData.value[coin],
            symbol: "none",
            lineStyle: { color: color, width: 2 },
            itemStyle: { color: color },
            markLine:
              markLineData.length > 0
                ? { data: markLineData, symbol: "none" }
                : undefined,
          });
        }

        if (selectedIndicators.value.length > 0 && rawPriceData.value[coin]) {
          const priceData = rawPriceData.value[coin];

          selectedIndicators.value.forEach((indicator) => {
            let indicatorData = [];
            let indicatorColor = "";

            switch (indicator) {
              case "ema20":
                indicatorData = calculateEMA(priceData, 20);
                indicatorColor = "#ff9900";
                break;
              case "sma50":
                indicatorData = calculateSMA(priceData, 50);
                indicatorColor = "#9966ff";
                break;
              case "ema50":
                indicatorData = calculateEMA(priceData, 50);
                indicatorColor = "#ff66cc";
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
                  width: 1.5,
                  type: "dashed",
                },
                itemStyle: { color: indicatorColor },
              });
            }
          });
        }

        if (showVolume.value && volumeData.value[coin]) {
          series.push({
            name: `${coin.toUpperCase()} Volumen`,
            type: "bar",
            data: volumeData.value[coin],
            xAxisIndex: 1,
            yAxisIndex: 1,
            itemStyle: { color: "#5470c6", opacity: 0.6 },
          });
        }
      });

      const gridConfig = showVolume.value
        ? [
            {
              left: "3%",
              right: "3%",
              bottom: "25%",
              top: "15%",
              containLabel: true,
            },
            {
              left: "3%",
              right: "3%",
              height: "20%",
              bottom: "5%",
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
              if (item.seriesName.includes("Volumen")) {
                result += `<div style="margin: 2px 0;">
                  <strong>${item.seriesName}</strong><br>
                  Volumen: <strong>${(item.value[1] / 1000000).toFixed(2)} Mio. €</strong>
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
                const color = isUp ? "#06B800" : "#FA0000";

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
                !item.seriesName.includes("Volumen")
              ) {
                const value =
                  item.seriesName.includes("EMA") || item.seriesName.includes("SMA")
                    ? `€${item.value[1]?.toFixed(2) || "0.00"}`
                    : `€${item.value[1]?.toFixed(2) || "0.00"}`;

                result += `<div style="margin: 2px 0;">
                  <strong>${item.seriesName}</strong><br>
                  ${
                    item.seriesName.includes("EMA") || item.seriesName.includes("SMA")
                      ? "Wert"
                      : "Preis"
                  }: <strong>${value}</strong>
                </div>`;
              }
            });
            return result;
          },
        },
        legend: { top: 10, right: 10, type: "scroll" },
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
                axisLabel: { formatter: (value) => `€${value.toLocaleString()}` },
              },
              {
                type: "value",
                name: "Volumen (Mio. €)",
                gridIndex: 1,
                axisLabel: {
                  formatter: (value) => `${(value / 1000000).toFixed(1)}M`,
                },
              },
            ]
          : {
              type: "value",
              name: "EUR",
              scale: true,
              splitLine: { show: true },
              axisLabel: { formatter: (value) => `€${value.toLocaleString()}` },
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

    watch(selectedCoins, fetchData);
    watch([selectedChartType, showVolume, selectedIndicators, priceAlerts], updateChart, {
      deep: true,
    });

    onMounted(() => {
      fetchTopCoins();
      fetchAllCoins();
      setTimeout(fetchData, 1000);
      setInterval(fetchData, 60000);
      setInterval(checkAlerts, 5000);
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
      showVolume,
      indicators,
      selectedIndicators,
      priceAlerts,
      newAlertPrice,
      newAlertCoin,
      notifications,
      showAlertDialog,
      addPriceAlert,
      removeAlert,
      removeNotification,
    };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <div class="notification-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        <div class="notification-icon">🚨</div>
        <div class="notification-content">
          <div class="notification-title">Preis-Alarm!</div>
          <div class="notification-message">
            {{ notification.coin.toUpperCase() }} hat
            {{ notification.currentPrice.toFixed(2) }}€ erreicht
            <br />
            <small>Ziel: {{ notification.targetPrice }}€</small>
          </div>
        </div>
        <q-btn
          flat
          dense
          round
          icon="close"
          size="sm"
          @click="removeNotification(notification.id)"
          class="notification-close"
        />
      </div>
    </div>

    <q-card>
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Crypto Chart Analysis</div>
        <div class="text-caption">
          15-Minuten Candlesticks mit echten Volumen-Daten & Alarmen
        </div>
      </q-card-section>

      <q-card-section>
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

          <q-select
            v-model="selectedIndicators"
            :options="indicators"
            multiple
            label="Indikatoren"
            emit-value
            map-options
            filled
          />

          <q-toggle v-model="showVolume" label="Volumen anzeigen" color="primary" />

          <q-btn
            color="red"
            icon="notifications"
            label="Alarm erstellen"
            @click="showAlertDialog = true"
          />
        </div>

        <div v-if="priceAlerts.length > 0" class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Aktive Alarme:</div>
          <div class="row q-gutter-sm">
            <q-chip
              v-for="alert in priceAlerts"
              :key="alert.id"
              :color="alert.triggered ? 'green' : 'red'"
              text-color="white"
              removable
              @remove="removeAlert(alert.id)"
            >
              {{ alert.coin.toUpperCase() }}: {{ alert.price }}€
              <q-tooltip v-if="alert.triggered">Alarm wurde ausgelöst!</q-tooltip>
            </q-chip>
          </div>
        </div>

        <v-chart
          class="crypto-chart"
          :option="chartOptions"
          autoresize
          :loading="loading"
        />
      </q-card-section>
    </q-card>

    <q-dialog v-model="showAlertDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Neuen Preis-Alarm erstellen</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-y-md">
            <q-select
              v-model="newAlertCoin"
              :options="
                selectedCoins.map((coin) => ({
                  label: coin.toUpperCase(),
                  value: coin,
                }))
              "
              label="Coin auswählen"
              emit-value
              map-options
              filled
            />

            <q-input
              v-model="newAlertPrice"
              label="Preis in €"
              type="number"
              filled
              placeholder="z.B. 45000"
            />

            <div class="text-caption text-grey">
              💡 Der Alarm wird ausgelöst, wenn der Kurs innerhalb von 0.5% des
              Zielpreises liegt.
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" color="primary" v-close-popup />
          <q-btn
            label="Alarm erstellen"
            color="red"
            @click="addPriceAlert"
            :disable="!newAlertPrice || !newAlertCoin"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.crypto-chart {
  width: 100%;
  height: 600px;
}

.row {
  flex-wrap: wrap;
}

.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 350px;
}

.notification {
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #ff4444;
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
}

.notification.success {
  border-left-color: #00c851;
}

.notification-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-content {
  flex-grow: 1;
}

.notification-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}

.notification-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.notification-close {
  margin-left: 8px;
  flex-shrink: 0;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .notification-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .notification {
    min-width: auto;
  }
}
</style>
