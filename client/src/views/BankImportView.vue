<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn icon="arrow_back" flat round @click="$router.back()" />
      <div class="text-h4 q-ml-md">🏦 Bankverbindung</div>
    </div>

    <!-- Main Card -->
    <q-card class="q-mb-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Österreichische Bankverbindung</div>
        <div class="text-caption">Manueller Import für österreichische Banken</div>
      </q-card-section>

      <q-card-section>
        <!-- Bank Selection -->
        <q-select
          v-model="selectedBank"
          :options="austrianBanks"
          label="Ihre Bank auswählen"
          option-label="name"
          option-value="id"
          filled
          class="q-mb-md"
          emit-value
          map-options
        />

        <!-- CSV Upload Section -->
        <div v-if="selectedBank" class="q-mb-lg">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-h6">📁 Kontoauszug importieren</div>
            <q-btn
              label="Beispiel CSV"
              outline
              color="secondary"
              @click="downloadSampleCSV(selectedBank)"
              size="sm"
            />
          </div>

          <q-uploader
            label="CSV-Datei hochladen"
            accept=".csv,.txt"
            @added="handleFileUpload"
            style="width: 100%"
            class="q-mb-md"
            :disable="importingCSV"
            flat
            bordered
          >
            <template v-slot:list="scope">
              <q-list separator>
                <q-item v-for="file in scope.files" :key="file.name">
                  <q-item-section>
                    <q-item-label class="full-width ellipsis">
                      {{ file.name }}
                    </q-item-label>
                    <q-item-label caption> {{ file.size }} bytes </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-spinner v-if="importingCSV" color="primary" size="2em" />
                    <q-btn
                      v-else
                      icon="delete"
                      size="sm"
                      flat
                      round
                      dense
                      @click="scope.removeFile(file)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </q-uploader>

          <!-- Bank-specific Instructions -->
          <q-card flat bordered class="bg-blue-1">
            <q-card-section>
              <div class="text-weight-bold">ℹ️ Anleitung für {{ getBankName(selectedBank) }}:</div>
              <div class="text-caption q-mt-xs">
                {{ getBankInstructions(selectedBank) }}
              </div>
              <div class="text-caption q-mt-xs text-weight-bold">
                Erwartetes Format: {{ getBankFormat(selectedBank) }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Quick Transaction Templates -->
        <div class="q-mb-lg">
          <div class="text-h6 q-mb-sm">⚡ Schnelleinträge</div>
          <div class="row q-gutter-sm">
            <q-btn
              v-for="quickTx in quickTransactions"
              :key="quickTx.label"
              :label="quickTx.label"
              :color="quickTx.color"
              outline
              @click="openQuickTransaction(quickTx)"
              class="q-px-md"
            />
          </div>
        </div>

        <!-- Manual Transaction Form -->
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">✏️ Transaktion manuell eingeben</div>

            <q-form @submit="addManualTransaction" class="q-gutter-md q-mt-md">
              <div class="row q-gutter-md">
                <q-input
                  filled
                  v-model="manualTransaction.date"
                  label="Datum"
                  type="date"
                  class="col"
                  required
                  stack-label
                />

                <q-input
                  filled
                  v-model.number="manualTransaction.amount"
                  label="Betrag (€)"
                  type="number"
                  step="0.01"
                  class="col"
                  required
                  stack-label
                />
              </div>

              <div class="row q-gutter-md">
                <q-select
                  filled
                  v-model="manualTransaction.transaction_type"
                  :options="transactionTypes"
                  label="Typ"
                  class="col"
                  required
                  stack-label
                  emit-value
                  map-options
                />

                <q-select
                  filled
                  v-model.number="manualTransaction.category_id"
                  :options="categories"
                  label="Kategorie"
                  option-label="name"
                  option-value="id"
                  class="col"
                  required
                  stack-label
                  emit-value
                  map-options
                />
              </div>

              <q-input
                filled
                v-model="manualTransaction.description"
                label="Beschreibung"
                required
                stack-label
              />

              <q-select
                filled
                v-model="manualTransaction.payment_method"
                :options="paymentMethods"
                label="Zahlungsmethode"
                stack-label
                emit-value
                map-options
              />

              <div class="row justify-end q-mt-lg">
                <q-btn
                  label="Transaktion speichern"
                  type="submit"
                  color="primary"
                  icon="save"
                  :loading="savingTransaction"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-card-section>
    </q-card>

    <!-- Filters Section -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">🔍 Filter & Suche</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="searchText" label="Suche" clearable outlined dense>
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="transactionType"
              :options="typeOptions"
              label="Transaktionstyp"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="sortOption"
              :options="sortOptions"
              label="Sortieren nach"
              outlined
              dense
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedCategories"
              :options="categoryOptions"
              label="Kategorien"
              multiple
              outlined
              dense
              use-chips
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-6">
            <q-range
              v-model="amountRange"
              :min="0"
              :max="5000"
              :step="10"
              :label="false"
              color="primary"
              style="width: 100%"
            />
            <div class="text-caption text-center q-mt-xs">Betragsbereich (€)</div>
            <div class="row justify-between q-mt-xs">
              <div class="text-caption">{{ amountRange.min }} €</div>
              <div class="text-caption">{{ amountRange.max }} €</div>
            </div>
          </div>

          <div class="col-12">
            <q-btn
              label="Filter zurücksetzen"
              color="negative"
              flat
              @click="resetFilters"
              class="full-width"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Export Buttons -->
    <div class="row justify-end q-mb-md">
      <q-btn-group>
        <q-btn
          color="secondary"
          icon="picture_as_pdf"
          label="PDF Export (Transaktionen)"
          @click="exportPDF"
          class="q-mr-sm"
        />
        <q-btn
          color="positive"
          icon="text_snippet"
          label="CSV Export (Transaktionen)"
          @click="exportCSV"
          class="q-mr-sm"
        />
        <q-btn
          color="primary"
          icon="picture_as_pdf"
          label="PDF Export (Kategorien)"
          @click="exportCategoryPDF"
          class="q-mr-sm"
        />
        <q-btn
          color="teal"
          icon="text_snippet"
          label="CSV Export (Kategorien)"
          @click="exportCategoryCSV"
        />
      </q-btn-group>
    </div>

    <!-- Category Summary -->
    <q-card>
      <q-card-section>
        <div class="text-h6">📊 Kategorieübersicht</div>

        <!-- Summary Cards -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-4">
            <q-card class="bg-green-1">
              <q-card-section>
                <div class="text-h6 text-green">Einnahmen</div>
                <div class="text-h5 text-weight-bold text-green">
                  +{{ formatCurrency(categorySummary.totalIncome) }}
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="bg-red-1">
              <q-card-section>
                <div class="text-h6 text-red">Ausgaben</div>
                <div class="text-h5 text-weight-bold text-red">
                  -{{ formatCurrency(categorySummary.totalExpenses) }}
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card :class="categorySummary.balance >= 0 ? 'bg-blue-1' : 'bg-orange-1'">
              <q-card-section>
                <div
                  class="text-h6"
                  :class="categorySummary.balance >= 0 ? 'text-blue' : 'text-orange'"
                >
                  Saldo
                </div>
                <div
                  class="text-h5 text-weight-bold"
                  :class="categorySummary.balance >= 0 ? 'text-blue' : 'text-orange'"
                >
                  {{ categorySummary.balance >= 0 ? '+' : ''
                  }}{{ formatCurrency(categorySummary.balance) }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Categories Grid -->
        <div class="row q-col-gutter-md justify-center">
          <div
            class="col-12 col-sm-6 col-md-4 col-lg-3"
            v-for="cat in categorySummaries"
            :key="cat.id"
          >
            <q-card flat bordered class="my-card" @click="openCategoryDialog(cat)">
              <q-card-section class="text-center">
                <div class="text-h6">{{ cat.name }}</div>
                <div class="q-mt-sm">
                  <div style="color: green">Einnahmen: +{{ formatCurrency(cat.income) }}</div>
                  <div style="color: red">Ausgaben: -{{ formatCurrency(cat.expenses) }}</div>
                  <div :style="{ color: cat.netAmount >= 0 ? 'green' : 'red' }">
                    Saldo: {{ cat.netAmount >= 0 ? '+' : '' }}{{ formatCurrency(cat.netAmount) }}
                  </div>
                  <div class="text-caption q-mt-xs">{{ cat.transactionCount }} Transaktionen</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div v-if="categorySummaries.length === 0" class="text-center q-pa-lg text-grey">
          <q-icon name="pie_chart" size="xl" />
          <div>Keine Kategoriedaten für die aktuellen Filter</div>
          <div class="text-caption">
            Passen Sie die Filter an oder importieren Sie Transaktionen
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Category Details Dialog -->
    <q-dialog v-model="showCategoryDialog" maximized>
      <q-card style="min-width: 80vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ activeCategory?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-4">
              <q-card class="bg-green-1">
                <q-card-section class="text-center">
                  <div class="text-h6 text-green">Einnahmen</div>
                  <div class="text-h5 text-weight-bold text-green">
                    +{{ formatCurrency(activeCategory?.income || 0) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card class="bg-red-1">
                <q-card-section class="text-center">
                  <div class="text-h6 text-red">Ausgaben</div>
                  <div class="text-h5 text-weight-bold text-red">
                    -{{ formatCurrency(activeCategory?.expenses || 0) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card :class="(activeCategory?.netAmount || 0) >= 0 ? 'bg-blue-1' : 'bg-orange-1'">
                <q-card-section class="text-center">
                  <div
                    class="text-h6"
                    :class="(activeCategory?.netAmount || 0) >= 0 ? 'text-blue' : 'text-orange'"
                  >
                    Saldo
                  </div>
                  <div
                    class="text-h5 text-weight-bold"
                    :class="(activeCategory?.netAmount || 0) >= 0 ? 'text-blue' : 'text-orange'"
                  >
                    {{ (activeCategory?.netAmount || 0) >= 0 ? '+' : ''
                    }}{{ formatCurrency(activeCategory?.netAmount || 0) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-list separator>
            <q-item v-for="tx in activeCategory?.transactions || []" :key="tx.id">
              <q-item-section avatar>
                <q-icon
                  :name="tx.transaction_type === 'Einnahme' ? 'arrow_upward' : 'arrow_downward'"
                  :color="tx.transaction_type === 'Einnahme' ? 'green' : 'red'"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ tx.description || 'Ohne Beschreibung' }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(tx.date) }}
                  <span v-if="tx.payment_method">• {{ tx.payment_method }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label
                  :class="tx.transaction_type === 'Einnahme' ? 'text-green' : 'text-red'"
                  class="text-weight-bold"
                >
                  {{ tx.transaction_type === 'Einnahme' ? '+' : '-'
                  }}{{ formatCurrency(tx.amount) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Schließen" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { auth } from '@/utils/auth';
import { jwtDecode } from 'jwt-decode';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default {
  name: 'AustrianBankImport',
  setup() {
    const $q = useQuasar();
    const router = useRouter();

    const selectedBank = ref(null);
    const manualTransaction = ref({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      transaction_type: 'Ausgabe',
      category_id: null,
      description: '',
      payment_method: 'Karte',
    });
    const recentTransactions = ref([]);
    const categories = ref([]);
    const savingTransaction = ref(false);
    const importingCSV = ref(false);

    // Filter variables
    const searchText = ref('');
    const transactionType = ref(null);
    const selectedCategories = ref([]);
    const amountRange = ref({ min: 0, max: 5000 });
    const sortOption = ref('date_desc');

    const typeOptions = [
      { label: 'Einnahme', value: 'Einnahme' },
      { label: 'Ausgabe', value: 'Ausgabe' },
    ];

    const sortOptions = [
      { label: 'Datum (Neueste zuerst)', value: 'date_desc' },
      { label: 'Datum (Älteste zuerst)', value: 'date_asc' },
      { label: 'Betrag (Höchste zuerst)', value: 'amount_desc' },
      { label: 'Betrag (Niedrigste zuerst)', value: 'amount_asc' },
    ];

    const categoryOptions = computed(() =>
      categories.value.map((c) => ({ label: c.name, value: c.id })),
    );

    // Category summary data - properly initialized
    const categorySummary = ref({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      categories: [],
    });

    // Safe computed properties
    const categorySummaries = computed(() => {
      return categorySummary.value?.categories || [];
    });

    // Dialog state
    const showCategoryDialog = ref(false);
    const activeCategory = ref(null);

    const austrianBanks = ref([
      {
        id: 'erste',
        name: 'Erste Bank und Sparkassen',
        format: 'Datum;Buchungstext;Betrag',
        instruction: 'Im Online-Banking: "Kontoauszug exportieren" > "CSV Format" auswählen',
      },
      {
        id: 'raiffeisen',
        name: 'Raiffeisen Bank',
        format: 'Buchungstag;Valuta;Buchungstext;Betrag',
        instruction: 'Im Raiffeisen Online-Banking: "Umsätze exportieren" > CSV',
      },
      {
        id: 'bawag',
        name: 'BAWAG PSK',
        format: 'Buchungsdatum;Betrag;Verwendungszweck',
        instruction: 'BAWAG Online-Banking: "Kontoauszug" > "Exportieren" > CSV',
      },
      {
        id: 'volksbank',
        name: 'Volksbanken',
        format: 'Datum;Text;Soll;Haben',
        instruction: 'Volksbank Online-Banking: Umsatzübersicht exportieren',
      },
      {
        id: 'other',
        name: 'Andere österreichische Bank',
        format: 'Datum;Beschreibung;Betrag',
        instruction: 'CSV-Datei mit Datum, Beschreibung und Betrag hochladen',
      },
    ]);

    const transactionTypes = ref([
      { label: '💰 Einnahme', value: 'Einnahme' },
      { label: '💸 Ausgabe', value: 'Ausgabe' },
    ]);

    const paymentMethods = ref([
      { label: '💳 Karte', value: 'Karte' },
      { label: '💵 Bar', value: 'Bar' },
      { label: '🏦 Überweisung', value: 'Überweisung' },
      { label: '🔄 Dauerauftrag', value: 'Dauerauftrag' },
      { label: '📱 Online', value: 'Online' },
      { label: '🏦 Bank', value: 'Bank' },
    ]);

    const quickTransactions = ref([
      {
        label: '🏠 Miete',
        amount: -850,
        category_id: 2,
        transaction_type: 'Ausgabe',
        description: 'Monatsmiete',
        payment_method: 'Überweisung',
        color: 'blue',
      },
      {
        label: '🛒 Einkauf',
        amount: -120,
        category_id: 1,
        transaction_type: 'Ausgabe',
        description: 'Wocheneinkauf',
        payment_method: 'Karte',
        color: 'green',
      },
      {
        label: '💼 Gehalt',
        amount: 2500,
        category_id: 3,
        transaction_type: 'Einnahme',
        description: 'Monatsgehalt',
        payment_method: 'Überweisung',
        color: 'positive',
      },
      {
        label: '🚗 Tanken',
        amount: -80,
        category_id: 4,
        transaction_type: 'Ausgabe',
        description: 'Tankfüllung',
        payment_method: 'Karte',
        color: 'orange',
      },
    ]);

    const getUserId = () => {
      const token = auth.getToken();
      if (!token) return null;
      try {
        return jwtDecode(token).id;
      } catch {
        return null;
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3000/categories');
        categories.value = response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const getBankName = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.name : 'Unbekannte Bank';
    };

    const getBankInstructions = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.instruction : 'CSV-Datei mit Transaktionen hochladen';
    };

    const getBankFormat = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.format : 'Datum;Beschreibung;Betrag';
    };

    const getCategoryName = (categoryId) => {
      const category = categories.value.find((c) => c.id === categoryId);
      return category ? category.name : 'Unkategorisiert';
    };

    // Filtered transactions based on current filters
    const filteredTransactions = computed(() => {
      let filtered = [...recentTransactions.value];

      // Search filter
      if (searchText.value) {
        const search = searchText.value.toLowerCase();
        filtered = filtered.filter(
          (tx) =>
            tx.description?.toLowerCase().includes(search) ||
            getCategoryName(tx.category_id).toLowerCase().includes(search),
        );
      }

      // Transaction type filter
      if (transactionType.value) {
        filtered = filtered.filter((tx) => tx.transaction_type === transactionType.value);
      }

      // Category filter
      if (selectedCategories.value.length > 0) {
        filtered = filtered.filter((tx) => selectedCategories.value.includes(tx.category_id));
      }

      // Amount range filter
      filtered = filtered.filter(
        (tx) => tx.amount >= amountRange.value.min && tx.amount <= amountRange.value.max,
      );

      // Sorting
      switch (sortOption.value) {
        case 'date_asc':
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case 'date_desc':
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'amount_asc':
          filtered.sort((a, b) => a.amount - b.amount);
          break;
        case 'amount_desc':
          filtered.sort((a, b) => b.amount - a.amount);
          break;
      }

      return filtered;
    });

    // Update category summary with current transactions
    const updateCategorySummary = () => {
      const transactionsToUse = filteredTransactions.value;

      const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        categories: [],
      };

      // Return empty summary if no transactions
      if (!transactionsToUse || transactionsToUse.length === 0) {
        categorySummary.value = summary;
        return;
      }

      // Group transactions by category
      const categoryMap = new Map();

      transactionsToUse.forEach((tx) => {
        // Ensure transaction has valid amount
        if (!tx.amount || isNaN(tx.amount)) {
          console.warn('Skipping transaction with invalid amount:', tx);
          return;
        }

        const categoryId = tx.category_id;
        const categoryName = getCategoryName(categoryId);

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            income: 0,
            expenses: 0,
            netAmount: 0,
            transactionCount: 0,
            transactions: [],
          });
        }

        const category = categoryMap.get(categoryId);

        if (tx.transaction_type === 'Einnahme') {
          category.income += Number(tx.amount);
          summary.totalIncome += Number(tx.amount);
        } else {
          category.expenses += Number(tx.amount);
          summary.totalExpenses += Number(tx.amount);
        }

        category.netAmount = category.income - category.expenses;
        category.transactionCount++;
        category.transactions.push(tx);
      });

      // Convert map to array and sort by net amount (highest first)
      summary.categories = Array.from(categoryMap.values()).sort(
        (a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount),
      );

      summary.balance = summary.totalIncome - summary.totalExpenses;
      categorySummary.value = summary;
    };

    // Watch for filter changes to update the summary
    watch([searchText, transactionType, selectedCategories, amountRange, sortOption], () => {
      updateCategorySummary();
    });

    const handleFileUpload = (files) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        $q.notify({
          type: 'negative',
          message: 'Datei zu groß. Maximal 5MB erlaubt.',
          timeout: 5000,
        });
        return;
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        importingCSV.value = true;
        try {
          let content = e.target.result;

          const transactions = parseCSV(content, selectedBank.value);

          if (transactions.length === 0) {
            $q.notify({
              type: 'warning',
              message: 'Keine gültigen Transaktionen in der CSV-Datei gefunden.',
              timeout: 5000,
            });
            return;
          }

          const totalIncome = transactions
            .filter((tx) => tx.transaction_type === 'Einnahme')
            .reduce((sum, tx) => sum + Number(tx.amount), 0);
          const totalExpenses = transactions
            .filter((tx) => tx.transaction_type === 'Ausgabe')
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

          let successCount = 0;
          let errorCount = 0;

          for (const tx of transactions) {
            try {
              await saveTransaction(tx);
              successCount++;
            } catch (error) {
              console.error('Error saving transaction:', error);
              errorCount++;
            }
          }

          $q.notify({
            type: successCount > 0 ? 'positive' : 'warning',
            message: `${successCount} Transaktionen importiert (Einnahmen: ${formatCurrency(
              totalIncome,
            )}, Ausgaben: ${formatCurrency(totalExpenses)})${
              errorCount > 0 ? `, ${errorCount} Fehler` : ''
            }`,
            timeout: 6000,
          });

          fetchRecentTransactions();
        } catch (error) {
          console.error('Error parsing CSV:', error);
          $q.notify({
            type: 'negative',
            message: 'Fehler beim Import der CSV-Datei. Bitte Format überprüfen.',
            timeout: 5000,
          });
        } finally {
          importingCSV.value = false;
        }
      };

      reader.readAsText(file, 'UTF-8');
    };

    const parseCSV = (content, bankId) => {
      const lines = content.split('\n').filter((line) => line.trim());
      const transactions = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          // Skip header lines
          if (
            i === 0 &&
            lines[i].toLowerCase().includes('datum') &&
            lines[i].toLowerCase().includes('betrag')
          ) {
            continue;
          }

          let cleanLine = lines[i].trim();

          // Handle quoted CSV lines
          if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
            cleanLine = cleanLine.slice(1, -1);
          }

          // Split by semicolon, handling quoted fields
          const columns = [];
          let currentField = '';
          let inQuotes = false;

          for (let char of cleanLine) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ';' && !inQuotes) {
              columns.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          columns.push(currentField.trim());

          if (columns.length >= 3) {
            const rawAmount = parseAmount(columns, bankId, true);

            if (rawAmount !== 0) {
              const transaction = {
                date: parseDate(columns[0], bankId),
                amount: Math.abs(rawAmount),
                description: parseDescription(columns, bankId),
                transaction_type: rawAmount > 0 ? 'Einnahme' : 'Ausgabe',
                category_id: autoCategorize(parseDescription(columns, bankId)),
                payment_method: 'Bank',
                currency: 'EUR',
              };

              if (transaction.date && transaction.amount > 0 && transaction.description) {
                transactions.push(transaction);
              }
            }
          }
        } catch (error) {
          console.warn('Skipping invalid CSV line:', lines[i], error);
        }
      }

      return transactions;
    };

    const parseDate = (dateString, bankId) => {
      if (!dateString) return null;

      dateString = dateString.replace(/"/g, '');

      if (dateString.includes('.')) {
        const parts = dateString.split('.');
        if (parts.length === 3) {
          const [day, month, year] = parts.map((part) => part.trim());
          const fullYear = year.length === 2 ? `20${year}` : year;
          return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }

      return null;
    };

    const parseAmount = (columns, bankId, returnRaw = false) => {
      for (let i = columns.length - 1; i >= 0; i--) {
        let rawColumn = columns[i].replace(/"/g, '').trim();

        if (!rawColumn) continue;
        if (!rawColumn.match(/[0-9]/)) continue;

        let amountStr = rawColumn;
        amountStr = amountStr.replace(/[€$£]/g, '').trim();

        // Handle European number formats
        if (amountStr.includes(',') && amountStr.includes('.')) {
          amountStr = amountStr.replace(/\./g, '');
          amountStr = amountStr.replace(',', '.');
        } else if (amountStr.includes(',') && !amountStr.includes('.')) {
          const parts = amountStr.split(',');
          if (parts.length === 2) {
            if (parts[1].length <= 2) {
              amountStr = amountStr.replace(',', '.');
            } else {
              amountStr = amountStr.replace(',', '');
            }
          } else {
            amountStr = amountStr.replace(/,/g, '');
          }
        } else if (amountStr.includes('.') && amountStr.match(/\.\d{3}/)) {
          amountStr = amountStr.replace(/,/g, '');
        }

        amountStr = amountStr.replace(/[^\d.-]/g, '');

        let isNegative =
          rawColumn.includes('-') ||
          rawColumn.toLowerCase().includes('soll') ||
          rawColumn.trim().startsWith('-') ||
          (bankId === 'volksbank' && i === 2);

        if (bankId === 'volksbank') {
          if (i === 2 && rawColumn && !rawColumn.includes('Haben')) {
            isNegative = true;
          } else if (i === 3 && rawColumn) {
            isNegative = false;
            amountStr = rawColumn.replace(/[^\d.-]/g, '');
          }
        }

        const amount = parseFloat(amountStr);

        if (!isNaN(amount) && amount !== 0) {
          const finalAmount = isNegative ? -Math.abs(amount) : Math.abs(amount);
          return returnRaw ? finalAmount : Math.abs(amount);
        }
      }
      return 0;
    };

    const parseDescription = (columns, bankId) => {
      const potentialDescriptionColumns = [];

      for (let i = 1; i < columns.length - 1; i++) {
        if (columns[i] && columns[i].trim()) {
          const cleanColumn = columns[i].replace(/"/g, '').trim();

          if (
            !cleanColumn.match(/^-?\d+([.,]\d+)?$/) &&
            !cleanColumn.match(/^\d{1,2}\.\d{1,2}\.\d{2,4}$/) &&
            cleanColumn.length > 1
          ) {
            potentialDescriptionColumns.push(cleanColumn);
          }
        }
      }

      if (potentialDescriptionColumns.length > 0) {
        const description = potentialDescriptionColumns.reduce(
          (longest, current) => (current.length > longest.length ? current : longest),
          '',
        );
        return description.substring(0, 100);
      }

      for (let i = 1; i < columns.length; i++) {
        if (columns[i] && columns[i].trim()) {
          const cleanColumn = columns[i].replace(/"/g, '').trim();
          if (!cleanColumn.match(/^-?\d+([.,]\d+)?$/)) {
            return cleanColumn.substring(0, 100) || 'Banktransaktion';
          }
        }
      }

      return 'Banktransaktion';
    };

    const autoCategorize = (description) => {
      const desc = description.toLowerCase();

      const rules = [
        {
          keywords: [
            'billa',
            'spar',
            'hofer',
            'lidl',
            'merkur',
            'mpreis',
            'interspar',
            'penny',
            'unimarkt',
            'dm ',
            'bipa',
          ],
          category_id: 1,
        },
        {
          keywords: [
            'miete',
            'wohnung',
            'hausverwaltung',
            'immobilie',
            'hausgeld',
            'wohnbau',
            'genossenschaft',
          ],
          category_id: 2,
        },
        {
          keywords: ['gehalt', 'lohn', 'entgelt', 'salary', 'payroll', 'arbeitsentgelt'],
          category_id: 3,
        },
        {
          keywords: [
            'tank',
            'omv',
            'shell',
            'jet',
            'aral',
            'bp',
            'agip',
            'avanti',
            'eneco',
            'tankstelle',
          ],
          category_id: 4,
        },
        {
          keywords: [
            'restaurant',
            'gasthaus',
            'wirtshaus',
            'cafe',
            'bäckerei',
            'mcdonalds',
            'burger',
            'pizza',
            'döner',
            'kebab',
          ],
          category_id: 5,
        },
        {
          keywords: [
            'energie',
            'strom',
            'wien energie',
            'kelag',
            'verbund',
            'evn',
            'linz strom',
            'gas',
            'fernwärme',
          ],
          category_id: 6,
        },
        {
          keywords: [
            'handy',
            'a1',
            'drei',
            'telekom',
            't-mobile',
            'mobilkom',
            'hot',
            'yesss',
            'telefon',
            'internet',
          ],
          category_id: 7,
        },
        {
          keywords: [
            'apotheke',
            'arzt',
            'krankenhaus',
            'doktor',
            'praxis',
            'spital',
            'pharmacy',
            'medizin',
          ],
          category_id: 8,
        },
        {
          keywords: [
            'kino',
            'theater',
            'konzert',
            'festival',
            'museum',
            'ausstellung',
            'kino',
            'film',
          ],
          category_id: 9,
        },
        {
          keywords: [
            'h&m',
            'c&a',
            'mango',
            'zara',
            'kik',
            'peek',
            'cloppenburg',
            'kleidung',
            'mode',
            'bekleidung',
          ],
          category_id: 10,
        },
      ];

      for (const rule of rules) {
        if (rule.keywords.some((keyword) => desc.includes(keyword))) {
          return rule.category_id;
        }
      }

      return 9;
    };

    const saveTransaction = async (transactionData) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const payload = {
        userId: userId,
        categoryId: transactionData.category_id,
        amount: Number(transactionData.amount),
        transactionType: transactionData.transaction_type,
        currency: transactionData.currency,
        date: transactionData.date + 'T00:00:00',
        description: transactionData.description,
      };

      const response = await axios.post('http://localhost:3000/transactions', payload);
      return response.data;
    };

    const addManualTransaction = async () => {
      const userId = getUserId();
      if (!userId) {
        $q.notify({
          type: 'negative',
          message: 'Bitte einloggen um Transaktionen zu speichern',
        });
        return;
      }

      savingTransaction.value = true;
      try {
        const payload = {
          userId: userId,
          categoryId: manualTransaction.value.category_id,
          amount: Math.abs(Number(manualTransaction.value.amount)),
          transactionType: manualTransaction.value.transaction_type,
          currency: 'EUR',
          date: manualTransaction.value.date + 'T00:00:00',
          description: manualTransaction.value.description,
        };

        await axios.post('http://localhost:3000/transactions', payload);

        $q.notify({
          type: 'positive',
          message: 'Transaktion erfolgreich gespeichert',
          icon: 'check',
        });

        manualTransaction.value = {
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          transaction_type: 'Ausgabe',
          category_id: null,
          description: '',
          payment_method: 'Karte',
        };

        fetchRecentTransactions();
      } catch (error) {
        console.error('Error adding transaction:', error);
        $q.notify({
          type: 'negative',
          message:
            'Fehler beim Speichern der Transaktion: ' +
            (error.response?.data?.message || error.message),
        });
      } finally {
        savingTransaction.value = false;
      }
    };

    const openQuickTransaction = (quickTx) => {
      manualTransaction.value = {
        date: new Date().toISOString().split('T')[0],
        amount: Math.abs(quickTx.amount),
        transaction_type: quickTx.transaction_type,
        category_id: quickTx.category_id,
        description: quickTx.description,
        payment_method: quickTx.payment_method,
      };
    };

    const fetchRecentTransactions = async () => {
      const userId = getUserId();
      if (!userId) return;

      try {
        const response = await axios.get(
          `http://localhost:3000/transactions/users/${userId}?limit=100`,
        );
        recentTransactions.value = response.data.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
          date: t.date.split('T')[0],
        }));
        updateCategorySummary();
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    // Filter functions
    const resetFilters = () => {
      searchText.value = '';
      transactionType.value = null;
      selectedCategories.value = [];
      amountRange.value = { min: 0, max: 5000 };
      sortOption.value = 'date_desc';
    };

    // Dialog function
    const openCategoryDialog = (cat) => {
      activeCategory.value = cat;
      showCategoryDialog.value = true;
    };

    // Export functions
    const exportCSV = () => {
      try {
        const headers = ['Datum', 'Beschreibung', 'Kategorie', 'Typ', 'Betrag'];
        const data = filteredTransactions.value.map((t) => ({
          date: t.date,
          description: t.description,
          category: getCategoryName(t.category_id),
          type: t.transaction_type === 'Einnahme' ? 'Einnahme' : 'Ausgabe',
          amount: `${t.transaction_type === 'Einnahme' ? '+' : '-'}${t.amount} ${
            t.currency || '€'
          }`,
        }));

        let csv = headers.join(';') + '\n';
        data.forEach((row) => {
          csv +=
            Object.values(row)
              .map((v) => `"${v}"`)
              .join(';') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transaktionen_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();

        $q.notify({ type: 'positive', message: 'CSV erfolgreich exportiert' });
      } catch (err) {
        console.error(err);
        $q.notify({ type: 'negative', message: 'Fehler beim CSV-Export' });
      }
    };

    const exportPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text('Transaktionsbericht', 105, 20, { align: 'center' });
        const tableData = filteredTransactions.value.map((t) => [
          t.date,
          t.description || 'Keine Beschreibung',
          getCategoryName(t.category_id),
          t.transaction_type === 'Einnahme' ? 'Einnahme' : 'Ausgabe',
          `${t.amount} ${t.currency || '€'}`,
        ]);
        autoTable(doc, {
          head: [['Datum', 'Beschreibung', 'Kategorie', 'Typ', 'Betrag']],
          body: tableData,
          startY: 30,
        });
        doc.save(`transaktionen_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: 'positive', message: 'PDF-Bericht erfolgreich generiert' });
      } catch (err) {
        console.error(err);
        $q.notify({ type: 'negative', message: 'Fehler beim PDF-Export' });
      }
    };

    const exportCategoryCSV = () => {
      try {
        const headers = ['Kategorie', 'Einnahmen', 'Ausgaben', 'Saldo'];
        const data = categorySummaries.value.map((cat) => ({
          category: cat.name,
          income: cat.income.toFixed(2),
          expenses: cat.expenses.toFixed(2),
          balance: (cat.income - cat.expenses).toFixed(2),
        }));
        let csv = headers.join(';') + '\n';
        data.forEach((row) => {
          csv +=
            Object.values(row)
              .map((v) => `"${v}"`)
              .join(';') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `kategorie_bericht_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        $q.notify({ type: 'positive', message: 'CSV erfolgreich exportiert' });
      } catch (err) {
        console.error(err);
        $q.notify({ type: 'negative', message: 'Fehler beim CSV-Export' });
      }
    };

    const exportCategoryPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text('Kategorie-Zusammenfassung', 105, 20, { align: 'center' });
        const tableData = categorySummaries.value.map((cat) => [
          cat.name,
          cat.income.toFixed(2),
          cat.expenses.toFixed(2),
          (cat.income - cat.expenses).toFixed(2),
        ]);
        autoTable(doc, {
          head: [['Kategorie', 'Einnahmen', 'Ausgaben', 'Saldo']],
          body: tableData,
          startY: 30,
        });
        doc.save(`kategorie_bericht_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: 'positive', message: 'PDF-Bericht erfolgreich generiert' });
      } catch (err) {
        console.error(err);
        $q.notify({ type: 'negative', message: 'Fehler beim PDF-Export' });
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('de-AT');
    };

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return '0,00';
      }
      return new Intl.NumberFormat('de-AT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const downloadSampleCSV = (bankId) => {
      let sampleContent = '';

      switch (bankId) {
        case 'erste':
          sampleContent =
            '"Datum";"Buchungstext";"Betrag"\n"30.09.2025";"MPREIS FILIALE 1234 WIEN";"-45,67"\n"29.09.2025";"GEHALT FIRMA GMBH";"2450,00"';
          break;
        case 'raiffeisen':
          sampleContent =
            '"Buchungstag";"Valuta";"Buchungstext";"Betrag"\n"30.09.2025";"30.09.2025";"TANKE SPAR 1234";"-78,90"';
          break;
        case 'bawag':
          sampleContent =
            '"Buchungsdatum";"Betrag";"Verwendungszweck"\n"30.09.2025";"-120,50";"BILLA EINKAUF 1234"';
          break;
        case 'volksbank':
          sampleContent =
            '"Datum";"Text";"Soll";"Haben"\n"30.09.2025";"ONLINE SHOPPING";"89,99";""';
          break;
        default:
          sampleContent =
            '"Datum";"Beschreibung";"Betrag"\n"30.09.2025";"Beispiel Transaktion";"-99,99"';
      }

      const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beispiel_${bankId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    };

    onMounted(async () => {
      await fetchCategories();
      await fetchRecentTransactions();
    });

    return {
      selectedBank,
      manualTransaction,
      recentTransactions,
      categories,
      savingTransaction,
      importingCSV,
      categorySummary,
      categorySummaries,

      // Filter variables
      searchText,
      transactionType,
      selectedCategories,
      amountRange,
      sortOption,
      typeOptions,
      sortOptions,
      categoryOptions,

      // Dialog state
      showCategoryDialog,
      activeCategory,

      austrianBanks,
      transactionTypes,
      paymentMethods,
      quickTransactions,
      handleFileUpload,
      addManualTransaction,
      openQuickTransaction,
      getBankName,
      getBankInstructions,
      getBankFormat,
      getCategoryName,
      formatDate,
      formatCurrency,
      downloadSampleCSV,

      // Filter functions
      resetFilters,

      // Dialog function
      openCategoryDialog,

      // Export functions
      exportCSV,
      exportPDF,
      exportCategoryCSV,
      exportCategoryPDF,
    };
  },
};
</script>

<style scoped>
.q-uploader {
  border: 2px dashed #1976d2;
  border-radius: 8px;
}

.text-green {
  color: #4caf50;
}

.text-red {
  color: #f44336;
}

.full-width {
  width: 100%;
}

.my-card {
  width: 100%;
  transition: transform 0.3s;
  cursor: pointer;
}
.my-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.q-btn-group {
  margin-bottom: 16px;
}

/* Custom styling for expansion items */
.q-expansion-item__content {
  background-color: #f8f9fa;
}
</style>
