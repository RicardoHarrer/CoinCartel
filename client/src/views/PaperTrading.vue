<template>
  <q-page :class="['paper-page q-pa-md', isDark ? 'paper-page--dark' : 'paper-page--light']">
    <div class="paper-shell">
      <div class="dark-mode-toggle">
        <q-btn
          round
          :color="$q.dark.isActive ? 'grey-9' : 'yellow-9'"
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
          class="toggle-btn"
          @click="toggleDarkMode"
        />
      </div>

      <section class="hero-card">
        <div>
          <div class="eyebrow">Paper Trading</div>
          <h1>Crypto Dashboard</h1>
          <p>Market, limit and stop orders with portfolio, history and live chart.</p>
        </div>
        <div class="hero-metrics">
          <div class="metric-box">
            <span>Balance</span><strong>{{ formatCurrency(balance) }}</strong>
          </div>
          <div class="metric-box">
            <span>Equity</span
            ><strong :class="equityChangePct >= 0 ? 'text-positive' : 'text-negative'">{{
              formatCurrency(totalEquity)
            }}</strong>
          </div>
          <div class="metric-box">
            <span>P/L</span
            ><strong :class="unrealizedPL >= 0 ? 'text-positive' : 'text-negative'">{{
              formatCurrency(unrealizedPL)
            }}</strong>
          </div>
          <q-btn
            flat
            round
            :color="isDark ? 'white' : 'grey-9'"
            icon="notifications"
            @click="toggleNotificationsPanel"
          >
            <q-badge v-if="unreadNotifications.length" color="negative" floating rounded>{{
              unreadNotifications.length
            }}</q-badge>
          </q-btn>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="surface-card side-card">
          <div class="section-title">Watchlist</div>
          <q-select
            v-model="selectedCoin"
            :options="coins"
            emit-value
            map-options
            dense
            :dark="isDark"
            outlined
            label="Select coin"
            class="paper-field q-mt-md q-mb-md"
          />
          <q-scroll-area style="height: 460px">
            <q-list separator>
              <q-item
                v-for="coin in coins.slice(0, 15)"
                :key="coin.value"
                clickable
                class="list-item"
                :class="{ active: selectedCoin === coin.value }"
                @click="selectedCoin = coin.value"
              >
                <q-item-section>
                  <q-item-label>{{ coin.label }}</q-item-label>
                  <q-item-label caption>{{
                    latestPriceFor(coin.value) != null
                      ? formatCurrency(latestPriceFor(coin.value))
                      : 'No data'
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <span
                    :class="getPriceChange(coin.value) >= 0 ? 'text-positive' : 'text-negative'"
                    >{{ signedPercent(getPriceChangePercent(coin.value)) }}</span
                  >
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </section>

        <section class="surface-card chart-card">
          <div class="toolbar">
            <div>
              <div class="section-title">{{ selectedCoinLabel }}</div>
              <div class="section-subtitle">
                Live {{ livePrice != null ? formatCurrency(livePrice) : 'No data' }}
              </div>
            </div>
            <div class="toolbar-actions">
              <q-btn color="primary" icon="add" label="New trade" @click="showTradeDialog = true" />
              <q-btn
                flat
                :color="isDark ? 'white' : 'grey-9'"
                icon="cached"
                label="Refresh"
                :loading="loading"
                @click="refreshNow"
              />
            </div>
          </div>

          <div class="toolbar-actions q-my-md">
            <q-btn-toggle
              v-model="chartType"
              dense
              toggle-color="primary"
              :text-color="isDark ? 'grey-4' : 'grey-7'"
              :class="['paper-toggle', isDark ? 'paper-toggle--dark' : 'paper-toggle--light']"
              :options="[
                { label: 'Candlestick', value: 'candlestick' },
                { label: 'Line', value: 'line' },
              ]"
            />
            <q-btn-toggle
              v-model="timeframe"
              dense
              toggle-color="primary"
              :text-color="isDark ? 'grey-4' : 'grey-7'"
              :class="['paper-toggle', isDark ? 'paper-toggle--dark' : 'paper-toggle--light']"
              :options="[
                { label: '15m', value: 15 },
                { label: '1h', value: 60 },
                { label: '4h', value: 240 },
                { label: '1d', value: 1440 },
              ]"
            />
          </div>

          <v-chart :option="chartOptions" autoresize class="chart-canvas" @click="onChartClick" />

          <div class="toolbar-actions q-mt-md">
            <q-chip outline color="primary">Equity {{ formatCurrency(totalEquity) }}</q-chip>
            <q-chip :color="equityChangePct >= 0 ? 'positive' : 'negative'">{{
              signedPercent(equityChangePct)
            }}</q-chip>
            <q-chip
              outline
              :color="isDark ? 'grey-3' : 'grey-8'"
              :text-color="isDark ? 'grey-3' : 'grey-8'"
            >
              Refresh {{ Math.round(refreshProgress) }}%
            </q-chip>
          </div>
        </section>

        <section class="surface-card side-card">
          <q-tabs
            v-model="activeTab"
            dense
            :class="isDark ? 'text-grey-3' : 'text-grey-9'"
            active-color="primary"
            indicator-color="primary"
          >
            <q-tab name="new" label="Trade" />
            <q-tab name="positions" label="Positions" />
            <q-tab name="orders" label="Orders" />
            <q-tab name="history" label="History" />
          </q-tabs>

          <q-separator :dark="isDark" class="q-my-md" />

          <q-tab-panels
            v-model="activeTab"
            animated
            class="bg-transparent"
            :class="isDark ? 'text-white' : 'text-grey-10'"
          >
            <q-tab-panel name="new" class="q-pa-none">
              <q-form @submit.prevent="onPlaceOrder">
                <div class="form-grid">
                  <q-select
                    v-model="tradeForm.coin"
                    :options="coins"
                    emit-value
                    map-options
                    dense
                    :dark="isDark"
                    outlined
                    label="Coin"
                    class="paper-field"
                  />
                  <q-select
                    v-model="tradeForm.side"
                    :options="sideOptions"
                    dense
                    :dark="isDark"
                    outlined
                    label="Side"
                    class="paper-field"
                  />
                  <q-select
                    v-model="tradeForm.type"
                    :options="orderTypeOptions"
                    dense
                    :dark="isDark"
                    outlined
                    label="Order Type"
                    class="paper-field"
                  />
                  <q-input
                    v-model.number="tradeForm.amount"
                    dense
                    :dark="isDark"
                    outlined
                    type="number"
                    step="0.001"
                    label="Amount"
                    class="paper-field"
                  />
                </div>
                <div class="toolbar q-mt-sm">
                  <div class="section-subtitle">{{ availabilityLabel }}</div>
                  <div class="toolbar-actions">
                    <q-btn
                      flat
                      dense
                      :color="isDark ? 'grey-3' : 'grey-8'"
                      label="25%"
                      @click="setAmountPercentage(0.25)"
                    />
                    <q-btn
                      flat
                      dense
                      :color="isDark ? 'grey-3' : 'grey-8'"
                      label="50%"
                      @click="setAmountPercentage(0.5)"
                    />
                    <q-btn
                      flat
                      dense
                      :color="isDark ? 'grey-3' : 'grey-8'"
                      label="100%"
                      @click="setAmountPercentage(1)"
                    />
                  </div>
                </div>
                <q-input
                  v-if="tradeForm.type !== 'market'"
                  v-model.number="tradeForm.price"
                  dense
                  :dark="isDark"
                  outlined
                  type="number"
                  step="0.01"
                  class="paper-field q-mt-sm"
                  :label="tradeForm.type === 'limit' ? 'Limit Preis (EUR)' : 'Stop Preis (EUR)'"
                />
                <div class="form-grid q-mt-sm">
                  <q-input
                    v-model.number="tradeForm.stopLoss"
                    dense
                    :dark="isDark"
                    outlined
                    type="number"
                    step="0.01"
                    label="Stop-Loss (EUR)"
                    class="paper-field"
                  />
                  <q-input
                    v-model.number="tradeForm.takeProfit"
                    dense
                    :dark="isDark"
                    outlined
                    type="number"
                    step="0.01"
                    label="Take-Profit (EUR)"
                    class="paper-field"
                  />
                </div>
                <div class="summary-box q-mt-md">
                  <span>Total cost</span><strong>{{ formatCurrency(calculateTotalCost()) }}</strong>
                </div>
                <div class="toolbar-actions q-mt-lg">
                  <q-btn
                    flat
                    :color="isDark ? 'grey-3' : 'grey-8'"
                    label="Reset"
                    @click="resetTradeForm"
                  />
                  <q-btn
                    color="primary"
                    :disable="!isFormValid"
                    :label="tradeForm.side === 'buy' ? 'Buy' : 'Sell'"
                    @click="onPlaceOrder"
                  />
                </div>
              </q-form>
            </q-tab-panel>

            <q-tab-panel name="positions" class="q-pa-none">
              <div v-if="!positions.length" class="empty-state">No open positions</div>
              <q-scroll-area v-else style="height: 420px"
                ><q-list separator>
                  <q-item v-for="position in positions" :key="position.id" class="list-item">
                    <q-item-section>
                      <q-item-label>{{ position.coin.toUpperCase() }}</q-item-label>
                      <q-item-label caption
                        >Entry {{ formatCurrency(position.entryPrice) }} - Amount
                        {{ position.amount }}</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      <div :class="posPL(position) >= 0 ? 'text-positive' : 'text-negative'">
                        {{ formatSignedCurrency(posPL(position)) }}
                      </div>
                      <q-btn
                        flat
                        dense
                        color="negative"
                        icon="close"
                        @click="closePosition(position.id)"
                      />
                    </q-item-section>
                  </q-item> </q-list
              ></q-scroll-area>
            </q-tab-panel>

            <q-tab-panel name="orders" class="q-pa-none">
              <div v-if="!orders.length" class="empty-state">No open orders</div>
              <q-scroll-area v-else style="height: 420px"
                ><q-list separator>
                  <q-item v-for="order in orders" :key="order.id" class="list-item">
                    <q-item-section>
                      <q-item-label
                        >{{ order.side.toUpperCase() }} {{ order.coin.toUpperCase() }}</q-item-label
                      >
                      <q-item-label caption
                        >{{ order.type.toUpperCase() }} - {{ order.amount
                        }}<span v-if="order.limitPrice">
                          @ {{ formatCurrency(order.limitPrice) }}</span
                        ></q-item-label
                      >
                    </q-item-section>
                    <q-item-section side
                      ><q-btn flat dense icon="cancel" @click="cancelOrder(order.id)"
                    /></q-item-section>
                  </q-item> </q-list
              ></q-scroll-area>
            </q-tab-panel>

            <q-tab-panel name="history" class="q-pa-none">
              <div v-if="!tradeHistory.length" class="empty-state">No trades yet</div>
              <q-table
                v-else
                :rows="tradeHistory"
                :columns="historyCols"
                row-key="id"
                dense
                flat
                :dark="isDark"
                :pagination="{ rowsPerPage: 10 }"
                class="history-table"
              />
            </q-tab-panel>
          </q-tab-panels>

          <q-separator :dark="isDark" class="q-my-md" />
          <div class="toolbar-actions">
            <q-btn
              outline
              :color="isDark ? 'grey-3' : 'grey-8'"
              icon="file_download"
              label="Export"
              @click="exportState"
            />
            <q-btn
              outline
              color="secondary"
              icon="file_upload"
              label="Import"
              @click="triggerImport"
            />
            <q-btn flat color="negative" icon="restart_alt" label="Reset" @click="resetAccount" />
          </div>
          <input
            ref="importFileRef"
            type="file"
            accept="application/json"
            class="hidden-input"
            @change="importStateFile"
          />
        </section>
      </div>

      <q-card
        v-if="toggleNotifications && notifications.length"
        class="surface-card notifications-panel"
      >
        <q-card-section class="toolbar"
          ><div class="section-title">Notifications</div>
          <q-btn
            flat
            dense
            round
            :color="isDark ? 'grey-3' : 'grey-8'"
            icon="close"
            @click="toggleNotifications = false"
        /></q-card-section>
        <q-separator :dark="isDark" />
        <q-scroll-area style="height: 300px"
          ><q-list separator>
            <q-item v-for="notification in notifications.slice(0, 10)" :key="notification.id">
              <q-item-section avatar
                ><q-icon
                  :name="notification.type === 'warn' ? 'warning' : 'info'"
                  :color="notification.type === 'warn' ? 'warning' : 'primary'"
              /></q-item-section>
              <q-item-section
                ><q-item-label>{{ notification.msg }}</q-item-label
                ><q-item-label caption>{{
                  formatTime(notification.timestamp)
                }}</q-item-label></q-item-section
              >
            </q-item>
          </q-list></q-scroll-area
        >
      </q-card>

      <q-dialog v-model="confirmClose.show">
        <q-card class="dialog-card">
          <q-card-section
            ><div class="text-h6">Close position</div>
            <div class="text-caption">
              Do you really want to close this position?
            </div></q-card-section
          >
          <q-card-actions align="right"
            ><q-btn flat label="Cancel" v-close-popup /><q-btn
              color="primary"
              label="Close"
              @click="confirmCloseConfirm"
          /></q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showTradeDialog" persistent>
        <q-card class="dialog-card">
          <q-card-section class="dialog-header"
            ><div class="text-h6">New trade</div></q-card-section
          >
          <q-card-section
            ><q-form @submit.prevent="onPlaceOrderAndClose">
              <div class="form-grid">
                <q-select
                  v-model="tradeForm.coin"
                  :options="coins"
                  emit-value
                  map-options
                  dense
                  :dark="isDark"
                  outlined
                  label="Coin"
                  class="paper-field"
                />
                <q-select
                  v-model="tradeForm.side"
                  :options="sideOptions"
                  dense
                  :dark="isDark"
                  outlined
                  label="Side"
                  class="paper-field"
                />
                <q-select
                  v-model="tradeForm.type"
                  :options="orderTypeOptions"
                  dense
                  :dark="isDark"
                  outlined
                  label="Order Type"
                  class="paper-field"
                />
                <q-input
                  v-model.number="tradeForm.amount"
                  dense
                  :dark="isDark"
                  outlined
                  type="number"
                  step="0.001"
                  label="Amount"
                  class="paper-field"
                />
              </div>
              <q-input
                v-if="tradeForm.type !== 'market'"
                v-model.number="tradeForm.price"
                dense
                :dark="isDark"
                outlined
                type="number"
                step="0.01"
                class="paper-field q-mt-sm"
                :label="tradeForm.type === 'limit' ? 'Limit Preis (EUR)' : 'Stop Preis (EUR)'"
              /> </q-form
          ></q-card-section>
          <q-card-actions align="right"
            ><q-btn flat label="Cancel" v-close-popup /><q-btn
              color="primary"
              :disable="!isFormValid"
              label="Place Order"
              @click="onPlaceOrderAndClose"
          /></q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import axios from 'axios';
