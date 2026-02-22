<template>
  <div class="bank-import-view" :class="{ 'bank-import-view--embedded': embedded }">
      <div v-if="!embedded" class="dark-mode-toggle">
        <q-btn 
          round 
          :color="$q.dark.isActive ? 'grey-9' : 'yellow-9'" 
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'" 
          class="toggle-btn"
          @click="toggleDarkMode"
          size="lg"
        />
      </div>

      <div class="compact-header q-mb-lg">
        <div class="header-content">
          <q-btn
            v-if="!embedded"
            icon="arrow_back" 
            flat 
            round 
            dense 
            @click="$router.back()" 
            class="q-mr-sm"
          />
          <div>
            <h1 class="text-h4 text-weight-bold text-dark q-mb-xs">Bank Import</h1>
            <p class="text-subtitle1 text-grey-7">Import transactions from Austrian banks</p>
          </div>
        </div>
        <q-btn 
          icon="refresh" 
          flat 
          round 
          dense 
          @click="fetchRecentTransactions" 
        />
      </div>

      <div class="main-grid">
        <div class="left-column">
          <q-card class="compact-card">
            <q-card-section class="card-section">
              <div class="section-header">
                <q-icon name="account_balance" size="20px" class="text-primary" />
                <h3 class="text-h6 text-weight-medium">Bank Import</h3>
              </div>
              

<q-btn
  v-if="!bankConnected"
  color="primary"
  icon="account_balance"
  label="Connect bank (online)"
  class="q-mb-md full-width"
  @click="connectBank"
/>

<q-banner
  v-else
  dense
  rounded
  class="bg-positive text-white q-mb-md"
>
  ✅ Bank connected successfully
