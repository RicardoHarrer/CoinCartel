<script>
import { computed, defineComponent, ref, watch, onMounted } from "vue";
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
    const filteredCoinOptions = ref([]);
    const coinSearchQuery = ref("");
    const coinSelectRef = ref(null);
    const selectedCoin = ref(null);
    const selectedAssetMeta = ref({
      symbol: "",
      name: "",
      assetType: "asset",
      currency: "EUR",
      exchange: "",
    });
    const cryptoData = ref({});
    const volumeData = ref({});
    const rawPriceData = ref({});
    const rawCandleData = ref({});
    const rawVolumeData = ref({});
    const latestFetchToken = ref(0);

    const chartTypes = ref([
      { label: "Candlestick", value: "candlestick" },
      { label: "Line", value: "line" },
    ]);
    const selectedChartType = ref("candlestick");
    const timeframeOptions = ref([
      { label: "10 min", value: 10 },
      { label: "15 min", value: 15 },
      { label: "30 min", value: 30 },
    ]);

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

    const timeframeMinutes = ref(15);
    const currentDataRange = ref("1d");
    const chartRef = ref(null);
    const activeZoomContextKey = ref("");
    const chartViewportState = ref({
      contextKey: "",
      isUserAdjusted: false,
      xStart: 0,
      xEnd: 100,
      yStart: 0,
      yEnd: 100,
    });

    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);
    };

    const ASSET_TYPE_LABELS = {
      crypto: "Crypto",
      stock: "Stock",
      etf: "ETF",
      forex: "FX",
      index: "Index",
      fund: "Fund",
      commodity: "Commodity",
      asset: "Asset",
    };

    const selectedAssetCurrency = computed(
      () => selectedAssetMeta.value?.currency || "EUR"
    );
    const selectedAssetTypeLabel = computed(() => {
      const key = String(selectedAssetMeta.value?.assetType || "asset").toLowerCase();
      return ASSET_TYPE_LABELS[key] || "Asset";
    });

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
      const safeMinutes = Math.max(1, Number(minutes) || 1);
      const intervalMs = safeMinutes * 60000;
      const safeTimestamp = Number(timestamp);
      if (!Number.isFinite(safeTimestamp)) return 0;
      return Math.floor(safeTimestamp / intervalMs) * intervalMs;
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

      sortedPrices.forEach((price) => {
        const timestamp = price[0];
        const value = price[1];

        if (chunkStartTime === null) {
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

    function createOHLCFromCandles(candles, timeframeMinutes = 15) {
      if (!candles || candles.length === 0) return [];

      const aggregated = [];
      let currentChunk = [];
      let chunkStartTime = null;

      const sortedCandles = [...candles].sort((a, b) => a[0] - b[0]);

      const pushCurrentChunk = () => {
        if (!currentChunk.length || chunkStartTime === null) return;
        const open = currentChunk[0][1];
        const close = currentChunk[currentChunk.length - 1][2];
        const high = Math.max(...currentChunk.map((candle) => candle[4]));
        const low = Math.min(...currentChunk.map((candle) => candle[3]));
        aggregated.push([chunkStartTime, open, close, low, high]);
      };

      sortedCandles.forEach((candle) => {
        if (!Array.isArray(candle) || candle.length < 5) return;
        const timestamp = Number(candle[0]);
        const open = Number(candle[1]);
        const close = Number(candle[2]);
        const low = Number(candle[3]);
        const high = Number(candle[4]);

        if (!Number.isFinite(timestamp)) return;

        const normalizedOpen = Number.isFinite(open) ? open : close;
        const normalizedClose = Number.isFinite(close) ? close : open;
        const normalizedLow = Math.min(
          ...[low, normalizedOpen, normalizedClose].filter((value) => Number.isFinite(value))
        );
        const normalizedHigh = Math.max(
          ...[high, normalizedOpen, normalizedClose].filter((value) => Number.isFinite(value))
        );

        if (
          !Number.isFinite(normalizedOpen) ||
          !Number.isFinite(normalizedClose) ||
          !Number.isFinite(normalizedLow) ||
          !Number.isFinite(normalizedHigh)
        ) {
          return;
        }

        const normalizedCandle = [
          timestamp,
          normalizedOpen,
          normalizedClose,
          normalizedLow,
          normalizedHigh,
        ];

        if (chunkStartTime === null) {
          chunkStartTime = calculateIntervalStart(timestamp, timeframeMinutes);
        }

        if (timestamp < chunkStartTime + timeframeMinutes * 60000) {
          currentChunk.push(normalizedCandle);
        } else {
          pushCurrentChunk();
          currentChunk = [normalizedCandle];
          chunkStartTime = calculateIntervalStart(timestamp, timeframeMinutes);
        }
      });

      pushCurrentChunk();
      return aggregated;
    }

    function createVolumeData(volumes, timeframeMinutes = 15) {
      if (!volumes || volumes.length === 0) return [];

      const aggregatedVolume = [];
      let currentChunk = [];
      let chunkStartTime = null;

      const sortedVolumes = [...volumes].sort((a, b) => a[0] - b[0]);

      sortedVolumes.forEach((volume) => {
        const timestamp = volume[0];
        const volumeValue = volume[1];

        if (chunkStartTime === null) {
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

    function getRangeForTimeframe(minutes, assetType = "asset") {
      const safeMinutes = Math.max(1, Number(minutes) || 15);
      if (safeMinutes <= 30) return "5d";
      return "1mo";
    }

    function getCandleWidths(timeframe, pointCount = 0) {
      const minutes = Math.max(1, Number(timeframe) || 15);
      const points = Math.max(0, Number(pointCount) || 0);

      if (points >= 700) return { min: 1, max: 2 };
      if (points >= 500) return { min: 1, max: 3 };
      if (minutes <= 10) return { min: 1, max: 3 };
      if (minutes <= 15) return { min: 1, max: 4 };
      return { min: 2, max: 8 };
    }

    function clampZoomPercentage(value, fallback = 0) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.min(100, Math.max(0, numeric));
    }

    function normalizeZoomWindow(start, end, fallback = { start: 0, end: 100 }) {
      let normalizedStart = clampZoomPercentage(start, fallback.start);
      let normalizedEnd = clampZoomPercentage(end, fallback.end);

      if (normalizedStart > normalizedEnd) {
        [normalizedStart, normalizedEnd] = [normalizedEnd, normalizedStart];
      }

      if (normalizedEnd - normalizedStart < 0.1) {
        normalizedStart = Math.max(0, normalizedEnd - 0.1);
      }

      return {
        start: Number(normalizedStart.toFixed(2)),
        end: Number(normalizedEnd.toFixed(2)),
      };
    }

    function getTargetVisibleBars(timeframeMinutesValue, chartType) {
      const minutes = Math.max(1, Number(timeframeMinutesValue) || 15);
      if (chartType === "line") {
        if (minutes <= 10) return 260;
        if (minutes <= 15) return 220;
        return 180;
      }
      if (minutes <= 10) return 180;
      if (minutes <= 15) return 150;
      return 120;
    }

    function hasSignificantTimeGaps(timestamps, timeframeMs) {
      const sortedTimestamps = Array.isArray(timestamps)
        ? [...timestamps]
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value))
            .sort((a, b) => a - b)
        : [];

      if (sortedTimestamps.length < 3) return false;

      const gaps = [];
      for (let i = 1; i < sortedTimestamps.length; i += 1) {
        const gap = sortedTimestamps[i] - sortedTimestamps[i - 1];
        if (Number.isFinite(gap) && gap > 0) {
          gaps.push(gap);
        }
      }

      if (gaps.length < 2) return false;

      const sortedGaps = [...gaps].sort((a, b) => a - b);
      const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)];
      const expectedGap = Math.max(1, Number(timeframeMs) || 1, Number(medianGap) || 1);
      const gapAnomalyThreshold = expectedGap * 10;
      const tailGap = gaps[gaps.length - 1];

      const missingIntervals = gaps.reduce((sum, gap) => {
        if (gap <= expectedGap * 1.5) return sum;
        return sum + Math.max(0, Math.round(gap / expectedGap) - 1);
      }, 0);
      const missingRatio =
        missingIntervals / Math.max(1, sortedTimestamps.length + missingIntervals);

      const hasExtremeGap = gaps.some((gap) => gap >= gapAnomalyThreshold);
      const hasSparseTail = tailGap >= expectedGap * 30;

      return missingRatio >= 0.18 || hasExtremeGap || hasSparseTail;
    }

    function getSmartInitialXZoom(totalPoints, timeframeMinutesValue, chartType) {
      const points = Math.max(0, Number(totalPoints) || 0);
      if (points <= 0) return { start: 0, end: 100 };
      if (points <= 90) return { start: 0, end: 100 };

      const targetBars = getTargetVisibleBars(timeframeMinutesValue, chartType);
      const visibleRatio = Math.min(1, Math.max(0.08, targetBars / points));
      return normalizeZoomWindow(100 - visibleRatio * 100, 100, { start: 0, end: 100 });
    }

    function buildZoomContextKey({
      coin,
      timeframe,
      chartType,
      volumeEnabled,
      compressedTimeAxis,
    }) {
      return [
        String(coin || ""),
        String(timeframe || ""),
        String(chartType || ""),
        volumeEnabled ? "volume:1" : "volume:0",
        compressedTimeAxis ? "compressed:1" : "compressed:0",
      ].join("|");
    }

    function readCurrentZoomFromChart() {
      const chart = chartRef.value?.chart || chartRef.value;
      if (!chart?.getOption) return null;

      const option = chart.getOption();
      const zoomEntries = Array.isArray(option?.dataZoom) ? option.dataZoom : [];
      if (!zoomEntries.length) return null;

      const xSlider = zoomEntries.find((entry) => entry?.id === "dz-x-slider");
      const ySlider = zoomEntries.find((entry) => entry?.id === "dz-y-slider");

      return {
        xStart: clampZoomPercentage(xSlider?.start, 0),
        xEnd: clampZoomPercentage(xSlider?.end, 100),
        yStart: clampZoomPercentage(ySlider?.start, 0),
        yEnd: clampZoomPercentage(ySlider?.end, 100),
      };
    }

    function onChartDataZoom() {
      const liveZoomState = readCurrentZoomFromChart();
      if (!liveZoomState) return;

      chartViewportState.value = {
        ...chartViewportState.value,
        ...liveZoomState,
        contextKey: activeZoomContextKey.value,
        isUserAdjusted: true,
      };
    }

    function getVolumeUnitForAsset(assetType) {
      const normalized = String(assetType || "").toLowerCase();
      if (normalized === "stock" || normalized === "etf" || normalized === "fund") {
        return "shares";
      }
      if (normalized === "crypto") {
        return "coins";
      }
      if (normalized === "forex") {
        return "units";
      }
      return "contracts";
    }

    const selectedVolumeUnit = computed(() =>
      getVolumeUnitForAsset(selectedAssetMeta.value?.assetType)
    );

    function formatCompactNumber(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return "0";

      const abs = Math.abs(numeric);
      if (abs >= 1_000_000_000) return `${(numeric / 1_000_000_000).toFixed(1)}B`;
      if (abs >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${(numeric / 1_000).toFixed(1)}K`;
      return `${Math.round(numeric)}`;
    }

    function formatVolumeExact(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return "0";
      if (Math.abs(numeric) >= 1) return Math.round(numeric).toLocaleString();
      return numeric.toFixed(4);
    }

    function sanitizePriceData(prices) {
      if (!Array.isArray(prices)) return [];
      const byTimestamp = new Map();
      prices.forEach((point) => {
        if (!Array.isArray(point) || point.length < 2) return;
        const timestamp = Number(point[0]);
        const value = Number(point[1]);
        if (!Number.isFinite(timestamp) || !Number.isFinite(value) || value <= 0) return;
        byTimestamp.set(timestamp, [timestamp, value]);
      });
      return [...byTimestamp.values()].sort((a, b) => a[0] - b[0]);
    }

    function sanitizeCandleData(candles) {
      if (!Array.isArray(candles)) return [];
      const byTimestamp = new Map();
      candles.forEach((point) => {
        if (!Array.isArray(point) || point.length < 5) return;
        const timestamp = Number(point[0]);
        const open = Number(point[1]);
        const close = Number(point[2]);
        const low = Number(point[3]);
        const high = Number(point[4]);

        if (!Number.isFinite(timestamp)) return;

        const normalizedOpen = Number.isFinite(open) ? open : close;
        const normalizedClose = Number.isFinite(close) ? close : open;
        const normalizedLow = Math.min(
          ...[low, normalizedOpen, normalizedClose].filter((value) => Number.isFinite(value))
        );
        const normalizedHigh = Math.max(
          ...[high, normalizedOpen, normalizedClose].filter((value) => Number.isFinite(value))
        );

        if (
          !Number.isFinite(normalizedOpen) ||
          !Number.isFinite(normalizedClose) ||
          !Number.isFinite(normalizedLow) ||
          !Number.isFinite(normalizedHigh) ||
          normalizedLow <= 0 ||
          normalizedHigh <= 0
        ) {
          return;
        }

        byTimestamp.set(timestamp, [
          timestamp,
          normalizedOpen,
          normalizedClose,
          normalizedLow,
          normalizedHigh,
        ]);
      });
      return [...byTimestamp.values()].sort((a, b) => a[0] - b[0]);
    }

    function sanitizeVolumeData(volumes) {
      if (!Array.isArray(volumes)) return [];
      const byTimestamp = new Map();
      volumes.forEach((point) => {
        if (!Array.isArray(point) || point.length < 2) return;
        const timestamp = Number(point[0]);
        const volume = Number(point[1]);
        if (!Number.isFinite(timestamp)) return;
        byTimestamp.set(timestamp, [timestamp, Number.isFinite(volume) && volume > 0 ? volume : 0]);
      });
      return [...byTimestamp.values()].sort((a, b) => a[0] - b[0]);
    }

    function refreshAggregatedSeries(coin) {
      const prices = rawPriceData.value[coin] || [];
      const candles = rawCandleData.value[coin] || [];
      const volumes = rawVolumeData.value[coin] || [];

      if (selectedChartType.value === "candlestick") {
        cryptoData.value[coin] = candles.length
          ? createOHLCFromCandles(candles, timeframeMinutes.value)
          : createOHLC(prices, timeframeMinutes.value);
      } else {
        cryptoData.value[coin] = createLineData(prices);
      }

      volumeData.value[coin] = createVolumeData(volumes, timeframeMinutes.value);
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
        message: `Price alert set for ${alert.coin.toUpperCase()} at ${alert.price} ${
          selectedAssetCurrency.value
        }`,
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

          const latestPoint = latestData[latestData.length - 1];
          const latestPrice =
            selectedChartType.value === "candlestick"
              ? Number(latestPoint?.[2])
              : Number(latestPoint?.[1]);
          if (!Number.isFinite(latestPrice)) return;
          const priceDiff = Math.abs(latestPrice - alert.price);
          const tolerance = alert.price * 0.005;

          if (priceDiff <= tolerance && !alert.triggered) {
            alert.triggered = true;
            addNotification(alert.coin, alert.price, latestPrice);

            $q.notify({
              type: "warning",
              message: `🚨 ${alert.coin.toUpperCase()} reached ${latestPrice.toFixed(
                2
              )} ${selectedAssetCurrency.value} (Target: ${alert.price} ${
                selectedAssetCurrency.value
              })`,
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

    const mapAssetOption = (asset = {}) => {
      const symbol = String(asset.symbol || asset.value || "").trim();
      const name = String(asset.name || symbol || "Asset").trim();
      const assetType = String(asset.assetType || "asset").toLowerCase();
      const exchange = String(asset.exchange || "").trim();
      const currency = String(asset.currency || "EUR").trim().toUpperCase();

      const typeLabel = ASSET_TYPE_LABELS[assetType] || "Asset";
      const label = asset.label
        || `${name} (${symbol}) - ${typeLabel.toUpperCase()}${exchange ? ` - ${exchange}` : ""}`;

      return {
        label,
        value: symbol,
        symbol,
        name,
        assetType,
        exchange,
        currency,
      };
    };

    async function fetchTopCoins() {
      try {
        const response = await axios.get("http://localhost:3000/api/market/watchlist", {
          params: { limit: 20 },
        });
        const items = Array.isArray(response?.data?.items) ? response.data.items : [];
        const mapped = items.map((item) => mapAssetOption(item)).filter((item) => item.value);

        if (!mapped.length) {
          throw new Error("Empty market watchlist");
        }

        topCoins.value = mapped;
        availableCoins.value = mapped;
        selectedCoin.value = mapped[0].value;
      } catch (error) {
        console.error("Error loading market watchlist:", error);
        topCoins.value = [
          mapAssetOption({
            symbol: "BTC-EUR",
            name: "Bitcoin",
            assetType: "crypto",
            currency: "EUR",
            exchange: "CCC",
          }),
          mapAssetOption({
            symbol: "AAPL",
            name: "Apple",
            assetType: "stock",
            currency: "USD",
            exchange: "NASDAQ",
          }),
          mapAssetOption({
            symbol: "SPY",
            name: "SPDR S&P 500 ETF",
            assetType: "etf",
            currency: "USD",
            exchange: "NYSE",
          }),
          mapAssetOption({
            symbol: "EURUSD=X",
            name: "EUR/USD",
            assetType: "forex",
            currency: "USD",
            exchange: "FX",
          }),
        ];
        availableCoins.value = topCoins.value;
        selectedCoin.value = topCoins.value[0]?.value || null;
        $q.notify({
          type: "warning",
          message: "Market watchlist unavailable, fallback assets loaded",
        });
      }
    }

    async function fetchAllCoins() {
      availableCoins.value = topCoins.value;
    }

    const selectedCoinLabel = computed(() => {
      if (!selectedCoin.value) return "";

      const merged = [...availableCoins.value, ...topCoins.value];
      const selected = merged.find((coin) => coin.value === selectedCoin.value);
      if (selected?.label) return selected.label;

      const fallbackSymbol = selectedAssetMeta.value?.symbol || selectedCoin.value;
      const fallbackName = selectedAssetMeta.value?.name || "";
      if (fallbackName) return `${fallbackName} (${fallbackSymbol})`;
      return String(fallbackSymbol || "").toUpperCase();
    });

    async function filterCoins(val, update, abort) {
      const query = (val || "").trim();
      coinSearchQuery.value = query;

      if (!query) {
        update(() => {
          filteredCoinOptions.value = [];
        });
        if (abort) abort();
        return;
      }

      try {
        const response = await axios.get("http://localhost:3000/api/market/search", {
          params: { q: query, limit: 80 },
        });
        const items = Array.isArray(response?.data?.items) ? response.data.items : [];
        const mapped = items.map((item) => mapAssetOption(item)).filter((item) => item.value);

        update(() => {
          availableCoins.value = mapped;
          filteredCoinOptions.value = mapped;
        });
      } catch (error) {
        console.error("Error searching market assets:", error);
        update(() => {
          filteredCoinOptions.value = [];
        });
        if (abort) abort();
      }
    }

    function onCoinPopupShow() {
      if (!coinSearchQuery.value && coinSelectRef.value) {
        coinSelectRef.value.hidePopup();
      }
    }

    async function fetchData() {
      const coin = selectedCoin.value;
      if (!coin) return;

      const fetchToken = Date.now();
      latestFetchToken.value = fetchToken;
      loading.value = true;

      try {
        const selectedOption = [...availableCoins.value, ...topCoins.value].find(
          (item) => item.value === coin
        );
        const selectedAssetType = String(
          selectedOption?.assetType || selectedAssetMeta.value?.assetType || "asset"
        ).toLowerCase();
        let requestedRange = getRangeForTimeframe(
          Math.max(1, Number(timeframeMinutes.value) || 15),
          selectedAssetType
        );

        let response = await axios.get(
          `http://localhost:3000/api/market/${encodeURIComponent(coin)}`,
          {
            params: {
              range: requestedRange,
              interval: "5m",
            },
          }
        );

        if (latestFetchToken.value !== fetchToken) return;

        let prices = sanitizePriceData(response?.data?.prices);
        let providerCandles = sanitizeCandleData(response?.data?.candles);
        let providerVolumes = sanitizeVolumeData(response?.data?.total_volumes);
        const resolvedRange = String(response?.data?.resolved?.range || "").trim();
        if (resolvedRange) {
          requestedRange = resolvedRange;
        }

        // Additional safety net if provider returns no usable intraday points.
        if (prices.length === 0) {
          const fallbackRange = "1mo";
          const fallbackResponse = await axios.get(
            `http://localhost:3000/api/market/${encodeURIComponent(coin)}`,
            {
              params: {
                range: fallbackRange,
                interval: "15m",
              },
            }
          );

          if (latestFetchToken.value !== fetchToken) return;

          const fallbackPrices = sanitizePriceData(fallbackResponse?.data?.prices);
          if (fallbackPrices.length > prices.length) {
            response = fallbackResponse;
            requestedRange = String(fallbackResponse?.data?.resolved?.range || fallbackRange).trim();
            prices = fallbackPrices;
            providerCandles = sanitizeCandleData(fallbackResponse?.data?.candles);
            providerVolumes = sanitizeVolumeData(fallbackResponse?.data?.total_volumes);
          }
        }

        currentDataRange.value = requestedRange;
        cryptoData.value = {};
        volumeData.value = {};
        rawPriceData.value = {};
        rawCandleData.value = {};
        rawVolumeData.value = {};

        const asset = response?.data?.asset || {};
        selectedAssetMeta.value = {
          symbol: asset.symbol || selectedOption?.symbol || coin,
          name: asset.name || selectedOption?.name || coin.toUpperCase(),
          assetType: String(asset.assetType || selectedOption?.assetType || "asset").toLowerCase(),
          currency: asset.currency || selectedOption?.currency || "EUR",
          exchange: asset.exchange || selectedOption?.exchange || "",
        };

        if (!Array.isArray(prices) || prices.length === 0) {
          throw new Error("No price data returned");
        }
        rawPriceData.value[coin] = prices;
        rawCandleData.value[coin] = providerCandles;
        rawVolumeData.value[coin] = providerVolumes;
        refreshAggregatedSeries(coin);

        checkAlerts();
        updateChart();
      } catch (error) {
        if (latestFetchToken.value !== fetchToken) return;
        console.error("Error loading market data:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load market data",
        });
      } finally {
        if (latestFetchToken.value === fetchToken) {
          loading.value = false;
        }
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
      const timeframeMs = timeframeMinutes.value * 60000;
      const baseSeriesData = Array.isArray(cryptoData.value[coin]) ? cryptoData.value[coin] : [];
      const candleWidths = getCandleWidths(timeframeMinutes.value, baseSeriesData.length);
      const rawVolumeSeries = Array.isArray(volumeData.value[coin]) ? volumeData.value[coin] : [];
      const hasVolumeFromProvider = rawVolumeSeries.some((point) => Number(point?.[1]) > 0);

      const baseTimestamps = baseSeriesData
        .map((point) => Number(point?.[0]))
        .filter((timestamp) => Number.isFinite(timestamp))
        .sort((a, b) => a - b);

      const selectedAssetType = String(selectedAssetMeta.value?.assetType || "asset").toLowerCase();
      const hasSignificantGaps = hasSignificantTimeGaps(baseTimestamps, timeframeMs);
      const shouldCompressCryptoCandles =
        selectedChartType.value === "candlestick"
        && selectedAssetType === "crypto"
        && hasSignificantGaps;
      const compressTimeGapsForSeries =
        selectedChartType.value === "candlestick"
          ? selectedAssetType !== "crypto" || shouldCompressCryptoCandles
          : hasSignificantGaps;
      const categoryTimestamps = compressTimeGapsForSeries ? [...baseTimestamps] : [];
      const pointsForZoom = compressTimeGapsForSeries
        ? categoryTimestamps.length
        : baseTimestamps.length;
      const zoomContextKey = buildZoomContextKey({
        coin,
        timeframe: timeframeMinutes.value,
        chartType: selectedChartType.value,
        volumeEnabled: showVolume.value,
        compressedTimeAxis: compressTimeGapsForSeries,
      });
      activeZoomContextKey.value = zoomContextKey;

      const isSameZoomContext = chartViewportState.value.contextKey === zoomContextKey;
      const smartXZoom = getSmartInitialXZoom(
        pointsForZoom,
        timeframeMinutes.value,
        selectedChartType.value
      );
      const fallbackYZoom = { start: 0, end: 100 };
      const storedXZoom = normalizeZoomWindow(
        chartViewportState.value.xStart,
        chartViewportState.value.xEnd,
        smartXZoom
      );
      const storedYZoom = normalizeZoomWindow(
        chartViewportState.value.yStart,
        chartViewportState.value.yEnd,
        fallbackYZoom
      );
      const useStoredZoom = isSameZoomContext && chartViewportState.value.isUserAdjusted;
      const activeXZoom = useStoredZoom ? storedXZoom : smartXZoom;
      const activeYZoom = useStoredZoom ? storedYZoom : fallbackYZoom;
      const xZoomMinSpan = pointsForZoom
        ? Number(
            Math.max(0.5, Math.min(80, (Math.max(8, timeframeMinutes.value <= 15 ? 12 : 8) / pointsForZoom) * 100)).toFixed(2)
          )
        : 1;

      if (!useStoredZoom) {
        chartViewportState.value = {
          contextKey: zoomContextKey,
          isUserAdjusted: false,
          xStart: activeXZoom.start,
          xEnd: activeXZoom.end,
          yStart: activeYZoom.start,
          yEnd: activeYZoom.end,
        };
      }

      const xAxisMin =
        !compressTimeGapsForSeries && baseTimestamps.length
          ? baseTimestamps[0] - timeframeMs * 0.5
          : undefined;
      const xAxisMax =
        !compressTimeGapsForSeries && baseTimestamps.length
          ? baseTimestamps[baseTimestamps.length - 1] + timeframeMs * 0.5
          : undefined;

      const markLineData = [];
      priceAlerts.value
        .filter((alert) => alert.coin === coin && alert.active)
        .forEach((alert) => {
          markLineData.push({
            yAxis: alert.price,
            name: `Alert: ${alert.price} ${selectedAssetCurrency.value}`,
            lineStyle: {
              color: alert.triggered ? "#10b981" : "#ef4444",
              type: "dashed",
              width: 2,
            },
            label: {
              formatter: `Alert: ${alert.price} ${selectedAssetCurrency.value}`,
              position: "end",
            },
          });
        });

      const candleDirectionByTimestamp = new Map();
      if (selectedChartType.value === "candlestick" && Array.isArray(cryptoData.value[coin])) {
        cryptoData.value[coin].forEach((candle) => {
          if (!Array.isArray(candle) || candle.length < 3) return;
          candleDirectionByTimestamp.set(candle[0], Number(candle[2]) >= Number(candle[1]));
        });
      }

      const candleSeriesData = compressTimeGapsForSeries
        ? baseSeriesData.map((point) => [point[1], point[2], point[3], point[4]])
        : baseSeriesData;
      const lineSeriesData = compressTimeGapsForSeries
        ? baseSeriesData.map((point) => {
            const value = Number(point?.[1]);
            return Number.isFinite(value) ? value : null;
          })
        : baseSeriesData;

      if (selectedChartType.value === "candlestick") {
        series.push({
          name: coin.toUpperCase(),
          type: "candlestick",
          data: candleSeriesData,
          barMinWidth: candleWidths.min,
          barMaxWidth: candleWidths.max,
          itemStyle: {
            color: "#10b981",
            color0: "#ef4444",
            borderColor: "#10b981",
            borderColor0: "#ef4444",
            borderWidth: 1.2,
          },
          markLine:
            markLineData.length > 0 ? { data: markLineData, symbol: "none" } : undefined,
        });
      } else {
        series.push({
          name: coin.toUpperCase(),
          type: "line",
          data: lineSeriesData,
          symbol: "none",
          lineStyle: { color: color, width: 3 },
          itemStyle: { color: color },
          markLine:
            markLineData.length > 0 ? { data: markLineData, symbol: "none" } : undefined,
        });
      }

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
            let normalizedIndicatorData = indicatorData;
            if (compressTimeGapsForSeries) {
              const indicatorByTimestamp = new Map(
                indicatorData
                  .filter((point) => Array.isArray(point) && point.length >= 2)
                  .map((point) => [Number(point[0]), Number(point[1])])
                  .filter(
                    ([timestamp, value]) =>
                      Number.isFinite(timestamp) && Number.isFinite(value)
                  )
              );

              normalizedIndicatorData = categoryTimestamps.map((timestamp) => {
                const value = Number(indicatorByTimestamp.get(timestamp));
                return Number.isFinite(value) ? value : null;
              });
            }

            series.push({
              name: `${coin.toUpperCase()} ${indicator.toUpperCase()}`,
              type: "line",
              data: normalizedIndicatorData,
              symbol: "none",
              connectNulls: false,
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

      if (showVolume.value && volumeData.value[coin]) {
        const volumeMap = new Map(
          rawVolumeSeries.map((point) => [Number(point?.[0]), Number(point?.[1]) || 0])
        );

        const alignedTimestamps =
          compressTimeGapsForSeries
            ? categoryTimestamps
            : selectedChartType.value === "candlestick"
              ? baseSeriesData.map((point) => Number(point?.[0]))
              : rawVolumeSeries.map((point) => Number(point?.[0]));

        const uniqueTimestamps = [...new Set(alignedTimestamps)]
          .filter((timestamp) => Number.isFinite(timestamp))
          .sort((a, b) => a - b);

        const volumeSeriesData = uniqueTimestamps.map((timestamp) => {
          const volume = Number(volumeMap.get(timestamp));
          const normalizedVolume = Number.isFinite(volume) && volume > 0 ? volume : 0;
          const isUpCandle = candleDirectionByTimestamp.get(timestamp);
          const barColor =
            isUpCandle === true
              ? "rgba(16, 185, 129, 0.55)"
              : isUpCandle === false
                ? "rgba(239, 68, 68, 0.55)"
                : "rgba(99, 102, 241, 0.45)";

          return {
            value: compressTimeGapsForSeries ? normalizedVolume : [timestamp, normalizedVolume],
            itemStyle: {
              color: hasVolumeFromProvider ? barColor : "rgba(107, 114, 128, 0.25)",
              borderRadius: [2, 2, 0, 0],
            },
          };
        });

        series.push({
          name: `${coin.toUpperCase()} Volume`,
          type: "bar",
          data: volumeSeriesData,
          xAxisIndex: 1,
          yAxisIndex: 1,
          barMinWidth: candleWidths.min,
          barMaxWidth: candleWidths.max,
          emphasis: {
            itemStyle: {
              opacity: 0.9,
            },
          },
        });
      }

      const gridConfig = showVolume.value
        ? [
            {
              left: "6%",
              right: "4%",
              top: "12%",
              bottom: "30%",
              containLabel: false,
            },
            {
              left: "6%",
              right: "4%",
              top: "70%",
              bottom: "12%",
              containLabel: false,
            },
          ]
        : [
            {
              left: "6%",
              right: "4%",
              top: "12%",
              bottom: "16%",
              containLabel: false,
            },
          ];

      const isDark = $q.dark.isActive;
      const textColor = isDark ? "#ffffff" : "#374151";
      const axisLabelColor = isDark ? "#d1d5db" : "#6b7280";
      const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)";
      const backgroundColor = isDark ? "#121212" : "#ffffff";
      const tooltipBackground = isDark ? "#1e1e1e" : "#ffffff";
      const tooltipBorderColor = isDark ? "#333333" : "#e2e8f0";

      const formatAxisDate = (value) => {
        const timestamp = Number(value);
        if (!Number.isFinite(timestamp)) return "";

        const date = new Date(timestamp);
        if (currentDataRange.value !== "1d") {
          return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")} ${date
            .getHours()
            .toString()
            .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
        }

        return `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      };

      const xAxisConfig = showVolume.value
        ? compressTimeGapsForSeries
          ? [
              {
                type: "category",
                gridIndex: 0,
                data: categoryTimestamps,
                boundaryGap: true,
                axisLine: {
                  onZero: false,
                  lineStyle: { color: gridColor },
                },
                splitLine: {
                  show: true,
                  lineStyle: { color: gridColor, type: "dashed" },
                },
                axisLabel: {
                  formatter: (value) => formatAxisDate(value),
                  color: axisLabelColor,
                  hideOverlap: true,
                },
              },
              {
                type: "category",
                gridIndex: 1,
                data: categoryTimestamps,
                boundaryGap: true,
                axisLine: {
                  onZero: false,
                  lineStyle: { color: gridColor },
                },
                splitLine: {
                  show: true,
                  lineStyle: { color: gridColor, type: "dashed" },
                },
                axisLabel: { show: false, color: axisLabelColor },
              },
            ]
          : [
              {
                type: "time",
                gridIndex: 0,
                min: xAxisMin,
                max: xAxisMax,
                axisLine: {
                  onZero: false,
                  lineStyle: { color: gridColor },
                },
                splitLine: {
                  show: true,
                  lineStyle: { color: gridColor, type: "dashed" },
                },
                minInterval: timeframeMs,
                axisLabel: {
                  formatter: (value) => formatAxisDate(value),
                  color: axisLabelColor,
                  hideOverlap: true,
                },
              },
              {
                type: "time",
                gridIndex: 1,
                min: xAxisMin,
                max: xAxisMax,
                minInterval: timeframeMs,
                axisLine: {
                  onZero: false,
                  lineStyle: { color: gridColor },
                },
                splitLine: {
                  show: true,
                  lineStyle: { color: gridColor, type: "dashed" },
                },
                axisLabel: { show: false, color: axisLabelColor },
              },
            ]
        : compressTimeGapsForSeries
          ? {
              type: "category",
              data: categoryTimestamps,
              boundaryGap: true,
              axisLine: {
                onZero: false,
                lineStyle: { color: gridColor },
              },
              splitLine: {
                show: true,
                lineStyle: { color: gridColor, type: "dashed" },
              },
              axisLabel: {
                formatter: (value) => formatAxisDate(value),
                color: axisLabelColor,
                hideOverlap: true,
              },
            }
          : {
              type: "time",
              min: xAxisMin,
              max: xAxisMax,
              axisLine: {
                onZero: false,
                lineStyle: { color: gridColor },
              },
              splitLine: {
                show: true,
                lineStyle: { color: gridColor, type: "dashed" },
              },
              minInterval: timeframeMs,
              axisLabel: {
                formatter: (value) => formatAxisDate(value),
                color: axisLabelColor,
                hideOverlap: true,
              },
            };

      chartOptions.value = {
        backgroundColor,
        animation: baseSeriesData.length < 800,
        animationDurationUpdate: baseSeriesData.length < 800 ? 180 : 80,
        animationEasingUpdate: "cubicOut",
        tooltip: {
          trigger: "axis",
          backgroundColor: tooltipBackground,
          borderColor: tooltipBorderColor,
          textStyle: {
            color: textColor,
          },
          axisPointer: {
            type: "cross",
            lineStyle: { color: isDark ? "#9ca3af" : "#7581BD", width: 1 },
          },
          formatter: (params) => {
            if (!Array.isArray(params) || !params.length) return "";

            const axisValueTimestamp = Number(params[0]?.axisValue);
            let tooltipTimestamp = Number.isFinite(axisValueTimestamp) ? axisValueTimestamp : null;
            if (!Number.isFinite(tooltipTimestamp)) {
              const firstValue = params[0]?.value;
              if (Array.isArray(firstValue) && Number.isFinite(Number(firstValue[0]))) {
                tooltipTimestamp = Number(firstValue[0]);
              } else {
                const parsed = Date.parse(String(params[0]?.axisValue || ""));
                tooltipTimestamp = Number.isFinite(parsed) ? parsed : null;
              }
            }

            const date = Number.isFinite(tooltipTimestamp) ? new Date(tooltipTimestamp) : null;
            const dateStr = date
              ? `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}.${date.getFullYear()} ${date
                  .getHours()
                  .toString()
                  .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
              : "Time n/a";

            let result = `<div style="font-weight: bold; margin-bottom: 5px;">${dateStr}</div>`;
            params.forEach((item) => {
              if (item.seriesName.includes("Volume")) {
                const rawVolume = Array.isArray(item.value)
                  ? Number(item.value[1] ?? item.value[0])
                  : Number(item.value);

                result += `<div style="margin: 2px 0;">
                  <strong>${item.seriesName}</strong><br>
                  ${
                    Number.isFinite(rawVolume) && rawVolume > 0
                      ? `Volume: <strong>${formatVolumeExact(rawVolume)} ${
                          selectedVolumeUnit.value
                        }</strong> (${formatCompactNumber(rawVolume)})`
                      : "Volume: <strong>No provider data</strong>"
                  }
                </div>`;
              } else if (
                selectedChartType.value === "candlestick" &&
                Array.isArray(item.value) &&
                item.value.length >= 4 &&
                !item.seriesName.includes("EMA") &&
                !item.seriesName.includes("SMA")
              ) {
                const open = Number(item.value[item.value.length >= 5 ? 1 : 0]);
                const close = Number(item.value[item.value.length >= 5 ? 2 : 1]);
                const low = Number(item.value[item.value.length >= 5 ? 3 : 2]);
                const high = Number(item.value[item.value.length >= 5 ? 4 : 3]);

                if (
                  !Number.isFinite(open) ||
                  !Number.isFinite(close) ||
                  !Number.isFinite(low) ||
                  !Number.isFinite(high)
                ) {
                  return;
                }

                const isUp = close >= open;
                const arrow = isUp ? "UP" : "DOWN";
                const candleColor = isUp ? "#10b981" : "#ef4444";

                result += `<div style="color: ${candleColor}; margin: 2px 0;">
                  <strong>${item.seriesName}</strong> ${arrow}<br>
                  O: <strong>${selectedAssetCurrency.value} ${open.toFixed(2)}</strong> |
                  H: <strong>${selectedAssetCurrency.value} ${high.toFixed(2)}</strong><br>
                  C: <strong>${selectedAssetCurrency.value} ${close.toFixed(2)}</strong> |
                  L: <strong>${selectedAssetCurrency.value} ${low.toFixed(2)}</strong>
                </div>`;
              } else if (item.value !== undefined && !item.seriesName.includes("Volume")) {
                const numericValue = Array.isArray(item.value)
                  ? Number(item.value[1] ?? item.value[0])
                  : Number(item.value);

                if (!Number.isFinite(numericValue)) return;

                const value = `${selectedAssetCurrency.value} ${numericValue.toFixed(2)}`;
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
            color: textColor,
          },
        },
        axisPointer: {
          link: [{ xAxisIndex: "all" }],
          snap: selectedChartType.value === "candlestick",
        },
        grid: gridConfig,
        xAxis: xAxisConfig,
        yAxis: showVolume.value
          ? [
              {
                type: "value",
                name: selectedAssetCurrency.value,
                scale: true,
                gridIndex: 0,
                axisLine: {
                  lineStyle: { color: gridColor },
                },
                splitLine: {
                  show: true,
                  lineStyle: { color: gridColor, type: "dashed" },
                },
                axisLabel: {
                  formatter: (value) =>
                    `${selectedAssetCurrency.value} ${Number(value).toLocaleString()}`,
                  color: axisLabelColor,
                },
                nameTextStyle: {
                  color: axisLabelColor,
                },
              },
              {
                type: "value",
                gridIndex: 1,
                axisLine: {
                  lineStyle: { color: gridColor },
                },
                splitLine: {
                  show: true,
                  lineStyle: { color: gridColor, type: "dashed" },
                },
                axisLabel: {
                  show: false,
                },
                nameTextStyle: {
                  color: axisLabelColor,
                },
              },
            ]
          : {
              type: "value",
              name: selectedAssetCurrency.value,
              scale: true,
              axisLine: {
                lineStyle: { color: gridColor },
              },
              splitLine: {
                show: true,
                lineStyle: { color: gridColor, type: "dashed" },
              },
              axisLabel: {
                formatter: (value) =>
                  `${selectedAssetCurrency.value} ${Number(value).toLocaleString()}`,
                color: axisLabelColor,
              },
              nameTextStyle: {
                color: axisLabelColor,
              },
            },
        dataZoom: [
          {
            id: "dz-x-slider",
            type: "slider",
            xAxisIndex: showVolume.value ? [0, 1] : [0],
            filterMode: "filter",
            start: activeXZoom.start,
            end: activeXZoom.end,
            minSpan: xZoomMinSpan,
            bottom: showVolume.value ? "4%" : "8%",
            height: 18,
            backgroundColor,
            borderColor: gridColor,
            dataBackground: {
              lineStyle: { color: gridColor },
              areaStyle: {
                color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              },
            },
            textStyle: { color: axisLabelColor },
          },
          {
            id: "dz-x-inside",
            type: "inside",
            xAxisIndex: showVolume.value ? [0, 1] : [0],
            filterMode: "filter",
            start: activeXZoom.start,
            end: activeXZoom.end,
            minSpan: xZoomMinSpan,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: true,
          },
          {
            id: "dz-y-inside",
            type: "inside",
            yAxisIndex: [0],
            filterMode: "none",
            start: activeYZoom.start,
            end: activeYZoom.end,
            zoomOnMouseWheel: "shift",
            moveOnMouseMove: false,
            moveOnMouseWheel: "shift",
          },
          {
            id: "dz-y-slider",
            type: "slider",
            yAxisIndex: [0],
            filterMode: "none",
            start: activeYZoom.start,
            end: activeYZoom.end,
            right: "0.8%",
            top: showVolume.value ? "12%" : "12%",
            bottom: showVolume.value ? "30%" : "16%",
            width: 12,
            showDetail: false,
            showDataShadow: false,
            backgroundColor,
            borderColor: gridColor,
            fillerColor: isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.14)",
            dataBackground: {
              lineStyle: { color: gridColor },
              areaStyle: {
                color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              },
            },
            handleStyle: {
              color: isDark ? "#94a3b8" : "#64748b",
              borderColor: gridColor,
            },
          },
        ],
        series,
      };
    }
    watch(selectedCoin, (newCoin, oldCoin) => {
      if (newCoin !== oldCoin) {
        coinSearchQuery.value = "";
        filteredCoinOptions.value = [];
        fetchData();
      }
    });

    watch(
      [selectedChartType, showVolume, selectedIndicators],
      () => {
        if (selectedCoin.value) {
          if (rawPriceData.value[selectedCoin.value]) {
            refreshAggregatedSeries(selectedCoin.value);
          }
          updateChart();
        }
      },
      { deep: true }
    );

    watch(timeframeMinutes, () => {
      if (selectedCoin.value) {
        fetchData();
      }
    });

    watch(
      () => $q.dark.isActive,
      () => {
        if (selectedCoin.value) {
          updateChart();
        }
      }
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
      filteredCoinOptions,
      coinSearchQuery,
      coinSelectRef,
      topCoins,
      selectedCoin,
      selectedCoinLabel,
      selectedAssetTypeLabel,
      selectedAssetCurrency,
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
      filterCoins,
      onCoinPopupShow,
      fetchData,
      chartRef,
      onChartDataZoom,
      timeframeOptions,
      timeframeMinutes,
      toggleDarkMode,
    };
  },
});
</script>

