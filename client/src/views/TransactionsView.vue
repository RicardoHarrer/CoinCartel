<template>
  <q-page class="q-pa-md">
    <div class="column items-center q-mb-lg">
      <q-separator color="primary" class="full-width q-my-md" />
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Search Field -->
          <div class="col-12 col-md-6">
            <q-input v-model="searchText" label="Suche" clearable outlined dense>
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Transaction Type -->
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

          <!-- Sort Order -->
          <div class="col-12 col-md-3">
            <q-select
              v-model="sortOption"
              :options="sortOptions"
              label="Sortierung"
              outlined
              dense
              emit-value
              map-options
            />
          </div>

          <!-- Category Filter -->
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

          <!-- Compact Amount Range -->
          <div class="col-12 col-md-6">
            <q-range
              v-model="amountRange"
              :min="0"
              :max="5000"
              :step="10"
              label="Betragsbereich (€)"
              color="primary"
              style="width: 100%"
            />
            <div class="row justify-between q-mt-xs">
              <div class="text-caption">{{ amountRange.min }} €</div>
              <div class="text-caption">{{ amountRange.max }} €</div>
            </div>
          </div>

          <!-- Reset Button -->
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

    <div class="row q-col-gutter-md justify-center">
      <!-- Add Transaction Card -->
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card
          class="my-card add-card"
          flat
          bordered
          @click="showAddTransactionDialog = true"
        >
          <q-card-section class="text-center">
            <q-icon name="add" size="xl" color="primary" />
            <div class="text-h6 text-primary q-mt-sm">Add Transaction</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Transaction Cards -->
      <div
        v-for="item in filteredTransactions"
        :key="item.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <TransactionCard :data="item" @delete="deleteTransaction(item.id)" />
      </div>
    </div>

    <!-- Add Transaction Dialog -->
    <q-dialog v-model="showAddTransactionDialog">
      <AddTransaction @transaction-added="handleTransactionAdded" />
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import TransactionCard from "@/components/TransactionCard.vue";
import AddTransaction from "@/components/AddTransaction.vue";

export default defineComponent({
  components: { TransactionCard, AddTransaction },
  setup() {
    const transactions = ref([]);
    const categories = ref([]);
    const showAddTransactionDialog = ref(false);

    // Filter States
    const searchText = ref("");
    const transactionType = ref(null);
    const selectedCategories = ref([]);
    const dateRange = ref({ from: "", to: "" });
    const amountRange = ref({ min: 0, max: 5000 });
    const sortOption = ref("date_desc");

    const typeOptions = [
      { label: "Einnahmen", value: "Einnahme" },
      { label: "Ausgaben", value: "Ausgabe" },
    ];

    const sortOptions = [
      { label: "Datum (neueste zuerst)", value: "date_desc" },
      { label: "Datum (älteste zuerst)", value: "date_asc" },
      { label: "Betrag (höchste zuerst)", value: "amount_desc" },
      { label: "Betrag (niedrigste zuerst)", value: "amount_asc" },
    ];

    const categoryOptions = computed(() => {
      return categories.value.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    });

    const decodeToken = () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      try {
        return jwtDecode(token).id;
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    };

    const userid = decodeToken();

    onMounted(async () => {
      await fetchCategories();
      await fetchTransactions();
    });

    async function fetchCategories() {
      try {
        const response = await axios.get("http://localhost:3000/categories");
        categories.value = response.data;
      } catch (err) {
        console.error("Fehler beim Laden der Kategorien:", err);
      }
    }

    async function fetchTransactions() {
      try {
        const response = await axios.get(
          `http://localhost:3000/transactions/users/${userid}`
        );
        transactions.value = response.data;
      } catch (err) {
        console.error("Fehler beim Laden der Transaktionen:", err);
      }
    }

    const filteredTransactions = computed(() => {
      let filtered = [...transactions.value];

      // Text Search
      if (searchText.value) {
        const search = searchText.value.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.description?.toLowerCase().includes(search) ||
            categories.value
              .find((c) => c.id === t.category_id)
              ?.name.toLowerCase()
              .includes(search)
        );
      }

      // Transaction Type Filter
      if (transactionType.value) {
        filtered = filtered.filter((t) => t.transaction_type === transactionType.value);
      }

      // Category Filter
      if (selectedCategories.value.length > 0) {
        filtered = filtered.filter((t) =>
          selectedCategories.value.includes(t.category_id)
        );
      }

      // Date Range Filter
      if (dateRange.value.from && dateRange.value.to) {
        const fromDate = new Date(dateRange.value.from);
        const toDate = new Date(dateRange.value.to);
        filtered = filtered.filter((t) => {
          const transDate = new Date(t.date);
          return transDate >= fromDate && transDate <= toDate;
        });
      }

      // Amount Range Filter
      filtered = filtered.filter(
        (t) => t.amount >= amountRange.value.min && t.amount <= amountRange.value.max
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
        default:
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      return filtered.map((transaction) => ({
        id: transaction.id,
        title: transaction.description || "Keine Beschreibung",
        category: getCategoryName(transaction.category_id),
        amount: transaction.amount,
        type: transaction.transaction_type === "Einnahme" ? "income" : "expense",
        currency: transaction.currency,
        date: new Date(transaction.date).toLocaleDateString("de-DE"),
      }));
    });

    const getCategoryName = (categoryId) => {
      const category = categories.value.find((c) => c.id === categoryId);
      return category ? category.name : "Unbekannt";
    };

    function resetFilters() {
      searchText.value = "";
      transactionType.value = null;
      selectedCategories.value = [];
      dateRange.value = { from: "", to: "" };
      amountRange.value = { min: 0, max: 5000 };
      sortOption.value = "date_desc";
    }

    async function deleteTransaction(id) {
      try {
        await axios.delete(`http://localhost:3000/transactions/${id}`);
        await fetchTransactions();
      } catch (err) {
        console.error("Fehler beim Löschen der Transaktion:", err);
      }
    }

    function handleTransactionAdded() {
      showAddTransactionDialog.value = false;
      fetchTransactions();
    }

    return {
      transactions,
      filteredTransactions,
      showAddTransactionDialog,
      searchText,
      transactionType,
      selectedCategories,
      dateRange,
      amountRange,
      sortOption,
      typeOptions,
      sortOptions,
      categoryOptions,
      resetFilters,
      deleteTransaction,
      handleTransactionAdded,
    };
  },
});
</script>

<style scoped>
.my-card {
  width: 100%;
  transition: transform 0.3s;
}

.my-card:hover {
  transform: translateY(-5px);
}

.add-card {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  border: 2px dashed var(--q-primary);
}

.add-card:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>