</q-banner>

            </q-card-section>
          </q-card>

          <q-card class="compact-card">
            <q-card-section class="card-section">
              <div class="section-header">
                <q-icon name="bolt" size="20px" class="text-primary" />
                <h3 class="text-h6 text-weight-medium">Quick Actions</h3>
              </div>
              <div class="quick-grid">
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
          <q-card class="compact-card">
            <q-card-section class="card-section">
              <div class="section-header">
                <q-icon name="download" size="20px" class="text-primary" />
                <h3 class="text-h6 text-weight-medium">Export</h3>
              </div>
              <div class="export-grid">
                <q-btn
                  color="primary"
                  icon="picture_as_pdf"
                  label="PDF"
                  @click="exportPDF"
                  outline
                  dense
                  class="export-btn"
                />
                <q-btn
                  color="positive"
                  icon="text_snippet"
                  label="CSV"
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
        </div>

        <div class="right-column">
          <q-card
            class="compact-card"
            :class="{ 'manual-entry-card--embedded': embedded }"
          >
            <q-card-section class="card-section">
              <div class="section-header">
                <q-icon name="edit" size="20px" class="text-primary" />
                <h3 class="text-h6 text-weight-medium">Manual Entry</h3>
              </div>

              <q-form @submit.prevent="addManualTransaction" class="compact-form">
                <div class="form-grid">
                  <q-input
                    filled
                    v-model="manualTransaction.date"
                    label="Date"
                    type="date"
                    dense
                    class="full-width"
                    required
                  />
                  <q-input
                    filled
                    v-model.number="manualTransaction.amount"
                    label="Amount (€)"
                    type="number"
                    step="0.01"
                    dense
                    required
                  />
                  <q-select
                    filled
                    v-model="manualTransaction.transaction_type"
                    :options="transactionTypes"
                    label="Type"
                    dense
                    required
                    emit-value
                    map-options
                  />
                  <q-select
                    filled
                    v-model.number="manualTransaction.category_id"
                    :options="categoryOptions"
                    label="Category"
                    
                    
                    dense
                    required
                    emit-value
                    map-options
                  />
                  <q-input
                    filled
                    v-model="manualTransaction.description"
                    label="Description"
                    dense
                    required
                    class="full-width"
                  />
                  <q-select
                    filled
                    v-model="manualTransaction.payment_method"
                    :options="paymentMethods"
                    label="Payment Method"
                    dense
                    emit-value
                    map-options
                    class="full-width"
                  />
                </div>

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

          <q-card v-if="!embedded" class="compact-card">
            <q-card-section class="card-section">
              <div class="section-header">
                <q-icon name="pie_chart" size="20px" class="text-primary" />
                <h3 class="text-h6 text-weight-medium">Category Summary</h3>
              </div>

                            <div class="summary-stats q-mb-md">
                <div class="stat-item income">
                  <div class="stat-icon">
                    <q-icon name="north" size="18px" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-value text-positive">
                      +{{ formatCurrency(categorySummary.totalIncome) }}
                    </div>
                    <div class="stat-label">Income</div>
                  </div>
                </div>
                <div class="stat-item expense">
                  <div class="stat-icon">
                    <q-icon name="south" size="18px" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-value text-negative">
                      -{{ formatCurrency(categorySummary.totalExpenses) }}
                    </div>
                    <div class="stat-label">Expenses</div>
                  </div>
                </div>
                <div class="stat-item balance">
                  <div class="stat-icon">
                    <q-icon name="account_balance_wallet" size="18px" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-value" :class="categorySummary.balance >= 0 ? 'text-positive' : 'text-negative'">
                      {{ categorySummary.balance >= 0 ? "+" : "" }}{{ formatCurrency(categorySummary.balance) }}
                    </div>
                    <div class="stat-label">Balance</div>
                  </div>
                </div>
              </div>

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
                <div class="text-caption">Import transactions to see summary</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-dialog v-model="showCategoryDialog">
        <q-card class="dialog-card">
          <q-card-section class="dialog-header">
            <div class="dialog-title">{{ activeCategory?.name }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="dialog-stats">
              <div class="dialog-stat">
                <div class="stat-label">Income</div>
                <div class="stat-value text-positive">
                  +{{ formatCurrency(activeCategory?.income || 0) }}
                </div>
              </div>
              <div class="dialog-stat">
                <div class="stat-label">Expenses</div>
                <div class="stat-value text-negative">
                  -{{ formatCurrency(activeCategory?.expenses || 0) }}
                </div>
              </div>
              <div class="dialog-stat">
                <div class="stat-label">Net</div>
                <div
                  class="stat-value"
                  :class="(activeCategory?.netAmount || 0) >= 0 ? 'text-positive' : 'text-negative'"
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
                    :name="tx.transaction_type === 'Einnahme' ? 'arrow_upward' : 'arrow_downward'"
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
                    <span v-if="tx.payment_method"> - {{ toEnglishPaymentMethod(tx.payment_method) }}</span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label
                    :class="tx.transaction_type === 'Einnahme' ? 'text-positive' : 'text-negative'"
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
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { auth } from "@/utils/auth";
import { jwtDecode } from "jwt-decode";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  toEnglishCategoryName,
  toEnglishTransactionType,
  toEnglishPaymentMethod,
} from "@/utils/displayText";

