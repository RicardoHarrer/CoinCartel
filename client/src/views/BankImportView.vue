<template>
  <div class="modern-bank-import">
    <!-- Compact Header -->
    <div class="compact-header">
      <div class="header-main">
        <q-btn icon="arrow_back" flat round dense @click="$router.back()" />
        <div class="header-title">
          <h1>🏦 Bank Import</h1>
          <p>Import transactions from Austrian banks</p>
        </div>
      </div>
      <div class="header-actions">
        <q-btn icon="refresh" flat round dense @click="fetchRecentTransactions" />
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="compact-grid">
      <!-- Left Column - Import Functions -->
      <div class="import-section">
        <!-- Bank Selection -->
        <q-card class="compact-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="account_balance" size="20px" />
              <h3>Select Bank</h3>
            </div>
            <q-select
              v-model="selectedBank"
              :options="austrianBanks"
              label="Your bank"
              option-label="name"
              option-value="id"
              filled
              dense
              emit-value
              map-options
              class="q-mb-sm"
            />
          </q-card-section>
        </q-card>

        <!-- CSV Upload -->
        <q-card class="compact-card" v-if="selectedBank">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="upload" size="20px" />
              <h3>Import Statement</h3>
              <q-btn
                label="Sample CSV"
                outline
                color="primary"
                size="sm"
                @click="downloadSampleCSV(selectedBank)"
                dense
              />
            </div>

            <q-uploader
              label="Upload CSV file"
              accept=".csv,.txt"
              @added="handleFileUpload"
              :disable="importingCSV"
              flat
              bordered
              dense
              class="q-mb-sm"
            >
              <template v-slot:list="scope">
                <q-list dense>
                  <q-item v-for="file in scope.files" :key="file.name">
                    <q-item-section>
                      <q-item-label class="ellipsis">{{ file.name }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-spinner v-if="importingCSV" color="primary" size="1em" />
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

            <div class="bank-info">
              <div class="info-text">
                <strong>{{ getBankName(selectedBank) }}:</strong>
                {{ getBankInstructions(selectedBank) }}
              </div>
              <div class="format-text">Format: {{ getBankFormat(selectedBank) }}</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Quick Transactions -->
        <q-card class="compact-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="bolt" size="20px" />
              <h3>Quick Entries</h3>
            </div>
            <div class="quick-buttons">
              <q-btn
                v-for="quickTx in quickTransactions"
                :key="quickTx.label"
                :label="quickTx.label"
                :color="quickTx.color"
                outline
                size="sm"
                @click="openQuickTransaction(quickTx)"
                class="quick-btn"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Manual Entry -->
        <q-card class="compact-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="edit" size="20px" />
              <h3>Manual Entry</h3>
            </div>

            <q-form @submit="addManualTransaction" class="compact-form">
              <div class="form-row">
                <q-input
                  filled
                  v-model="manualTransaction.date"
                  label="Date"
                  type="date"
                  dense
                  class="col"
                  required
                />
                <q-input
                  filled
                  v-model.number="manualTransaction.amount"
                  label="Amount (€)"
                  type="number"
                  step="0.01"
                  dense
                  class="col"
                  required
                />
              </div>

              <div class="form-row">
                <q-select
                  filled
                  v-model="manualTransaction.transaction_type"
                  :options="transactionTypes"
                  label="Type"
                  dense
                  class="col"
                  required
                  emit-value
                  map-options
                />
                <q-select
                  filled
                  v-model.number="manualTransaction.category_id"
                  :options="categories"
                  label="Category"
                  option-label="name"
                  option-value="id"
                  dense
                  class="col"
                  required
                  emit-value
                  map-options
                />
              </div>

              <q-input
                filled
                v-model="manualTransaction.description"
                label="Description"
                dense
                required
                class="q-mb-sm"
              />

              <q-select
                filled
                v-model="manualTransaction.payment_method"
                :options="paymentMethods"
                label="Payment Method"
                dense
                emit-value
                map-options
              />

              <div class="form-actions">
                <q-btn
                  label="Save Transaction"
                  type="submit"
                  color="primary"
                  icon="save"
                  :loading="savingTransaction"
                  class="save-btn"
                  dense
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column - Data & Filters -->
      <div class="data-section">
        <!-- Filters -->
        <q-card class="compact-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="filter_alt" size="20px" />
              <h3>Filters & Search</h3>
              <q-btn
                label="Reset"
                color="negative"
                flat
                size="sm"
                @click="resetFilters"
                dense
              />
            </div>

            <div class="filter-grid">
              <q-input
                v-model="searchText"
                label="Search"
                clearable
                outlined
                dense
                class="full-width"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>

              <q-select
                v-model="transactionType"
                :options="typeOptions"
                label="Type"
                outlined
                dense
                clearable
                emit-value
                map-options
              />

              <q-select
                v-model="sortOption"
                :options="sortOptions"
                label="Sort by"
                outlined
                dense
                emit-value
                map-options
              />

              <q-select
                v-model="selectedCategories"
                :options="categoryOptions"
                label="Categories"
                multiple
                outlined
                dense
                use-chips
                emit-value
                map-options
              />
            </div>

            <div class="amount-range">
              <div class="range-label">
                Amount Range: {{ amountRange.min }}€ - {{ amountRange.max }}€
              </div>
              <q-range
                v-model="amountRange"
                :min="0"
                :max="5000"
                :step="10"
                color="primary"
                dense
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Export Buttons -->
        <q-card class="compact-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="download" size="20px" />
              <h3>Export Data</h3>
            </div>
            <div class="export-buttons">
              <q-btn
                color="primary"
                icon="picture_as_pdf"
                label="Transactions PDF"
                @click="exportPDF"
                outline
                dense
                class="export-btn"
              />
              <q-btn
                color="positive"
                icon="text_snippet"
                label="Transactions CSV"
                @click="exportCSV"
                outline
                dense
                class="export-btn"
              />
              <q-btn
                color="secondary"
                icon="pie_chart"
                label="Categories PDF"
                @click="exportCategoryPDF"
                outline
                dense
                class="export-btn"
              />
              <q-btn
                color="teal"
                icon="analytics"
                label="Categories CSV"
                @click="exportCategoryCSV"
                outline
                dense
                class="export-btn"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Category Summary -->
        <q-card class="compact-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="analytics" size="20px" />
              <h3>Category Summary</h3>
            </div>

            <!-- Summary Stats -->
            <div class="summary-stats">
              <div class="stat-item income">
                <div class="stat-icon">↑</div>
                <div class="stat-content">
                  <div class="stat-value">
                    +{{ formatCurrency(categorySummary.totalIncome) }}
                  </div>
                  <div class="stat-label">Income</div>
                </div>
              </div>
              <div class="stat-item expense">
                <div class="stat-icon">↓</div>
                <div class="stat-content">
                  <div class="stat-value">
                    -{{ formatCurrency(categorySummary.totalExpenses) }}
                  </div>
                  <div class="stat-label">Expenses</div>
                </div>
              </div>
              <div
                class="stat-item balance"
                :class="categorySummary.balance >= 0 ? 'positive' : 'negative'"
              >
                <div class="stat-icon">⚖️</div>
                <div class="stat-content">
                  <div class="stat-value">
                    {{ categorySummary.balance >= 0 ? "+" : ""
                    }}{{ formatCurrency(categorySummary.balance) }}
                  </div>
                  <div class="stat-label">Balance</div>
                </div>
              </div>
            </div>

            <!-- Categories Grid -->
            <div class="categories-grid">
              <div
                v-for="cat in categorySummaries"
                :key="cat.id"
                class="category-card"
                @click="openCategoryDialog(cat)"
              >
                <div class="category-header">
                  <div class="category-name">{{ cat.name }}</div>
                  <div class="transaction-count">{{ cat.transactionCount }}</div>
                </div>
                <div class="category-amounts">
                  <div class="amount income">+{{ formatCurrency(cat.income) }}</div>
                  <div class="amount expense">-{{ formatCurrency(cat.expenses) }}</div>
                  <div
                    class="amount net"
                    :class="cat.netAmount >= 0 ? 'positive' : 'negative'"
                  >
                    {{ cat.netAmount >= 0 ? "+" : "" }}{{ formatCurrency(cat.netAmount) }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="categorySummaries.length === 0" class="empty-state">
              <q-icon name="pie_chart" size="32px" color="grey-4" />
              <div>No category data available</div>
              <div class="text-caption">Adjust filters or import transactions</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Category Details Dialog -->
    <q-dialog v-model="showCategoryDialog">
      <q-card style="min-width: 600px; max-width: 80vw">
        <q-card-section class="dialog-header">
          <div class="dialog-title">{{ activeCategory?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="dialog-stats">
            <div class="dialog-stat">
              <div class="stat-label">Income</div>
              <div class="stat-value positive">
                +{{ formatCurrency(activeCategory?.income || 0) }}
              </div>
            </div>
            <div class="dialog-stat">
              <div class="stat-label">Expenses</div>
              <div class="stat-value negative">
                -{{ formatCurrency(activeCategory?.expenses || 0) }}
              </div>
            </div>
            <div class="dialog-stat">
              <div class="stat-label">Net</div>
              <div
                class="stat-value"
                :class="(activeCategory?.netAmount || 0) >= 0 ? 'positive' : 'negative'"
              >
                {{ (activeCategory?.netAmount || 0) >= 0 ? "+" : ""
                }}{{ formatCurrency(activeCategory?.netAmount || 0) }}
              </div>
            </div>
          </div>

          <q-list separator dense>
            <q-item
              v-for="tx in activeCategory?.transactions || []"
              :key="tx.id"
              class="transaction-item"
            >
              <q-item-section avatar>
                <q-icon
                  :name="
                    tx.transaction_type === 'Einnahme' ? 'arrow_upward' : 'arrow_downward'
                  "
                  :color="tx.transaction_type === 'Einnahme' ? 'positive' : 'negative'"
                  size="sm"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="transaction-description">{{
                  tx.description || "No description"
                }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(tx.date) }}
                  <span v-if="tx.payment_method">• {{ tx.payment_method }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label
                  :class="
                    tx.transaction_type === 'Einnahme' ? 'text-positive' : 'text-negative'
                  "
                  class="text-weight-bold"
                >
                  {{ tx.transaction_type === "Einnahme" ? "+" : "-"
                  }}{{ formatCurrency(tx.amount) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { auth } from "@/utils/auth";
import { jwtDecode } from "jwt-decode";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default {
  name: "AustrianBankImport",
  setup() {
    const $q = useQuasar();
    const router = useRouter();

    const selectedBank = ref(null);
    const manualTransaction = ref({
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      transaction_type: "Ausgabe",
      category_id: null,
      description: "",
      payment_method: "Karte",
    });
    const recentTransactions = ref([]);
    const categories = ref([]);
    const savingTransaction = ref(false);
    const importingCSV = ref(false);

    // Filter variables
    const searchText = ref("");
    const transactionType = ref(null);
    const selectedCategories = ref([]);
    const amountRange = ref({ min: 0, max: 5000 });
    const sortOption = ref("date_desc");

    const typeOptions = [
      { label: "Einnahme", value: "Einnahme" },
      { label: "Ausgabe", value: "Ausgabe" },
    ];

    const sortOptions = [
      { label: "Datum (Neueste zuerst)", value: "date_desc" },
      { label: "Datum (Älteste zuerst)", value: "date_asc" },
      { label: "Betrag (Höchste zuerst)", value: "amount_desc" },
      { label: "Betrag (Niedrigste zuerst)", value: "amount_asc" },
    ];

    const categoryOptions = computed(() =>
      categories.value.map((c) => ({ label: c.name, value: c.id }))
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
        id: "erste",
        name: "Erste Bank und Sparkassen",
        format: "Datum;Buchungstext;Betrag",
        instruction:
          'Im Online-Banking: "Kontoauszug exportieren" > "CSV Format" auswählen',
      },
      {
        id: "raiffeisen",
        name: "Raiffeisen Bank",
        format: "Buchungstag;Valuta;Buchungstext;Betrag",
        instruction: 'Im Raiffeisen Online-Banking: "Umsätze exportieren" > CSV',
      },
      {
        id: "bawag",
        name: "BAWAG PSK",
        format: "Buchungsdatum;Betrag;Verwendungszweck",
        instruction: 'BAWAG Online-Banking: "Kontoauszug" > "Exportieren" > CSV',
      },
      {
        id: "volksbank",
        name: "Volksbanken",
        format: "Datum;Text;Soll;Haben",
        instruction: "Volksbank Online-Banking: Umsatzübersicht exportieren",
      },
      {
        id: "other",
        name: "Andere österreichische Bank",
        format: "Datum;Beschreibung;Betrag",
        instruction: "CSV-Datei mit Datum, Beschreibung und Betrag hochladen",
      },
    ]);

    const transactionTypes = ref([
      { label: "💰 Einnahme", value: "Einnahme" },
      { label: "💸 Ausgabe", value: "Ausgabe" },
    ]);

    const paymentMethods = ref([
      { label: "💳 Karte", value: "Karte" },
      { label: "💵 Bar", value: "Bar" },
      { label: "🏦 Überweisung", value: "Überweisung" },
      { label: "🔄 Dauerauftrag", value: "Dauerauftrag" },
      { label: "📱 Online", value: "Online" },
      { label: "🏦 Bank", value: "Bank" },
    ]);

    const quickTransactions = ref([
      {
        label: "🏠 Miete",
        amount: -850,
        category_id: 2,
        transaction_type: "Ausgabe",
        description: "Monatsmiete",
        payment_method: "Überweisung",
        color: "blue",
      },
      {
        label: "🛒 Einkauf",
        amount: -120,
        category_id: 1,
        transaction_type: "Ausgabe",
        description: "Wocheneinkauf",
        payment_method: "Karte",
        color: "green",
      },
      {
        label: "💼 Gehalt",
        amount: 2500,
        category_id: 3,
        transaction_type: "Einnahme",
        description: "Monatsgehalt",
        payment_method: "Überweisung",
        color: "positive",
      },
      {
        label: "🚗 Tanken",
        amount: -80,
        category_id: 4,
        transaction_type: "Ausgabe",
        description: "Tankfüllung",
        payment_method: "Karte",
        color: "orange",
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
        const response = await axios.get("http://localhost:3000/categories");
        categories.value = response.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const getBankName = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.name : "Unbekannte Bank";
    };

    const getBankInstructions = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.instruction : "CSV-Datei mit Transaktionen hochladen";
    };

    const getBankFormat = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.format : "Datum;Beschreibung;Betrag";
    };

    const getCategoryName = (categoryId) => {
      const category = categories.value.find((c) => c.id === categoryId);
      return category ? category.name : "Unkategorisiert";
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
            getCategoryName(tx.category_id).toLowerCase().includes(search)
        );
      }

      // Transaction type filter
      if (transactionType.value) {
        filtered = filtered.filter((tx) => tx.transaction_type === transactionType.value);
      }

      // Category filter
      if (selectedCategories.value.length > 0) {
        filtered = filtered.filter((tx) =>
          selectedCategories.value.includes(tx.category_id)
        );
      }

      // Amount range filter
      filtered = filtered.filter(
        (tx) => tx.amount >= amountRange.value.min && tx.amount <= amountRange.value.max
      );

      // Sorting
      switch (sortOption.value) {
        case "date_asc":
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case "date_desc":
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case "amount_asc":
          filtered.sort((a, b) => a.amount - b.amount);
          break;
        case "amount_desc":
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
          console.warn("Skipping transaction with invalid amount:", tx);
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

        if (tx.transaction_type === "Einnahme") {
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
        (a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount)
      );

      summary.balance = summary.totalIncome - summary.totalExpenses;
      categorySummary.value = summary;
    };

    // Watch for filter changes to update the summary
    watch(
      [searchText, transactionType, selectedCategories, amountRange, sortOption],
      () => {
        updateCategorySummary();
      }
    );

    const handleFileUpload = (files) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        $q.notify({
          type: "negative",
          message: "Datei zu groß. Maximal 5MB erlaubt.",
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
              type: "warning",
              message: "Keine gültigen Transaktionen in der CSV-Datei gefunden.",
              timeout: 5000,
            });
            return;
          }

          const totalIncome = transactions
            .filter((tx) => tx.transaction_type === "Einnahme")
            .reduce((sum, tx) => sum + Number(tx.amount), 0);
          const totalExpenses = transactions
            .filter((tx) => tx.transaction_type === "Ausgabe")
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

          let successCount = 0;
          let errorCount = 0;

          for (const tx of transactions) {
            try {
              await saveTransaction(tx);
              successCount++;
            } catch (error) {
              console.error("Error saving transaction:", error);
              errorCount++;
            }
          }

          $q.notify({
            type: successCount > 0 ? "positive" : "warning",
            message: `${successCount} Transaktionen importiert (Einnahmen: ${formatCurrency(
              totalIncome
            )}, Ausgaben: ${formatCurrency(totalExpenses)})${
              errorCount > 0 ? `, ${errorCount} Fehler` : ""
            }`,
            timeout: 6000,
          });

          fetchRecentTransactions();
        } catch (error) {
          console.error("Error parsing CSV:", error);
          $q.notify({
            type: "negative",
            message: "Fehler beim Import der CSV-Datei. Bitte Format überprüfen.",
            timeout: 5000,
          });
        } finally {
          importingCSV.value = false;
        }
      };

      reader.readAsText(file, "UTF-8");
    };

    const parseCSV = (content, bankId) => {
      const lines = content.split("\n").filter((line) => line.trim());
      const transactions = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          // Skip header lines
          if (
            i === 0 &&
            lines[i].toLowerCase().includes("datum") &&
            lines[i].toLowerCase().includes("betrag")
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
          let currentField = "";
          let inQuotes = false;

          for (let char of cleanLine) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ";" && !inQuotes) {
              columns.push(currentField.trim());
              currentField = "";
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
                transaction_type: rawAmount > 0 ? "Einnahme" : "Ausgabe",
                category_id: autoCategorize(parseDescription(columns, bankId)),
                payment_method: "Bank",
                currency: "EUR",
              };

              if (transaction.date && transaction.amount > 0 && transaction.description) {
                transactions.push(transaction);
              }
            }
          }
        } catch (error) {
          console.warn("Skipping invalid CSV line:", lines[i], error);
        }
      }

      return transactions;
    };

    const parseDate = (dateString, bankId) => {
      if (!dateString) return null;

      dateString = dateString.replace(/"/g, "");

      if (dateString.includes(".")) {
        const parts = dateString.split(".");
        if (parts.length === 3) {
          const [day, month, year] = parts.map((part) => part.trim());
          const fullYear = year.length === 2 ? `20${year}` : year;
          return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }

      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }

      return null;
    };

    const parseAmount = (columns, bankId, returnRaw = false) => {
      for (let i = columns.length - 1; i >= 0; i--) {
        let rawColumn = columns[i].replace(/"/g, "").trim();

        if (!rawColumn) continue;
        if (!rawColumn.match(/[0-9]/)) continue;

        let amountStr = rawColumn;
        amountStr = amountStr.replace(/[€$£]/g, "").trim();

        // Handle European number formats
        if (amountStr.includes(",") && amountStr.includes(".")) {
          amountStr = amountStr.replace(/\./g, "");
          amountStr = amountStr.replace(",", ".");
        } else if (amountStr.includes(",") && !amountStr.includes(".")) {
          const parts = amountStr.split(",");
          if (parts.length === 2) {
            if (parts[1].length <= 2) {
              amountStr = amountStr.replace(",", ".");
            } else {
              amountStr = amountStr.replace(",", "");
            }
          } else {
            amountStr = amountStr.replace(/,/g, "");
          }
        } else if (amountStr.includes(".") && amountStr.match(/\.\d{3}/)) {
          amountStr = amountStr.replace(/,/g, "");
        }

        amountStr = amountStr.replace(/[^\d.-]/g, "");

        let isNegative =
          rawColumn.includes("-") ||
          rawColumn.toLowerCase().includes("soll") ||
          rawColumn.trim().startsWith("-") ||
          (bankId === "volksbank" && i === 2);

        if (bankId === "volksbank") {
          if (i === 2 && rawColumn && !rawColumn.includes("Haben")) {
            isNegative = true;
          } else if (i === 3 && rawColumn) {
            isNegative = false;
            amountStr = rawColumn.replace(/[^\d.-]/g, "");
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
          const cleanColumn = columns[i].replace(/"/g, "").trim();

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
          ""
        );
        return description.substring(0, 100);
      }

      for (let i = 1; i < columns.length; i++) {
        if (columns[i] && columns[i].trim()) {
          const cleanColumn = columns[i].replace(/"/g, "").trim();
          if (!cleanColumn.match(/^-?\d+([.,]\d+)?$/)) {
            return cleanColumn.substring(0, 100) || "Banktransaktion";
          }
        }
      }

      return "Banktransaktion";
    };

    const autoCategorize = (description) => {
      const desc = description.toLowerCase();

      const rules = [
        {
          keywords: [
            "billa",
            "spar",
            "hofer",
            "lidl",
            "merkur",
            "mpreis",
            "interspar",
            "penny",
            "unimarkt",
            "dm ",
            "bipa",
          ],
          category_id: 1,
        },
        {
          keywords: [
            "miete",
            "wohnung",
            "hausverwaltung",
            "immobilie",
            "hausgeld",
            "wohnbau",
            "genossenschaft",
          ],
          category_id: 2,
        },
        {
          keywords: ["gehalt", "lohn", "entgelt", "salary", "payroll", "arbeitsentgelt"],
          category_id: 3,
        },
        {
          keywords: [
            "tank",
            "omv",
            "shell",
            "jet",
            "aral",
            "bp",
            "agip",
            "avanti",
            "eneco",
            "tankstelle",
          ],
          category_id: 4,
        },
        {
          keywords: [
            "restaurant",
            "gasthaus",
            "wirtshaus",
            "cafe",
            "bäckerei",
            "mcdonalds",
            "burger",
            "pizza",
            "döner",
            "kebab",
          ],
          category_id: 5,
        },
        {
          keywords: [
            "energie",
            "strom",
            "wien energie",
            "kelag",
            "verbund",
            "evn",
            "linz strom",
            "gas",
            "fernwärme",
          ],
          category_id: 6,
        },
        {
          keywords: [
            "handy",
            "a1",
            "drei",
            "telekom",
            "t-mobile",
            "mobilkom",
            "hot",
            "yesss",
            "telefon",
            "internet",
          ],
          category_id: 7,
        },
        {
          keywords: [
            "apotheke",
            "arzt",
            "krankenhaus",
            "doktor",
            "praxis",
            "spital",
            "pharmacy",
            "medizin",
          ],
          category_id: 8,
        },
        {
          keywords: [
            "kino",
            "theater",
            "konzert",
            "festival",
            "museum",
            "ausstellung",
            "kino",
            "film",
          ],
          category_id: 9,
        },
        {
          keywords: [
            "h&m",
            "c&a",
            "mango",
            "zara",
            "kik",
            "peek",
            "cloppenburg",
            "kleidung",
            "mode",
            "bekleidung",
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
        throw new Error("User not authenticated");
      }

      const payload = {
        userId: userId,
        categoryId: transactionData.category_id,
        amount: Number(transactionData.amount),
        transactionType: transactionData.transaction_type,
        currency: transactionData.currency,
        date: transactionData.date + "T00:00:00",
        description: transactionData.description,
      };

      const response = await axios.post("http://localhost:3000/transactions", payload);
      return response.data;
    };

    const addManualTransaction = async () => {
      const userId = getUserId();
      if (!userId) {
        $q.notify({
          type: "negative",
          message: "Bitte einloggen um Transaktionen zu speichern",
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
          currency: "EUR",
          date: manualTransaction.value.date + "T00:00:00",
          description: manualTransaction.value.description,
        };

        await axios.post("http://localhost:3000/transactions", payload);

        $q.notify({
          type: "positive",
          message: "Transaktion erfolgreich gespeichert",
          icon: "check",
        });

        manualTransaction.value = {
          date: new Date().toISOString().split("T")[0],
          amount: 0,
          transaction_type: "Ausgabe",
          category_id: null,
          description: "",
          payment_method: "Karte",
        };

        fetchRecentTransactions();
      } catch (error) {
        console.error("Error adding transaction:", error);
        $q.notify({
          type: "negative",
          message:
            "Fehler beim Speichern der Transaktion: " +
            (error.response?.data?.message || error.message),
        });
      } finally {
        savingTransaction.value = false;
      }
    };

    const openQuickTransaction = (quickTx) => {
      manualTransaction.value = {
        date: new Date().toISOString().split("T")[0],
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
          `http://localhost:3000/transactions/users/${userId}?limit=100`
        );
        recentTransactions.value = response.data.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
          date: t.date.split("T")[0],
        }));
        updateCategorySummary();
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    // Filter functions
    const resetFilters = () => {
      searchText.value = "";
      transactionType.value = null;
      selectedCategories.value = [];
      amountRange.value = { min: 0, max: 5000 };
      sortOption.value = "date_desc";
    };

    // Dialog function
    const openCategoryDialog = (cat) => {
      activeCategory.value = cat;
      showCategoryDialog.value = true;
    };

    // Export functions
    const exportCSV = () => {
      try {
        const headers = ["Datum", "Beschreibung", "Kategorie", "Typ", "Betrag"];
        const data = filteredTransactions.value.map((t) => ({
          date: t.date,
          description: t.description,
          category: getCategoryName(t.category_id),
          type: t.transaction_type === "Einnahme" ? "Einnahme" : "Ausgabe",
          amount: `${t.transaction_type === "Einnahme" ? "+" : "-"}${t.amount} ${
            t.currency || "€"
          }`,
        }));

        let csv = headers.join(";") + "\n";
        data.forEach((row) => {
          csv +=
            Object.values(row)
              .map((v) => `"${v}"`)
              .join(";") + "\n";
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `transaktionen_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();

        $q.notify({ type: "positive", message: "CSV erfolgreich exportiert" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Fehler beim CSV-Export" });
      }
    };

    const exportPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text("Transaktionsbericht", 105, 20, { align: "center" });
        const tableData = filteredTransactions.value.map((t) => [
          t.date,
          t.description || "Keine Beschreibung",
          getCategoryName(t.category_id),
          t.transaction_type === "Einnahme" ? "Einnahme" : "Ausgabe",
          `${t.amount} ${t.currency || "€"}`,
        ]);
        autoTable(doc, {
          head: [["Datum", "Beschreibung", "Kategorie", "Typ", "Betrag"]],
          body: tableData,
          startY: 30,
        });
        doc.save(`transaktionen_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: "positive", message: "PDF-Bericht erfolgreich generiert" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Fehler beim PDF-Export" });
      }
    };

    const exportCategoryCSV = () => {
      try {
        const headers = ["Kategorie", "Einnahmen", "Ausgaben", "Saldo"];
        const data = categorySummaries.value.map((cat) => ({
          category: cat.name,
          income: cat.income.toFixed(2),
          expenses: cat.expenses.toFixed(2),
          balance: (cat.income - cat.expenses).toFixed(2),
        }));
        let csv = headers.join(";") + "\n";
        data.forEach((row) => {
          csv +=
            Object.values(row)
              .map((v) => `"${v}"`)
              .join(";") + "\n";
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `kategorie_bericht_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        $q.notify({ type: "positive", message: "CSV erfolgreich exportiert" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Fehler beim CSV-Export" });
      }
    };

    const exportCategoryPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text("Kategorie-Zusammenfassung", 105, 20, { align: "center" });
        const tableData = categorySummaries.value.map((cat) => [
          cat.name,
          cat.income.toFixed(2),
          cat.expenses.toFixed(2),
          (cat.income - cat.expenses).toFixed(2),
        ]);
        autoTable(doc, {
          head: [["Kategorie", "Einnahmen", "Ausgaben", "Saldo"]],
          body: tableData,
          startY: 30,
        });
        doc.save(`kategorie_bericht_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: "positive", message: "PDF-Bericht erfolgreich generiert" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Fehler beim PDF-Export" });
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("de-AT");
    };

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return "0,00";
      }
      return new Intl.NumberFormat("de-AT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const downloadSampleCSV = (bankId) => {
      let sampleContent = "";

      switch (bankId) {
        case "erste":
          sampleContent =
            '"Datum";"Buchungstext";"Betrag"\n"30.09.2025";"MPREIS FILIALE 1234 WIEN";"-45,67"\n"29.09.2025";"GEHALT FIRMA GMBH";"2450,00"';
          break;
        case "raiffeisen":
          sampleContent =
            '"Buchungstag";"Valuta";"Buchungstext";"Betrag"\n"30.09.2025";"30.09.2025";"TANKE SPAR 1234";"-78,90"';
          break;
        case "bawag":
          sampleContent =
            '"Buchungsdatum";"Betrag";"Verwendungszweck"\n"30.09.2025";"-120,50";"BILLA EINKAUF 1234"';
          break;
        case "volksbank":
          sampleContent =
            '"Datum";"Text";"Soll";"Haben"\n"30.09.2025";"ONLINE SHOPPING";"89,99";""';
          break;
        default:
          sampleContent =
            '"Datum";"Beschreibung";"Betrag"\n"30.09.2025";"Beispiel Transaktion";"-99,99"';
      }

      const blob = new Blob([sampleContent], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
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

<style scoped lang="scss">
.modern-bank-import {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 0;

  .header-main {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-title {
      h1 {
        margin: 0;
        font-size: 1.8rem;
        background: linear-gradient(45deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      p {
        margin: 4px 0 0 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
    }
  }
}

.compact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.compact-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;

  .card-section {
    padding: 20px;

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #2d3748;
        flex: 1;
      }

      .q-icon {
        color: #667eea;
      }
    }
  }
}

.bank-info {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #667eea;

  .info-text {
    font-size: 0.85rem;
    color: #4b5563;
    margin-bottom: 4px;
  }

  .format-text {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
  }
}

.quick-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  .quick-btn {
    font-size: 0.8rem;
  }
}

.compact-form {
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .form-actions {
    margin-top: 16px;
    text-align: center;

    .save-btn {
      width: 100%;
      border-radius: 8px;
      font-weight: 600;
    }
  }
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;

  .full-width {
    grid-column: 1 / -1;
  }
}

.amount-range {
  .range-label {
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 8px;
    text-align: center;
  }
}

.export-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  .export-btn {
    font-size: 0.8rem;
  }
}

.summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;

    &.income {
      border-left: 3px solid #10b981;
    }

    &.expense {
      border-left: 3px solid #ef4444;
    }

    &.balance.positive {
      border-left: 3px solid #3b82f6;
    }

    &.balance.negative {
      border-left: 3px solid #f59e0b;
    }

    .stat-icon {
      font-size: 1.2rem;
    }

    .stat-content {
      .stat-value {
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 2px;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #6b7280;
      }
    }
  }
}

.categories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .category-card {
    padding: 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .category-name {
        font-weight: 600;
        color: #2d3748;
        font-size: 0.9rem;
      }

      .transaction-count {
        background: #667eea;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .category-amounts {
      .amount {
        font-size: 0.8rem;
        margin-bottom: 2px;

        &.income {
          color: #10b981;
        }

        &.expense {
          color: #ef4444;
        }

        &.net.positive {
          color: #3b82f6;
          font-weight: 700;
        }

        &.net.negative {
          color: #f59e0b;
          font-weight: 700;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;

  .q-icon {
    margin-bottom: 12px;
    opacity: 0.5;
  }
}

/* Dialog Styles */
.dialog-header {
  display: flex;
  align-items: center;
  padding: 20px 20px 0 20px;

  .dialog-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #2d3748;
  }
}

.dialog-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  .dialog-stat {
    text-align: center;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;

    .stat-label {
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;

      &.positive {
        color: #10b981;
      }

      &.negative {
        color: #ef4444;
      }
    }
  }
}

.transaction-item {
  padding: 12px 0;

  .transaction-description {
    font-size: 0.9rem;
    font-weight: 500;
  }
}

/* Dark Mode */
body.body--dark {
  .compact-card {
    background: #1f2937;

    .card-section .section-header h3 {
      color: #f9fafb;
    }
  }

  .bank-info {
    background: #374151;
    color: #d1d5db;
  }

  .summary-stats .stat-item,
  .categories-grid .category-card {
    background: #374151;
    border-color: #4b5563;

    .stat-content .stat-label,
    .category-header .category-name {
      color: #d1d5db;
    }
  }

  .dialog-stats .dialog-stat {
    background: #374151;
  }
}

@media (max-width: 768px) {
  .modern-bank-import {
    padding: 12px;
  }

  .compact-grid {
    gap: 12px;
  }

  .compact-card .card-section {
    padding: 16px;
  }

  .summary-stats,
  .categories-grid,
  .filter-grid,
  .quick-buttons,
  .export-buttons {
    grid-template-columns: 1fr;
  }

  .compact-form .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