import { useQuasar } from 'quasar';
import { use } from 'echarts/core';
import VChart from 'vue-echarts';
import { BarChart, CandlestickChart, LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkPointComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([
  CanvasRenderer,
  CandlestickChart,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent,
]);

const STORAGE_KEY = 'paper_trading_state_v5';
const UPDATE_INTERVAL_MS = 15000;

export default defineComponent({
  name: 'PaperTrading',
  components: { VChart },
  setup() {
    const $q = useQuasar();
    const coins = ref([]);
    const selectedCoin = ref('bitcoin');
    const chartType = ref('candlestick');
    const timeframe = ref(15);
    const chartOptions = ref({});
    const loading = ref(false);
    const refreshProgress = ref(0);
    const balance = ref(10000);
    const positions = ref([]);
    const orders = ref([]);
    const tradeHistory = ref([]);
    const notifications = ref([]);
    const rawPriceData = ref({});
    const ohlcData = ref({});
    const volumeData = ref({});
    const livePrice = ref(null);
    const activeTab = ref('new');
    const toggleNotifications = ref(false);
    const showTradeDialog = ref(false);
    const confirmClose = ref({ show: false, positionId: null });
    const importFileRef = ref(null);
    const refreshTimer = ref(null);
    const progressTimer = ref(null);

    const tradeForm = ref({
      coin: 'bitcoin',
      side: 'buy',
      type: 'market',
      amount: 0.01,
      price: null,
      stopLoss: null,
      takeProfit: null,
    });
    const sideOptions = [
      { label: 'Buy', value: 'buy' },
      { label: 'Sell', value: 'sell' },
    ];
    const orderTypeOptions = [
      { label: 'Market', value: 'market' },
      { label: 'Limit', value: 'limit' },
      { label: 'Stop', value: 'stop' },
    ];
    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
    const isDark = computed(() => $q.dark.isActive);
    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);
      document.documentElement.style.transition = 'background-color 0.35s ease, color 0.35s ease';
      setTimeout(() => (document.documentElement.style.transition = ''), 350);
    };

    const selectedCoinLabel = computed(
      () =>
        coins.value.find((coin) => coin.value === selectedCoin.value)?.label ||
        selectedCoin.value ||
        'Kein Coin',
    );
    const unreadNotifications = computed(() =>
      notifications.value.filter((notification) => !notification.read),
    );
    const unrealizedPL = computed(() =>
      positions.value.reduce((sum, position) => sum + posPL(position), 0),
    );
    const totalEquity = computed(() => balance.value + unrealizedPL.value);
    const equityChangePct = computed(() => ((totalEquity.value - 10000) / 10000) * 100);
    const activePosition = computed(() =>
      positions.value.find((position) => position.coin === tradeForm.value.coin),
    );
    const availabilityLabel = computed(() =>
      tradeForm.value.side === 'sell'
        ? `Position: ${activePosition.value?.amount || 0}`
        : `Balance: ${formatCurrency(balance.value)}`,
    );
    const isFormValid = computed(() => {
      if (!tradeForm.value.coin || !tradeForm.value.amount || tradeForm.value.amount <= 0)
        return false;
      if (
        tradeForm.value.type !== 'market' &&
        (!tradeForm.value.price || tradeForm.value.price <= 0)
      )
        return false;
      return true;
    });

    const historyCols = [
      { name: 'type', label: 'Typ', field: 'type', align: 'left' },
      { name: 'coin', label: 'Coin', field: 'coin', align: 'left' },
      { name: 'amount', label: 'Amount', field: 'amount', align: 'right' },
      {
        name: 'entry',
        label: 'Entry',
        field: (row) => formatCurrency(row.entryPrice),
        align: 'right',
      },
      {
        name: 'exit',
        label: 'Exit',
        field: (row) => (row.exitPrice != null ? formatCurrency(row.exitPrice) : '-'),
        align: 'right',
      },
      {
        name: 'profit',
        label: 'P/L',
        field: (row) => (row.profit != null ? formatSignedCurrency(row.profit) : '-'),
        align: 'right',
      },
      {
        name: 'time',
        label: 'Zeit',
        field: (row) => formatTime(row.timestamp),
        align: 'right',
      },
    ];

    const formatCurrency = (value) => formatter.format(Number(value || 0));
    const formatSignedCurrency = (value) =>
      `${Number(value || 0) >= 0 ? '+' : '-'}${formatCurrency(Math.abs(Number(value || 0)))}`;
    const signedPercent = (value) =>
      `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;
    const formatTime = (value) =>
      new Date(value).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    function notify(msg, type = 'info') {
      notifications.value.unshift({
        id: Date.now() + Math.random(),
        msg,
        type,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    const latestPriceFor = (coin) => rawPriceData.value[coin]?.at(-1)?.[1] ?? null;
    const getPriceChange = (coin) => {
      const prices = rawPriceData.value[coin];
      return prices?.length > 1 ? prices[prices.length - 1][1] - prices[prices.length - 2][1] : 0;
    };
    const getPriceChangePercent = (coin) => {
      const prices = rawPriceData.value[coin];
      if (!prices || prices.length < 2 || !prices[prices.length - 2][1]) return 0;
      return (
        ((prices[prices.length - 1][1] - prices[prices.length - 2][1]) /
          prices[prices.length - 2][1]) *
        100
      );
    };

    function saveState() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: balance.value,
          positions: positions.value,
          orders: orders.value,
          tradeHistory: tradeHistory.value,
        }),
      );
    }

    function loadState() {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        balance.value = parsed.balance ?? balance.value;
        positions.value = parsed.positions ?? [];
        orders.value = parsed.orders ?? [];
        tradeHistory.value = parsed.tradeHistory ?? [];
      } catch (error) {
        console.error(error);
      }
    }

    function exportState() {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              balance: balance.value,
              positions: positions.value,
              orders: orders.value,
              tradeHistory: tradeHistory.value,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'paper-trading-export.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    const triggerImport = () => importFileRef.value?.click();

    function importStateFile(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(String(e.target?.result || '{}'));
          balance.value = parsed.balance ?? balance.value;
          positions.value = parsed.positions ?? [];
          orders.value = parsed.orders ?? [];
          tradeHistory.value = parsed.tradeHistory ?? [];
          saveState();
          notify('Import successful', 'info');
          refreshAll();
        } catch (error) {
          console.error(error);
          notify('Import failed', 'warn');
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }

    function resetAccount() {
      if (!window.confirm('Do you really want to reset the paper account?')) return;
      balance.value = 10000;
      positions.value = [];
      orders.value = [];
      tradeHistory.value = [];
      saveState();
      resetTradeForm();
      notify('Account reset', 'info');
    }

    const trackedCoins = () => [
      ...new Set(
        [
          selectedCoin.value,
          ...positions.value.map((p) => p.coin),
          ...orders.value.map((o) => o.coin),
        ].filter(Boolean),
      ),
    ];
    const posPL = (position) => {
      const current = latestPriceFor(position.coin);
      return current == null ? 0 : (current - position.entryPrice) * position.amount;
    };

    function createOHLC(prices, minutes) {
      if (!prices?.length) return [];
      const sorted = [...prices].sort((a, b) => a[0] - b[0]);
      const out = [];
      let bucket = [];
      let start = null;
      const startOfBucket = (ts) => {
        const d = new Date(ts);
        const rounded = Math.floor((d.getHours() * 60 + d.getMinutes()) / minutes) * minutes;
        d.setHours(Math.floor(rounded / 60), rounded % 60, 0, 0);
        return d.getTime();
      };
      for (const [ts, price] of sorted) {
        if (start === null) start = startOfBucket(ts);
        if (ts < start + minutes * 60000) bucket.push([ts, price]);
        else {
          out.push([
            start,
            bucket[0][1],
            bucket.at(-1)[1],
            Math.min(...bucket.map((x) => x[1])),
            Math.max(...bucket.map((x) => x[1])),
          ]);
          bucket = [[ts, price]];
          start = startOfBucket(ts);
        }
      }
      if (bucket.length)
        out.push([
          start,
          bucket[0][1],
          bucket.at(-1)[1],
          Math.min(...bucket.map((x) => x[1])),
          Math.max(...bucket.map((x) => x[1])),
        ]);
      return out;
    }

    async function fetchTopCoins() {
      try {
        const { data } = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'eur',
            order: 'market_cap_desc',
            per_page: 20,
            page: 1,
          },
        });
        coins.value = data.map((c) => ({
          label: `${c.name} (${String(c.symbol || '').toUpperCase()})`,
          value: c.id,
        }));
      } catch (error) {
        console.error(error);
        notify('Could not load coin list', 'warn');
      }
    }

    async function fetchMarket(coin) {
      if (!coin) return;
      try {
        const { data } = await axios.get(`http://localhost:3000/api/crypto/${coin}`);
        const prices = data.prices || [];
        rawPriceData.value[coin] = prices;
        ohlcData.value[coin] = createOHLC(prices, timeframe.value);
        volumeData.value[coin] = data.total_volumes || [];
      } catch (error) {
        console.error(error);
      }
    }

    function executeMarketBuy(coin, amount, price, options = {}) {
      const cost = amount * price;
      if (cost > balance.value) return notify('Not enough balance', 'warn'), false;
      balance.value -= cost;
      positions.value.push({
        id: Date.now() + Math.random(),
        coin,
        amount,
        entryPrice: price,
        stopLoss: options.stopLoss ?? null,
        takeProfit: options.takeProfit ?? null,
        createdAt: new Date().toISOString(),
      });
      tradeHistory.value.unshift({
        id: Date.now() + Math.random(),
        type: 'buy',
        coin,
        amount,
        entryPrice: price,
        exitPrice: null,
        profit: null,
        timestamp: new Date().toISOString(),
      });
      saveState();
      return true;
    }

    function executeMarketSell(positionId, amount, price) {
      const idx = positions.value.findIndex((p) => p.id === positionId);
      if (idx < 0) return notify('Position not found', 'warn'), false;
      const p = positions.value[idx];
      const qty = Math.min(amount, p.amount);
      const profit = (price - p.entryPrice) * qty;
      balance.value += qty * price;
      if (qty >= p.amount) positions.value.splice(idx, 1);
      else positions.value[idx].amount -= qty;
      tradeHistory.value.unshift({
        id: Date.now() + Math.random(),
        type: 'sell',
        coin: p.coin,
        amount: qty,
        entryPrice: p.entryPrice,
        exitPrice: price,
        profit,
        timestamp: new Date().toISOString(),
      });
      saveState();
      return true;
    }

    function placeOrderObject(form) {
      const order = {
        id: Date.now() + Math.random(),
        coin: form.coin,
        side: form.side,
        type: form.type,
        amount: Number(form.amount),
        limitPrice: form.price || null,
        stopLoss: form.stopLoss || null,
        takeProfit: form.takeProfit || null,
        status: 'open',
      };
      if (order.type === 'market') {
        const price = latestPriceFor(order.coin);
        if (price == null) return notify('No price available', 'warn'), false;
        if (order.side === 'buy') return executeMarketBuy(order.coin, order.amount, price, order);
        const pos = positions.value.find((p) => p.coin === order.coin);
        return pos
          ? executeMarketSell(pos.id, order.amount, price)
          : (notify('No position available to sell', 'warn'), false);
      }
      orders.value.push(order);
      saveState();
      return true;
    }

    function runOrderEngine() {
      const executed = [];
      for (const o of orders.value) {
        const current = latestPriceFor(o.coin);
        if (current == null || o.status !== 'open') continue;
        if (o.type === 'limit') {
          if (
            o.side === 'buy' &&
            current <= o.limitPrice &&
            executeMarketBuy(o.coin, o.amount, o.limitPrice, o)
          )
            executed.push(o.id);
          if (o.side === 'sell' && current >= o.limitPrice) {
            const pos = positions.value.find((p) => p.coin === o.coin);
            if (pos && executeMarketSell(pos.id, o.amount, o.limitPrice)) executed.push(o.id);
          }
        }
        if (o.type === 'stop') {
          if (
            o.side === 'buy' &&
            current >= o.limitPrice &&
            executeMarketBuy(o.coin, o.amount, o.limitPrice, o)
          )
            executed.push(o.id);
          if (o.side === 'sell' && current <= o.limitPrice) {
            const pos = positions.value.find((p) => p.coin === o.coin);
            if (pos && executeMarketSell(pos.id, o.amount, o.limitPrice)) executed.push(o.id);
          }
        }
      }
      if (executed.length) orders.value = orders.value.filter((o) => !executed.includes(o.id));
      for (const p of [...positions.value]) {
        const cur = latestPriceFor(p.coin);
        if (cur == null) continue;
        if (p.stopLoss && cur <= p.stopLoss) executeMarketSell(p.id, p.amount, p.stopLoss);
        else if (p.takeProfit && cur >= p.takeProfit)
          executeMarketSell(p.id, p.amount, p.takeProfit);
      }
      saveState();
    }

    function buildChart() {
      const coin = selectedCoin.value;
      const candles = ohlcData.value[coin] || [];
      const line = (rawPriceData.value[coin] || []).map(([t, p]) => [t, p]);
      const vol = volumeData.value[coin] || [];
      const axisLabelColor = isDark.value ? '#94a3b8' : '#64748b';
      const legendColor = isDark.value ? '#e2e8f0' : '#1f2937';
      const splitLineColor = isDark.value
        ? 'rgba(148, 163, 184, 0.14)'
        : 'rgba(100, 116, 139, 0.12)';
      const tooltipBackground = isDark.value ? '#0f172a' : '#ffffff';
      const tooltipBorderColor = isDark.value
        ? 'rgba(148, 163, 184, 0.22)'
        : 'rgba(148, 163, 184, 0.28)';
      const sliderTextColor = isDark.value ? '#94a3b8' : '#475569';
      const sliderBorderColor = isDark.value
        ? 'rgba(148, 163, 184, 0.18)'
        : 'rgba(148, 163, 184, 0.3)';
      const sliderFillerColor = isDark.value
        ? 'rgba(59, 130, 246, 0.18)'
        : 'rgba(59, 130, 246, 0.12)';
      const volumeColor = isDark.value ? 'rgba(226, 232, 240, 0.2)' : 'rgba(71, 85, 105, 0.18)';
      const main =
        chartType.value === 'candlestick' && candles.length
          ? {
              type: 'candlestick',
              name: coin.toUpperCase(),
              data: candles,
              itemStyle: {
                color: '#22c55e',
                color0: '#fb7185',
                borderColor: '#22c55e',
                borderColor0: '#fb7185',
              },
            }
          : {
              type: 'line',
              name: coin.toUpperCase(),
              data: line,
              showSymbol: false,
              lineStyle: { width: 2, color: '#60a5fa' },
              areaStyle: { color: 'rgba(96,165,250,0.15)' },
            };
      const series = [main];
      const grid = [
        {
          left: '8%',
          right: '4%',
          top: '12%',
          bottom: vol.length ? '25%' : '12%',
          containLabel: true,
        },
      ];
      const xAxis = [
        {
          type: 'time',
          axisLabel: { color: axisLabelColor },
          axisLine: { lineStyle: { color: splitLineColor } },
          splitLine: { show: false },
        },
      ];
      const yAxis = [
        {
          scale: true,
          axisLabel: { color: axisLabelColor, formatter: (v) => formatCurrency(v) },
          splitLine: { lineStyle: { color: splitLineColor } },
        },
      ];
      if (vol.length) {
        series.push({
          type: 'bar',
          name: 'Volume',
          data: vol,
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: { color: volumeColor },
        });
        grid.push({
          left: '8%',
          right: '4%',
          top: '78%',
          height: '10%',
          containLabel: true,
        });
        xAxis.push({
          type: 'time',
          gridIndex: 1,
          axisLine: { lineStyle: { color: splitLineColor } },
          axisLabel: { show: false },
          splitLine: { show: false },
        });
        yAxis.push({
          gridIndex: 1,
          axisLabel: { show: false },
          splitLine: { show: false },
        });
      }
      chartOptions.value = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: tooltipBackground,
          borderColor: tooltipBorderColor,
          textStyle: { color: legendColor },
        },
        legend: { top: 0, textStyle: { color: legendColor } },
        grid,
        xAxis,
        yAxis,
        dataZoom: [
          { type: 'inside', xAxisIndex: vol.length ? [0, 1] : [0], start: 75, end: 100 },
          {
            type: 'slider',
            xAxisIndex: vol.length ? [0, 1] : [0],
            bottom: 0,
            start: 75,
            end: 100,
            textStyle: { color: sliderTextColor },
            borderColor: sliderBorderColor,
            fillerColor: sliderFillerColor,
            handleStyle: { color: '#3b82f6', borderColor: '#3b82f6' },
            moveHandleStyle: { color: '#3b82f6' },
            dataBackground: {
              lineStyle: { color: splitLineColor },
              areaStyle: {
                color: isDark.value ? 'rgba(30, 41, 59, 0.65)' : 'rgba(226, 232, 240, 0.9)',
              },
            },
          },
        ],
        series,
      };
    }

    async function refreshAll() {
      const coinsToLoad = trackedCoins();
      if (!coinsToLoad.length) return;
      loading.value = true;
      try {
        await Promise.all(coinsToLoad.map((c) => fetchMarket(c)));
        livePrice.value = latestPriceFor(selectedCoin.value);
        runOrderEngine();
        buildChart();
      } finally {
        loading.value = false;
      }
    }

    const refreshNow = () => (refreshAll(), notify('Manual refresh started', 'info'));

    const resetTradeForm = () => {
      tradeForm.value = {
        coin: selectedCoin.value || 'bitcoin',
        side: 'buy',
        type: 'market',
        amount: 0.01,
        price: null,
        stopLoss: null,
        takeProfit: null,
      };
    };

    function setAmountPercentage(pct) {
      if (tradeForm.value.side === 'sell') {
        tradeForm.value.amount = Number(((activePosition.value?.amount || 0) * pct).toFixed(6));
        return;
      }
      const refPrice =
        tradeForm.value.type === 'market'
          ? latestPriceFor(tradeForm.value.coin) || livePrice.value || 1
          : tradeForm.value.price || 1;
      tradeForm.value.amount = Number(((balance.value / refPrice) * pct).toFixed(6));
    }

    const calculateTotalCost = () =>
      Number(tradeForm.value.amount || 0) *
      (tradeForm.value.type === 'market'
        ? latestPriceFor(tradeForm.value.coin) || livePrice.value || 0
        : tradeForm.value.price || 0);

    function onPlaceOrder() {
      if (!isFormValid.value) return notify('Invalid order parameters', 'warn');
      if (!placeOrderObject({ ...tradeForm.value })) return;
      activeTab.value = tradeForm.value.type === 'market' ? 'positions' : 'orders';
      resetTradeForm();
      buildChart();
    }
    const onPlaceOrderAndClose = () => (onPlaceOrder(), (showTradeDialog.value = false));

    const closePosition = (id) => (confirmClose.value = { show: true, positionId: id });
    function confirmCloseConfirm() {
      const pos = positions.value.find((p) => p.id === confirmClose.value.positionId);
      if (!pos) return;
      const price = latestPriceFor(pos.coin);
      if (price == null) return notify('No price available', 'warn');
      executeMarketSell(pos.id, pos.amount, price);
      confirmClose.value = { show: false, positionId: null };
    }
    const cancelOrder = (id) => (
      (orders.value = orders.value.filter((o) => o.id !== id)), saveState()
    );
    const onChartClick = (params) => {
      const v = Array.isArray(params.value) ? params.value : null;
      const price = v ? (params.seriesType === 'candlestick' ? v[2] : v[1]) : null;
      if (typeof price === 'number') tradeForm.value.price = Number(price.toFixed(2));
    };
    const toggleNotificationsPanel = () => {
      toggleNotifications.value = !toggleNotifications.value;
      if (toggleNotifications.value)
        notifications.value = notifications.value.map((n) => ({ ...n, read: true }));
    };

    watch(selectedCoin, async (coin) => {
      if (!coin) return;
      tradeForm.value.coin = coin;
      await refreshAll();
    });
    watch(
      timeframe,
      () => (
        Object.keys(rawPriceData.value).forEach(
          (coin) => (ohlcData.value[coin] = createOHLC(rawPriceData.value[coin], timeframe.value)),
        ),
        buildChart()
      ),
    );
    watch(chartType, buildChart);
    watch(() => $q.dark.isActive, buildChart);

    onMounted(async () => {
      loadState();
      await fetchTopCoins();
      if (!coins.value.find((c) => c.value === selectedCoin.value) && coins.value.length)
        selectedCoin.value = coins.value[0].value;
      resetTradeForm();
      await refreshAll();
      progressTimer.value = setInterval(
        () =>
          (refreshProgress.value = Math.min(
            100,
            refreshProgress.value + 100 / (UPDATE_INTERVAL_MS / 100),
          )),
        100,
      );
      refreshTimer.value = setInterval(async () => {
        refreshProgress.value = 0;
        await refreshAll();
      }, UPDATE_INTERVAL_MS);
    });

    onUnmounted(() => {
      if (refreshTimer.value) clearInterval(refreshTimer.value);
      if (progressTimer.value) clearInterval(progressTimer.value);
    });

    return {
      $q,
      activeTab,
      availabilityLabel,
      balance,
      calculateTotalCost,
      cancelOrder,
      chartOptions,
      chartType,
      closePosition,
      coins,
      confirmClose,
      confirmCloseConfirm,
      equityChangePct,
      exportState,
      formatCurrency,
      formatSignedCurrency,
      formatTime,
      getPriceChange,
      getPriceChangePercent,
      historyCols,
      importFileRef,
      importStateFile,
      isDark,
      isFormValid,
      latestPriceFor,
      livePrice,
      loading,
      notifications,
      onChartClick,
      onPlaceOrder,
      onPlaceOrderAndClose,
      orderTypeOptions,
      orders,
      posPL,
      positions,
      refreshNow,
      refreshProgress,
      resetAccount,
      resetTradeForm,
      selectedCoin,
      selectedCoinLabel,
      showTradeDialog,
      sideOptions,
      signedPercent,
      setAmountPercentage,
      timeframe,
      toggleNotifications,
      toggleNotificationsPanel,
      toggleDarkMode,
      totalEquity,
      tradeForm,
      tradeHistory,
      triggerImport,
      unreadNotifications,
      unrealizedPL,
    };
  },
});
</script>