<template>
  <div class="modern-dashboard" :class="{ 'modern-dashboard--dark': $q.dark.isActive }">
    <div class="dark-mode-toggle">
      <q-btn
        round
        :color="$q.dark.isActive ? 'grey-9' : 'yellow'"
        :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
        class="toggle-btn"
        @click="toggleDarkMode"
        size="lg"
      />
    </div>

    <div class="dashboard-header">
      <div class="header-content">
        <h1>Market Analysis</h1>
        <p>Real-time data for crypto, stocks, ETFs, indices and FX</p>
      </div>
      <div class="header-actions">
        <q-btn
          icon="refresh"
          round
          flat
          @click="fetchData"
          :disable="!selectedCoin || loading"
        >
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>
        <q-btn
          icon="notifications"
          round
          flat
          color="red"
          @click="showAlertDialog = true"
          :disable="!selectedCoin"
        >
          <q-tooltip>Create Alert</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="quick-stats">
      <div class="stat-card selected-coin">
        <div class="stat-icon">
          <q-icon name="query_stats" />
        </div>
        <div class="stat-content">
          <div class="stat-value" v-if="selectedCoin">
            {{ selectedCoin }}
          </div>
          <div class="stat-value" v-else>None</div>
          <div class="stat-label">
            Selected {{ selectedAssetTypeLabel }} ({{ selectedAssetCurrency }})
          </div>
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

    <q-card class="controls-card">
      <q-card-section>
        <div class="row q-gutter-md items-center controls-row">
          <q-select
            ref="coinSelectRef"
            v-model="selectedCoin"
            :options="filteredCoinOptions"
            :display-value="selectedCoinLabel"
            use-input
            hide-selected
            fill-input
            input-debounce="300"
            @filter="filterCoins"
            @popup-show="onCoinPopupShow"
            label="Select Market Asset"
            emit-value
            map-options
            filled
            class="coin-select"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{
                    coinSearchQuery
                      ? "Kein Asset gefunden."
                      : "Tippe, um nach Crypto, Aktien, ETFs oder FX zu suchen."
                  }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="selectedChartType"
            :options="chartTypes"
            label="Chart Type"
            emit-value
            map-options
            filled
          />

          <q-select
            v-model="timeframeMinutes"
            :options="timeframeOptions"
            label="Timeframe"
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
          >
            <template v-slot:prepend>
              <span class="indicator-select-marker" aria-hidden="true">📈</span>
            </template>
          </q-select>

          <q-toggle v-model="showVolume" label="Show Volume" color="primary" />

          <q-space />

          <div class="col-auto nav-action-group">
            <q-btn
              class="pill-nav-btn"
              label="Financial Dashboard"
              color="primary"
              icon="analytics"
              to="/chart"
              outline
            />
            <q-btn
              class="pill-nav-btn"
              label="Paper Trading"
              color="teal"
              icon="edit_note"
              to="/paper-trading"
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

    <div
      v-if="selectedCoin && priceAlerts.filter((a) => a.coin === selectedCoin).length > 0"
      class="alerts-section"
    >
      <q-card class="alerts-card">
        <q-card-section>
          <div class="text-subtitle2 q-mb-xs">
            Active Price Alerts for {{ selectedCoinLabel }}:
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
              {{ alert.price }} {{ selectedAssetCurrency }}
              <q-tooltip v-if="alert.triggered">Alert triggered!</q-tooltip>
            </q-chip>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="chart-container">
      <div class="chart-header">
        <h3 v-if="selectedCoin">
          {{ selectedCoinLabel }} - Market Analysis
        </h3>
        <h3 v-else>Select an asset to view market analysis</h3>
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
          ref="chartRef"
          class="main-chart"
          :option="chartOptions"
          autoresize
          :loading="loading"
          @datazoom="onChartDataZoom"
        />
      </div>
    </div>

    <q-dialog v-model="showAlertDialog" persistent>
      <q-card class="alert-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Create Price Alert</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-y-md">
            <div class="alert-coin-info">
              <div class="text-subtitle2">Selected Asset:</div>
              <div class="text-h6 text-primary">
                {{ selectedCoin ? selectedCoinLabel : "None" }}
              </div>
            </div>

            <q-input
              v-model="newAlertPrice"
              :label="`Target Price (${selectedAssetCurrency})`"
              type="number"
              filled
              placeholder="e.g., 150.00"
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

    .controls-row {
      width: 100%;
    }

    .coin-select {
      min-width: 300px;
      max-width: 100%;
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

    .indicator-select-marker {
      font-size: 1.05rem;
      line-height: 1;
      opacity: 0.9;
      user-select: none;
    }
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

  .alert-dialog-card {
    min-width: min(400px, 92vw);
  }
}