export default {
  name: "AustrianBankImport",
  props: {
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const $q = useQuasar();
    let bankSyncIntervalId = null;

    const bankConnected = ref(false);

    const selectedBank = ref("other");
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

    const searchText = ref("");
    const transactionType = ref(null);
    const selectedCategories = ref([]);
    const amountRange = ref({ min: 0, max: 5000 });
    const sortOption = ref("date_desc");

    const typeOptions = [
      { label: "Income", value: "Einnahme" },
      { label: "Expense", value: "Ausgabe" },
    ];

    const sortOptions = [
      { label: "Date (Newest first)", value: "date_desc" },
      { label: "Date (Oldest first)", value: "date_asc" },
      { label: "Amount (Highest first)", value: "amount_desc" },
      { label: "Amount (Lowest first)", value: "amount_asc" },
    ];

    const categoryOptions = computed(() =>
      categories.value.map((c) => ({ label: toEnglishCategoryName(c.name), value: c.id }))
    );

    const DEFAULT_CATEGORIES = [
      { name: "Lebensmittel", description: "Groceries and supermarket purchases." },
      { name: "Miete", description: "Monthly rent for apartment or house." },
      { name: "Freizeit", description: "Leisure expenses like hobbies or trips." },
      { name: "Kleidung", description: "Clothing expenses." },
      { name: "Transport", description: "Public transport, taxi, fuel, and mobility costs." },
      { name: "Versicherungen", description: "Insurance costs (health, liability, etc.)." },
      { name: "Strom/Gas", description: "Monthly energy costs." },
      { name: "Internet/Telefon", description: "Monthly communication costs." },
      { name: "Gesundheit", description: "Health expenses, doctors, medication, and care." },
      { name: "Bildung", description: "Education, books, courses, and learning materials." },
      { name: "Sparen", description: "Savings and investments." },
      { name: "Gehalt", description: "Regular salary income." },
      { name: "Geschenke", description: "Gifts for friends and family." },
      { name: "Gastronomie", description: "Restaurants, bars, and dining out." },
      { name: "Sonstiges", description: "Miscellaneous income and expenses." },
    ];

    const categorySummary = ref({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      categories: [],
    });

    const categorySummaries = computed(() => {
      return categorySummary.value?.categories || [];
    });

    const showCategoryDialog = ref(false);
    const activeCategory = ref(null);

    const austrianBanks = ref([
      {
        id: "erste",
        name: "Erste Bank und Sparkassen",
        format: "Date;Booking text;Amount",
        instruction:
          'In online banking: select "Export account statement" > "CSV format".',
      },
      {
        id: "raiffeisen",
        name: "Raiffeisen Bank",
        format: "Booking day;Value date;Booking text;Amount",
        instruction: 'In Raiffeisen online banking: "Export transactions" > CSV.',
      },
      {
        id: "bawag",
        name: "BAWAG PSK",
        format: "Booking date;Amount;Purpose",
        instruction: 'In BAWAG online banking: "Account statement" > "Export" > CSV.',
      },
      {
        id: "volksbank",
        name: "Volksbanken",
        format: "Date;Text;Debit;Credit",
        instruction: "In Volksbank online banking: export transaction overview as CSV.",
      },
      {
        id: "other",
        name: "Other Austrian bank",
        format: "Date;Description;Amount",
        instruction: "Upload a CSV file with date, description, and amount.",
      },
    ]);

    const transactionTypes = ref([
      { label: "Income", value: "Einnahme" },
      { label: "Expense", value: "Ausgabe" },
    ]);

    const paymentMethods = ref([
      { label: "Card", value: "Karte" },
      { label: "Cash", value: "Bar" },
      { label: "Transfer", value: "Ueberweisung" },
      { label: "Standing order", value: "Dauerauftrag" },
      { label: "Online", value: "Online" },
      { label: "Bank", value: "Bank" },
    ]);

    const quickTransactions = ref([
      {
        label: "Rent",
        amount: -850,
        category_name: "Miete",
        transaction_type: "Ausgabe",
        description: "Monthly rent",
        payment_method: "Ueberweisung",
        color: "blue",
      },
      {
        label: "Groceries",
        amount: -120,
        category_name: "Lebensmittel",
        transaction_type: "Ausgabe",
        description: "Weekly shopping",
        payment_method: "Karte",
        color: "green",
      },
      {
        label: "Salary",
        amount: 2500,
        category_name: "Gehalt",
        transaction_type: "Einnahme",
        description: "Monthly salary",
        payment_method: "Ueberweisung",
        color: "positive",
      },
      {
        label: "Fuel",
        amount: -80,
        category_name: "Transport",
        transaction_type: "Ausgabe",
        description: "Fuel refill",
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

const api = axios.create({
  baseURL: "http://localhost:3000",
});

const getAuthHeader = () => {
  const token = auth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const connectBank = () => {
  const userId = getUserId();
  if (!userId) {
    $q.notify({ type: "negative", message: "Please log in first" });
    return;
  }

  window.location.href = `http://localhost:3000/api/bank/link?userId=${userId}`;
};

const checkBankConnection = async () => {
  try {
    const token = auth.getToken();
    if (!token) {
      bankConnected.value = false;
      return;
    }

    const res = await api.get("/api/bank/status", {
      headers: getAuthHeader(),
    });

    bankConnected.value = Boolean(res.data?.connected);
  } catch (err) {
    bankConnected.value = false;
  }
};


    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:3000/categories");
        categories.value = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const resolveCategoryIdByName = (name) => {
      if (!name) return null;
      const normalized = String(name).trim().toLowerCase();
      const match = categories.value.find(
        (category) => String(category.name || "").trim().toLowerCase() === normalized
      );
      return match ? Number(match.id) : null;
    };

    const ensureDefaultCategories = async () => {
      await fetchCategories();

      const existing = new Set(
        categories.value.map((category) => String(category.name || "").trim().toLowerCase())
      );

      const missing = DEFAULT_CATEGORIES.filter(
        (category) => !existing.has(category.name.trim().toLowerCase())
      );

      if (!missing.length) return;

      for (const category of missing) {
        try {
          await axios.post("http://localhost:3000/categories", category);
        } catch (error) {
          console.error("Error creating default category:", category.name, error);
        }
      }

      await fetchCategories();
    };

    const getBankName = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.name : "Unknown bank";
    };

    const getBankInstructions = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.instruction : "Upload a CSV file with transactions";
    };

    const getBankFormat = (bankId) => {
      const bank = austrianBanks.value.find((b) => b.id === bankId);
      return bank ? bank.format : "Date;Description;Amount";
    };

    const getCategoryName = (categoryId) => {
      const category = categories.value.find((c) => Number(c.id) === Number(categoryId));
      return category ? toEnglishCategoryName(category.name) : "Uncategorized";
    };

    const filteredTransactions = computed(() => {
      let filtered = [...recentTransactions.value];

      if (searchText.value) {
        const search = searchText.value.toLowerCase();
        filtered = filtered.filter(
          (tx) =>
            tx.description?.toLowerCase().includes(search) ||
            getCategoryName(tx.category_id).toLowerCase().includes(search)
        );
      }

      if (transactionType.value) {
        filtered = filtered.filter((tx) => tx.transaction_type === transactionType.value);
      }

      if (selectedCategories.value.length > 0) {
        filtered = filtered.filter((tx) =>
          selectedCategories.value.includes(tx.category_id)
        );
      }

      filtered = filtered.filter(
        (tx) => tx.amount >= amountRange.value.min && tx.amount <= amountRange.value.max
      );

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

    const updateCategorySummary = () => {
      const transactionsToUse = filteredTransactions.value;

      const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        categories: [],
      };

      if (!transactionsToUse || transactionsToUse.length === 0) {
        categorySummary.value = summary;
        return;
      }

      const categoryMap = new Map();

      transactionsToUse.forEach((tx) => {
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

      summary.categories = Array.from(categoryMap.values()).sort(
        (a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount)
      );

      summary.balance = summary.totalIncome - summary.totalExpenses;
      categorySummary.value = summary;
    };

    watch(
      [searchText, transactionType, selectedCategories, amountRange, sortOption],
      () => {
        updateCategorySummary();
      }
    );

    const handleFileUpload = (files) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        $q.notify({
          type: "negative",
          message: "File is too large. Maximum size is 5MB.",
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
              message: "No valid transactions were found in the CSV file.",
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
            message: `${successCount} transactions imported (Income: ${formatCurrency(
              totalIncome
            )}, Expenses: ${formatCurrency(totalExpenses)})${
              errorCount > 0 ? `, ${errorCount} errors` : ""
            }`,
            timeout: 6000,
          });

          fetchRecentTransactions();
        } catch (error) {
          console.error("Error parsing CSV:", error);
          $q.notify({
            type: "negative",
            message: "Error importing CSV file. Please verify the format.",
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
          const header = lines[i].toLowerCase();
          if (
            i === 0 &&
            (header.includes("datum") || header.includes("date")) &&
            (header.includes("betrag") || header.includes("amount"))
          ) {
            continue;
          }

          let cleanLine = lines[i].trim();

          if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
            cleanLine = cleanLine.slice(1, -1);
          }

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
                date: parseDate(columns[0]),
                amount: Math.abs(rawAmount),
                description: parseDescription(columns),
                transaction_type: rawAmount > 0 ? "Einnahme" : "Ausgabe",
                category_id: autoCategorize(parseDescription(columns)),
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

    const parseDate = (dateString) => {
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
    let raw = columns[i];
    if (!raw) continue;

    raw = raw.replace(/"/g, "").trim();
    if (!raw.match(/\d/)) continue;

    let negative =
      raw.startsWith("-") ||
      raw.includes(" -") ||
      raw.toLowerCase().includes("soll");

    let value = raw
      .replace(/[€$]/g, "")
      .replace(/\s/g, "");

    if (value.match(/^\d{1,3}(\.\d{3})*,\d{2}$/)) {
      value = value.replace(/\./g, "").replace(",", ".");
    }

    else if (value.match(/^\d+,\d{2}$/)) {
      value = value.replace(",", ".");
    }

    value = value.replace(/[^\d.-]/g, "");

    const amount = Number(value);
    if (isNaN(amount) || amount === 0) continue;

    const final = negative ? -Math.abs(amount) : Math.abs(amount);
    return returnRaw ? final : Math.abs(final);
  }

  return 0;
};


    const parseDescription = (columns) => {
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
            return cleanColumn.substring(0, 100) || "Bank transaction";
          }
        }
      }

      return "Bank transaction";
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
          category_name: "Lebensmittel",
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
          category_name: "Miete",
        },
        {
          keywords: ["gehalt", "lohn", "entgelt", "salary", "payroll", "arbeitsentgelt"],
          category_name: "Gehalt",
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
          category_name: "Transport",
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
          category_name: "Gastronomie",
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
          category_name: "Strom/Gas",
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
          category_name: "Internet/Telefon",
        },
        {
          keywords: [
            "versicherung",
            "haftpflicht",
            "allianz",
            "uniqa",
            "generali",
            "wiener staedtische",
          ],
          category_name: "Versicherungen",
        },
        {
          keywords: ["schule", "kurs", "seminar", "udemy", "coursera", "buchhandlung", "bildung"],
          category_name: "Bildung",
        },
        {
          keywords: ["sparplan", "broker", "etf", "aktie", "invest", "sparen", "ruecklage"],
          category_name: "Sparen",
        },
        {
          keywords: ["geschenk", "geburtstag", "weihnachten", "jubil", "blumen"],
          category_name: "Geschenke",
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
          category_name: "Gesundheit",
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
          category_name: "Freizeit",
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
          category_name: "Kleidung",
        },
      ];

      for (const rule of rules) {
        if (rule.keywords.some((keyword) => desc.includes(keyword))) {
          const categoryId = resolveCategoryIdByName(rule.category_name);
          if (categoryId) {
            return categoryId;
          }
        }
      }

      return resolveCategoryIdByName("Sonstiges") || categories.value[0]?.id || null;
    };

    const saveTransaction = async (transactionData) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }
      if (!transactionData.category_id) {
        throw new Error("Category is required");
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
          message: "Please log in to save transactions",
        });
        return;
      }

      savingTransaction.value = true;
      try {
        if (!manualTransaction.value.category_id) {
          $q.notify({
            type: "warning",
            message: "Please select a category",
          });
          return;
        }

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
          message: "Transaction saved successfully",
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
            "Error saving transaction: " +
            (error.response?.data?.message || error.message),
        });
      } finally {
        savingTransaction.value = false;
      }
    };

    const openQuickTransaction = (quickTx) => {
      const resolvedCategoryId =
        quickTx.category_id || resolveCategoryIdByName(quickTx.category_name);

      manualTransaction.value = {
        date: new Date().toISOString().split("T")[0],
        amount: Math.abs(quickTx.amount),
        transaction_type: quickTx.transaction_type,
        category_id: resolvedCategoryId || null,
        description: quickTx.description,
        payment_method: quickTx.payment_method,
      };

      if (!resolvedCategoryId) {
        $q.notify({
          type: "warning",
          message: `Category for "${quickTx.label}" was not found. Please select a category.`,
        });
      }
    };

    const fetchRecentTransactions = async () => {
      const userId = getUserId();
      if (!userId) return;

      try {
        const response = await api.get(
          `/api/bank/users/${userId}?limit=100&sync=true`,
          {
            headers: getAuthHeader(),
          }
        );
        recentTransactions.value = response.data.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
          date: t.date.split("T")[0],
        }));
        updateCategorySummary();
      } catch (error) {
        console.error("Error fetching transactions:", error);
        recentTransactions.value = [];
        updateCategorySummary();
      }
    };

    const resetFilters = () => {
      searchText.value = "";
      transactionType.value = null;
      selectedCategories.value = [];
      amountRange.value = { min: 0, max: 5000 };
      sortOption.value = "date_desc";
    };

    const openCategoryDialog = (cat) => {
      activeCategory.value = cat;
      showCategoryDialog.value = true;
    };

    const exportCSV = () => {
      try {
        const headers = ["Date", "Description", "Category", "Type", "Amount"];
        const data = filteredTransactions.value.map((t) => ({
          date: t.date,
          description: t.description,
          category: getCategoryName(t.category_id),
          type: toEnglishTransactionType(t.transaction_type),
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
        link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();

        $q.notify({ type: "positive", message: "CSV exported successfully" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Error exporting CSV" });
      }
    };

    const exportPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text("Transaction Report", 105, 20, { align: "center" });
        const tableData = filteredTransactions.value.map((t) => [
          t.date,
          t.description || "No description",
          getCategoryName(t.category_id),
          toEnglishTransactionType(t.transaction_type),
          `${t.amount} ${t.currency || "€"}`,
        ]);
        autoTable(doc, {
          head: [["Date", "Description", "Category", "Type", "Amount"]],
          body: tableData,
          startY: 30,
        });
        doc.save(`transactions_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: "positive", message: "PDF report generated successfully" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Error exporting PDF" });
      }
    };

    const exportCategoryCSV = () => {
      try {
        const headers = ["Category", "Income", "Expenses", "Balance"];
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
        link.download = `category_report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        $q.notify({ type: "positive", message: "CSV exported successfully" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Error exporting CSV" });
      }
    };

    const exportCategoryPDF = () => {
      try {
        const doc = new jsPDF();
        doc.text("Category Summary", 105, 20, { align: "center" });
        const tableData = categorySummaries.value.map((cat) => [
          cat.name,
          cat.income.toFixed(2),
          cat.expenses.toFixed(2),
          (cat.income - cat.expenses).toFixed(2),
        ]);
        autoTable(doc, {
          head: [["Category", "Income", "Expenses", "Balance"]],
          body: tableData,
          startY: 30,
        });
        doc.save(`category_report_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: "positive", message: "PDF report generated successfully" });
      } catch (err) {
        console.error(err);
        $q.notify({ type: "negative", message: "Error exporting PDF" });
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-US");
    };

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return "0.00";
      }
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const downloadSampleCSV = (bankId) => {
      let sampleContent = "";

      switch (bankId) {
        case "erste":
          sampleContent =
            '"Date";"Booking Text";"Amount"\n"30.09.2025";"MPREIS FILIALE 1234 WIEN";"-45,67"\n"29.09.2025";"GEHALT FIRMA GMBH";"2450,00"';
          break;
        case "raiffeisen":
          sampleContent =
            '"Booking Day";"Value Date";"Booking Text";"Amount"\n"30.09.2025";"30.09.2025";"TANKE SPAR 1234";"-78,90"';
          break;
        case "bawag":
          sampleContent =
            '"Booking Date";"Amount";"Purpose"\n"30.09.2025";"-120,50";"BILLA EINKAUF 1234"';
          break;
        case "volksbank":
          sampleContent =
            '"Date";"Text";"Debit";"Credit"\n"30.09.2025";"ONLINE SHOPPING";"89,99";""';
          break;
        default:
          sampleContent =
            '"Date";"Description";"Amount"\n"30.09.2025";"Sample Transaction";"-99,99"';
      }

      const blob = new Blob([sampleContent], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sample_${bankId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    };

    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);
    };

    const startBankSyncInterval = () => {
      if (bankSyncIntervalId) {
        clearInterval(bankSyncIntervalId);
      }

      bankSyncIntervalId = setInterval(() => {
        if (bankConnected.value) {
          fetchRecentTransactions();
        }
      }, 60000);
    };

    onMounted(async () => {
      await ensureDefaultCategories();
      await checkBankConnection();
      await fetchRecentTransactions();
      startBankSyncInterval();
    });

    onUnmounted(() => {
      if (bankSyncIntervalId) {
        clearInterval(bankSyncIntervalId);
      }
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

      searchText,
      transactionType,
      selectedCategories,
      amountRange,
      sortOption,
      typeOptions,
      sortOptions,
      categoryOptions,

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

      resetFilters,

      openCategoryDialog,

      exportCSV,
      exportPDF,
      exportCategoryCSV,
      exportCategoryPDF,
      toggleDarkMode,
      connectBank,
      checkBankConnection,
      fetchRecentTransactions,
  bankConnected,
    };
  },
};
</script>

<style lang="scss" scoped>
.bank-import-view {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.bank-import-view--embedded {
  max-width: 100%;
  margin-top: 8px;
}

.dark-mode-toggle {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
}

.toggle-btn {
  width: 60px;
  height: 60px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 2px solid #dee2e6 !important;
}

.toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  border-color: #adb5bd !important;
}

.compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #dde5ef;
  border-radius: 14px;
  background: #ffffff;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);

  .header-content {
    display: flex;
    align-items: center;
    min-width: 0;
  }
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(320px, 360px) minmax(0, 1fr);
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(300px, 340px) minmax(0, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.compact-card {
  border-radius: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
  background: white;
  margin: 0;

  &:hover {
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
    border-color: #cfd9e6 !important;
  }
}

.card-section {
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6edf5;

  h3 {
    margin: 0;
    flex: 1;
  }
}

.upload-section {
  .upload-hint {
    background: #f7fafc;
    border: 1px solid #e5edf6;
    color: #334155;
    padding: 8px 10px;
  }

  .bank-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }

  .bank-info {
    flex: 1;
    
    .info-text {
      font-size: 0.85rem;
      color: #495057;
      margin-bottom: 2px;
    }

    .format-text {
      font-size: 0.8rem;
      color: #6c757d;
      font-weight: 500;
    }
  }
}

:deep(.upload-section .q-uploader) {
  border-radius: 12px;
  border: 1px dashed #c9d6e4;
  background: #fcfdff;
}

.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quick-btn {
  font-size: 0.78rem;
  border-radius: 8px;
  text-transform: none;
  min-height: 34px;
}

.compact-form {
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;

    .full-width {
      grid-column: 1 / -1;
    }
  }

  .form-actions {
    margin-top: 16px;

    .save-btn {
      width: 100%;
      border-radius: 8px;
      font-weight: 600;
      padding: 10px;
    }
  }
}

.manual-entry-card--embedded {
  height: 100%;
}

.manual-entry-card--embedded .card-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.manual-entry-card--embedded .compact-form {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.manual-entry-card--embedded .compact-form .form-grid {
  flex: 1;
  align-content: start;
}

.summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: #f9fbfd;
    border-radius: 8px;
    border: 1px solid #e4ebf3;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
    }

    &.income {
      border-left: 4px solid #2e7d32 !important;
    }

    &.expense {
      border-left: 4px solid #c62828 !important;
    }

    &.balance {
      border-left: 4px solid #1976d2 !important;
    }

    .stat-icon {
      font-size: 1.2rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .stat-content {
      .stat-value {
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 2px;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #6c757d;
      }
    }
  }
}

.categories-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;

  .category-card {
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .category-name {
        font-weight: 600;
        color: #2d3748;
        font-size: 0.85rem;
      }

      .transaction-count {
        background: #667eea;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: 600;
      }
    }

    .category-amounts {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;

      .amount {
        font-size: 0.75rem;
        text-align: center;
        padding: 2px 4px;
        border-radius: 4px;

        &.income {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        &.expense {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        &.net.positive {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          font-weight: 700;
        }

        &.net.negative {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          font-weight: 700;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #9ca3af;

  .q-icon {
    margin-bottom: 8px;
    opacity: 0.5;
  }
}

.export-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.export-btn {
  font-size: 0.8rem;
  border-radius: 8px;
  padding: 8px;
  text-transform: none;
}

.dialog-card {
  border-radius: 16px;
  width: 600px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid #dee2e6 !important;
}

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

body.body--dark .bg-page {
  background: #121212 !important;
}

body.body--dark .compact-header {
  border-color: rgba(148, 163, 184, 0.2) !important;
  background: #1e1e1e !important;
  box-shadow: 0 10px 22px rgba(2, 6, 23, 0.45) !important;
}

body.body--dark .compact-header .text-dark {
  color: #ffffff !important;
}

body.body--dark .compact-header .text-grey-7 {
  color: #b0b0b0 !important;
}

body.body--dark .compact-card {
  background: #1e1e1e !important;
  border-color: rgba(148, 163, 184, 0.2) !important;
  box-shadow: 0 8px 18px rgba(2, 6, 23, 0.34) !important;
}

body.body--dark .compact-card:hover {
  box-shadow: 0 12px 24px rgba(2, 6, 23, 0.45) !important;
  border-color: rgba(148, 163, 184, 0.3) !important;
}

body.body--dark .section-header {
  border-bottom-color: rgba(148, 163, 184, 0.2) !important;
}

body.body--dark .upload-section .upload-hint {
  background: rgba(148, 163, 184, 0.1) !important;
  border-color: rgba(148, 163, 184, 0.24) !important;
  color: #d8e1ea !important;
}

body.body--dark .upload-section .bank-info .info-text {
  color: #e0e0e0 !important;
}

body.body--dark .upload-section .bank-info .format-text {
  color: #b0b0b0 !important;
}

body.body--dark .summary-stats .stat-item {
  background: rgba(148, 163, 184, 0.08) !important;
  border-color: rgba(148, 163, 184, 0.2) !important;
}

body.body--dark .summary-stats .stat-item .stat-icon {
  background: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .summary-stats .stat-item .stat-label {
  color: #b0b0b0 !important;
}

body.body--dark .categories-grid .category-card {
  background: #1f1f1f !important;
  border-color: rgba(148, 163, 184, 0.2) !important;
}

body.body--dark .categories-grid .category-card .category-header .category-name {
  color: #ffffff !important;
}

body.body--dark .categories-grid .category-card .category-amounts .amount.income {
  background: rgba(16, 185, 129, 0.2) !important;
}

body.body--dark .categories-grid .category-card .category-amounts .amount.expense {
  background: rgba(239, 68, 68, 0.2) !important;
}

body.body--dark .categories-grid .category-card .category-amounts .amount.net.positive {
  background: rgba(59, 130, 246, 0.2) !important;
}

body.body--dark .categories-grid .category-card .category-amounts .amount.net.negative {
  background: rgba(245, 158, 11, 0.2) !important;
}

body.body--dark .dialog-card {
  background: #1e1e1e !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

body.body--dark .dialog-card .text-dark {
  color: #ffffff !important;
}

body.body--dark .dialog-stats .dialog-stat {
  background: rgba(255, 255, 255, 0.05) !important;
}

body.body--dark .dialog-stats .dialog-stat .stat-label {
  color: #b0b0b0 !important;
}

body.body--dark .quick-btn,
body.body--dark .export-btn,
body.body--dark .save-btn {
  border: none !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

body.body--dark .quick-btn:hover,
body.body--dark .export-btn:hover,
body.body--dark .save-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

@media (max-width: 768px) {
  .responsive-page-padding {
    padding: 12px !important;
  }

  .bank-import-view {
    padding: 8px;
  }

  .main-grid {
    gap: 16px;
  }

  .left-column,
  .right-column {
    gap: 16px;
  }

  .card-section {
    padding: 16px;
  }

  .summary-stats,
  .quick-grid,
  .export-grid,
  .compact-form .form-grid {
    grid-template-columns: 1fr;
  }

  .manual-entry-card--embedded {
    min-height: auto;
  }

  .dark-mode-toggle {
    bottom: 16px;
    left: 16px;
  }

  .toggle-btn {
    width: 56px;
    height: 56px;
  }

  .upload-section .bank-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .categories-grid .category-card .category-amounts {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}

.q-btn, .compact-card, .stat-item, .toggle-btn, .category-card {
  transition: all 0.3s ease;
}
</style>