<style scoped>
.paper-page {
  min-height: 100vh;
  transition: background 0.35s ease, color 0.35s ease;
}
.paper-page--dark {
  background: linear-gradient(180deg, #08111d 0%, #0d1a2b 100%);
  color: #e5eef8;
}
.paper-page--light {
  background: linear-gradient(180deg, #f4f7fb 0%, #e8eef7 100%);
  color: #122033;
}
.paper-shell {
  max-width: 1680px;
  margin: 0 auto;
  position: relative;
}
.dark-mode-toggle {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 30;
}
.toggle-btn {
  width: 58px;
  height: 58px;
  border: 3px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.2);
  transition: all 0.3s ease;
}
.toggle-btn:hover {
  transform: translateY(-2px) scale(1.04);
}
.hero-card,
.surface-card {
  border: 1px solid transparent;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(14px);
  transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease,
    color 0.35s ease;
}
.paper-page--dark .hero-card,
.paper-page--dark .surface-card {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(10, 19, 32, 0.86);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
}
.paper-page--light .hero-card,
.paper-page--light .surface-card {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}
.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
}
.paper-page--dark .hero-card {
  background: linear-gradient(135deg, rgba(18, 43, 71, 0.96), rgba(12, 22, 38, 0.96));
}
.paper-page--light .hero-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(231, 239, 249, 0.98));
}
.hero-card h1 {
  margin: 6px 0 12px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
}
.paper-page--dark .hero-card p,
.paper-page--dark .section-subtitle {
  color: rgba(229, 238, 248, 0.72);
}
.paper-page--light .hero-card p,
.paper-page--light .section-subtitle {
  color: #475569;
}
.eyebrow {
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.82rem;
}
.paper-page--dark .eyebrow {
  color: #7dd3fc;
}
.paper-page--light .eyebrow {
  color: #2563eb;
}
.hero-metrics {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.metric-box {
  min-width: 150px;
  padding: 16px;
  border-radius: 18px;
}
.paper-page--dark .metric-box {
  background: rgba(255, 255, 255, 0.06);
}
.paper-page--light .metric-box {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.2);
}
.metric-box span {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8rem;
  text-transform: uppercase;
}
.paper-page--dark .metric-box span {
  color: rgba(229, 238, 248, 0.7);
}
.paper-page--light .metric-box span {
  color: #64748b;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 390px;
  gap: 18px;
  margin-top: 18px;
}
.surface-card {
  padding: 20px;
  border-radius: 24px;
}
.section-title {
  font-size: 1.05rem;
  font-weight: 700;
}
.toolbar,
.toolbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.chart-canvas {
  height: 560px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.summary-box {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 18px;
}
.paper-page--dark .summary-box {
  background: rgba(255, 255, 255, 0.05);
}
.paper-page--light .summary-box {
  background: rgba(37, 99, 235, 0.06);
  color: #0f172a;
}
.list-item {
  border-radius: 14px;
  transition: background 0.2s ease;
}
.paper-page--dark .list-item:hover {
  background: rgba(255, 255, 255, 0.04);
}
.paper-page--light .list-item:hover {
  background: rgba(15, 23, 42, 0.05);
}
.paper-page--dark .list-item.active {
  background: rgba(37, 99, 235, 0.18);
}
.paper-page--light .list-item.active {
  background: rgba(37, 99, 235, 0.12);
}
.empty-state {
  min-height: 260px;
  display: grid;
  place-items: center;
}
.paper-page--dark .empty-state {
  color: rgba(229, 238, 248, 0.68);
}
.paper-page--light .empty-state {
  color: #64748b;
}
.hidden-input {
  display: none;
}
.notifications-panel {
  position: fixed;
  top: 96px;
  right: 24px;
  width: min(360px, calc(100vw - 32px));
  z-index: 20;
}
.dialog-card {
  min-width: min(520px, calc(100vw - 32px));
}
.paper-page--dark .dialog-card {
  background: #0d1726;
  color: #e5eef8;
}
.paper-page--light .dialog-card {
  background: #ffffff;
  color: #0f172a;
}
.dialog-header {
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
}
.paper-toggle {
  border-radius: 14px;
}
.paper-page--dark .paper-toggle {
  background: rgba(255, 255, 255, 0.04);
}
.paper-page--light .paper-toggle {
  background: rgba(148, 163, 184, 0.12);
}
.paper-page--dark :deep(.paper-field .q-field__label),
.paper-page--dark :deep(.paper-field .q-field__native),
.paper-page--dark :deep(.paper-field .q-field__input),
.paper-page--dark :deep(.paper-field .q-select__dropdown-icon),
.paper-page--dark :deep(.paper-field .q-field__marginal) {
  color: #e2e8f0;
}
.paper-page--dark :deep(.paper-field .q-field__control) {
  background: rgba(15, 23, 42, 0.72);
}
.paper-page--dark :deep(.paper-field .q-field__control:before) {
  border-color: rgba(148, 163, 184, 0.28);
}
.paper-page--light :deep(.paper-field .q-field__label),
.paper-page--light :deep(.paper-field .q-field__native),
.paper-page--light :deep(.paper-field .q-field__input),
.paper-page--light :deep(.paper-field .q-select__dropdown-icon),
.paper-page--light :deep(.paper-field .q-field__marginal) {
  color: #0f172a;
}
.paper-page--light :deep(.paper-field .q-field__control) {
  background: rgba(255, 255, 255, 0.92);
}
.paper-page--light :deep(.paper-field .q-field__control:before) {
  border-color: rgba(148, 163, 184, 0.38);
}
.paper-page--light :deep(.q-item__label--caption),
.paper-page--light :deep(.q-table tbody td) {
  color: #475569;
}
.paper-page--dark :deep(.q-item__label--caption) {
  color: rgba(226, 232, 240, 0.72);
}
.paper-page--light :deep(.q-table__top),
.paper-page--light :deep(.q-table thead tr th),
.paper-page--light :deep(.q-table tbody tr),
.paper-page--light :deep(.q-table tbody td) {
  background: transparent;
  color: #0f172a;
}
.paper-page--dark :deep(.history-table .q-table__container) {
  background: transparent;
  color: #e2e8f0;
}
.paper-page--light :deep(.history-table .q-table__container) {
  background: transparent;
}
.paper-page--light :deep(.q-tab-panel),
.paper-page--light :deep(.q-tabs .q-tab),
.paper-page--light :deep(.q-chip) {
  color: #0f172a;
}
.paper-page--dark :deep(.q-tab-panel),
.paper-page--dark :deep(.q-tabs .q-tab) {
  color: #e2e8f0;
}
.text-positive {
  color: #2dd4bf;
}
.text-negative {
  color: #fb7185;
}
@media (max-width: 1300px) {
  .dashboard-grid {
    grid-template-columns: 260px minmax(0, 1fr);
  }
  .dashboard-grid > :last-child {
    grid-column: 1 / -1;
  }
}
@media (max-width: 960px) {
  .hero-card,
  .form-grid,
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
  }
  .chart-canvas {
    height: 420px;
  }
  .notifications-panel {
    left: 16px;
    right: 16px;
    width: auto;
  }
  .dark-mode-toggle {
    left: 16px;
    bottom: 16px;
  }
  .toggle-btn {
    width: 54px;
    height: 54px;
  }
}
</style>