.modern-dashboard.modern-dashboard--dark {
  background: #121212 !important;

  .dashboard-header {
    background: linear-gradient(
      135deg,
      rgba(30, 30, 30, 0.9) 0%,
      rgba(18, 18, 18, 0.8) 100%
    ) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;

    .header-content h1 {
      background: linear-gradient(45deg, #8baafe, #a67fce) !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      color: transparent !important;
    }

    .header-content p {
      color: #ffffff !important;
    }

    .header-actions .q-btn {
      background: rgba(30, 30, 30, 0.7) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #ffffff !important;
    }

    .header-actions .q-btn:hover {
      background: rgba(30, 30, 30, 0.9) !important;
    }
  }

  .quick-stats .stat-card {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;

    .stat-content .stat-value {
      color: #ffffff !important;
    }

    .stat-content .stat-label {
      color: #b0b0b0 !important;
    }

    .stat-icon {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    .stat-icon .q-icon {
      color: #ffffff !important;
    }
  }

  .controls-card,
  .alerts-card,
  .chart-container,
  .alert-dialog-card {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    color: #ffffff !important;
  }

  .controls-card .pill-nav-btn {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }

  .controls-card .indicator-select-marker {
    opacity: 1;
  }

  .alert-coin-info {
    background: rgba(255, 255, 255, 0.05) !important;
  }

  .chart-container .chart-header h3,
  .chart-container .chart-header .legend-item,
  .controls-card .q-toggle,
  .controls-card .q-toggle__label,
  .controls-card .text-caption,
  .alerts-card .text-subtitle2,
  .alerts-card .text-body2,
  .alert-dialog-card .text-h6,
  .alert-dialog-card .text-subtitle2,
  .alert-dialog-card .text-caption {
    color: #ffffff !important;
  }

  .controls-card :deep(.q-field__label),
  .controls-card :deep(.q-field__native),
  .controls-card :deep(.q-field__marginal),
  .controls-card :deep(.q-select__dropdown-icon),
  .alert-dialog-card :deep(.q-field__label),
  .alert-dialog-card :deep(.q-field__native),
  .alert-dialog-card :deep(.q-field__marginal),
  .alert-dialog-card :deep(.q-select__dropdown-icon),
  :deep(.q-field--filled) .q-field__label,
  :deep(.q-field--filled) .q-field__native,
  :deep(.q-btn) {
    color: #ffffff !important;
  }

  .controls-card :deep(.q-field__control),
  .alert-dialog-card :deep(.q-field__control),
  :deep(.q-field--filled) .q-field__control {
    background: rgba(255, 255, 255, 0.05) !important;
  }

  .controls-card :deep(.q-field__control:before),
  .alert-dialog-card :deep(.q-field__control:before),
  :deep(.q-field--filled) .q-field__control:before {
    border-color: rgba(255, 255, 255, 0.2) !important;
  }

  :deep(.q-btn--outline) {
    border-color: rgba(255, 255, 255, 0.3) !important;
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

    .controls-card {
      .controls-row {
        gap: 10px !important;
      }

      .controls-row > * {
        width: 100%;
      }

      .controls-row .q-space {
        display: none;
      }

      .coin-select,
      .nav-action-group {
        min-width: 0 !important;
      }
    }

    .chart-wrapper {
      height: 400px;
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
</style>

