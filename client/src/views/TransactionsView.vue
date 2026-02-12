<template>
  <q-page class="q-pa-md transactions-page">
    <div class="column items-center q-mb-lg">
      <q-separator color="primary" class="full-width q-my-md" />
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="searchText" label="Search" clearable outlined dense>
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="transactionType"
              :options="typeOptions"
              label="Transaction Type"
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
              label="Sort By"
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
              label="Categories"
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
            <div class="text-caption text-center q-mt-xs">Amount Range (€)</div>
            <div class="row justify-between q-mt-xs">
              <div class="text-caption">{{ amountRange.min }} €</div>
              <div class="text-caption">{{ amountRange.max }} €</div>
            </div>
          </div>

          <div class="col-12">
            <q-btn
              label="Reset Filters"
              color="negative"
              flat
              @click="resetFilters"
              class="full-width"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row justify-end q-mb-md">
      <div class="export-actions">
        <q-btn
          color="secondary"
          icon="picture_as_pdf"
          label="Export PDF (Transactions)"
          @click="exportPDF"
          class="q-mr-sm"
        />
        <q-btn
          color="positive"
          icon="text_snippet"
          label="Export CSV (Transactions)"
          @click="exportCSV"
          class="q-mr-sm"
        />
        <q-btn
          color="primary"
          icon="picture_as_pdf"
          label="Export PDF (Categories)"
          @click="exportCategoryPDF"
          class="q-mr-sm"
        />
        <q-btn
          color="teal"
          icon="text_snippet"
          label="Export CSV (Categories)"
          @click="exportCategoryCSV"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md justify-center">
      <div
        class="col-12 col-sm-6 col-md-4 col-lg-3"
        v-for="cat in categorySummaries"
        :key="cat.category"
      >
        <q-card flat bordered class="my-card" @click="openCategoryDialog(cat)">
          <q-card-section class="text-center">
            <div class="text-h6">{{ cat.category }}</div>
            <div class="q-mt-sm">
              <div style="color: green">Income: +{{ cat.income.toFixed(2) }} €</div>
              <div style="color: red">Expenses: -{{ cat.expense.toFixed(2) }} €</div>
              <div :style="{ color: cat.income - cat.expense >= 0 ? 'green' : 'red' }">
                Balance: {{ (cat.income - cat.expense).toFixed(2) }} €
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="showCategoryDialog">
      <q-card class="category-dialog-card">
        <q-card-section>
          <div class="text-h6">{{ activeCategory?.category }}</div>
          <q-separator class="q-my-sm" />
          <div v-for="t in activeCategory?.transactions" :key="t.id" class="q-mb-sm">
            <div>
              {{ t.date }} - {{ t.title }} -
              <span :style="{ color: t.type === 'income' ? 'green' : 'red' }">
                {{ t.type === 'income' ? '+' : '-' }}{{ t.amount }} €
              </span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useQuasar } from 'quasar';
import { auth } from '@/utils/auth';

export default defineComponent({
  setup() {
    const $q = useQuasar();
    const transactions = ref([]);
    const categories = ref([]);
    const searchText = ref('');
    const transactionType = ref(null);
    const selectedCategories = ref([]);
    const dateRange = ref({ from: '', to: '' });
    const amountRange = ref({ min: 0, max: 5000 });
    const sortOption = ref('date_desc');

    const typeOptions = [
      { label: 'Income', value: 'Einnahme' },
      { label: 'Expense', value: 'Ausgabe' },
    ];

    const sortOptions = [
      { label: 'Date (Newest First)', value: 'date_desc' },
      { label: 'Date (Oldest First)', value: 'date_asc' },
      { label: 'Amount (Highest First)', value: 'amount_desc' },
      { label: 'Amount (Lowest First)', value: 'amount_asc' },
    ];

    const categoryOptions = computed(() =>
      categories.value.map((c) => ({ label: c.name, value: c.id })),
    );
    const categoryNameById = computed(() => {
      const map = new Map();
      categories.value.forEach((c) => map.set(c.id, c.name));
      return map;
    });

    const userid = (() => {
      const token = auth.getToken();
      if (!token) return null;
      try {
        return jwtDecode(token).id;
      } catch {
        return null;
      }
    })();

    onMounted(async () => {
      if (!userid) {
        transactions.value = [];
        return;
      }
      await Promise.all([fetchCategories(), fetchTransactions()]);
    });

    async function fetchCategories() {
      try {
        const res = await axios.get('http://localhost:3000/categories');
        categories.value = res.data;
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchTransactions() {
      try {
        const res = await axios.get(`http://localhost:3000/transactions/users/${userid}`);
        transactions.value = res.data.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
          dateTs: new Date(t.date).getTime(),
          date: new Date(t.date).toLocaleDateString(),
        }));
      } catch (err) {
        console.error(err);
      }
    }

    const filteredTransactions = computed(() => {
      let filtered = [...transactions.value];
      if (searchText.value) {
        const s = searchText.value.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.description?.toLowerCase().includes(s) ||
            categoryNameById.value.get(t.category_id)?.toLowerCase().includes(s),
        );
      }
      if (transactionType.value)
        filtered = filtered.filter((t) => t.transaction_type === transactionType.value);
      if (selectedCategories.value.length)
        filtered = filtered.filter((t) => selectedCategories.value.includes(t.category_id));
      filtered = filtered.filter(
        (t) => t.amount >= amountRange.value.min && t.amount <= amountRange.value.max,
      );
      switch (sortOption.value) {
        case 'date_asc':
          filtered.sort((a, b) => (a.dateTs || 0) - (b.dateTs || 0));
          break;
        case 'date_desc':
          filtered.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
          break;
        case 'amount_asc':
          filtered.sort((a, b) => a.amount - b.amount);
          break;
        case 'amount_desc':
          filtered.sort((a, b) => b.amount - a.amount);
          break;
      }
      return filtered.map((t) => ({
        id: t.id,
        title: t.description || 'No description',
        category: categoryNameById.value.get(t.category_id) || 'Unknown',
        amount: t.amount,
        type: t.transaction_type === 'Einnahme' ? 'income' : 'expense',
        currency: t.currency || '€',
        date: t.date,
      }));
    });

    const categorySummaries = computed(() => {
      const summaries = {};
      filteredTransactions.value.forEach((t) => {
        if (!summaries[t.category])
          summaries[t.category] = {
            category: t.category,
            income: 0,
            expense: 0,
            transactions: [],
          };
        if (t.type === 'income') summaries[t.category].income += t.amount;
        else summaries[t.category].expense += t.amount;
        summaries[t.category].transactions.push(t);
      });
      return Object.values(summaries);
    });

    const showCategoryDialog = ref(false);
    const activeCategory = ref(null);
    function openCategoryDialog(cat) {
      activeCategory.value = cat;
      showCategoryDialog.value = true;
    }

    function resetFilters() {
      searchText.value = '';
      transactionType.value = null;
      selectedCategories.value = [];
      dateRange.value = { from: '', to: '' };
      amountRange.value = { min: 0, max: 5000 };
      sortOption.value = 'date_desc';
    }

    let pdfToolsPromise = null;
    const loadPdfTools = async () => {
      if (!pdfToolsPromise) {
        pdfToolsPromise = Promise.all([import('jspdf'), import('jspdf-autotable')]);
      }
      const [jspdfMod, autoTableMod] = await pdfToolsPromise;
      return {
        jsPDF: jspdfMod.jsPDF,
        autoTable: autoTableMod.default || autoTableMod,
      };
    };

    const exportCSV = () => {
      try {
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const data = filteredTransactions.value.map((t) => ({
          date: t.date,
          description: t.title,
          category: t.category,
          type: t.type === 'income' ? 'Income' : 'Expense',
          amount: `${t.type === 'income' ? '+' : '-'}${t.amount} ${t.currency}`,
        }));

        let csv = headers.join(',') + '\n';
        data.forEach((row) => {
          csv +=
            Object.values(row)
              .map((v) => `"${v}"`)
              .join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();

        $q.notify({ type: 'positive', message: 'CSV exported successfully' });
      } catch (err) {
        console.error(err);
      }
    };

    const exportPDF = async () => {
      try {
        const { jsPDF, autoTable } = await loadPdfTools();
        const doc = new jsPDF();
        doc.text('Transaction Report', 105, 20, { align: 'center' });
        const tableData = filteredTransactions.value.map((t) => [
          t.date,
          t.title,
          t.category,
          t.type === 'income' ? 'Income' : 'Expense',
          `${t.amount} ${t.currency}`,
        ]);
        autoTable(doc, {
          head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
          body: tableData,
          startY: 30,
        });
        doc.save(`transactions_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: 'positive', message: 'PDF report generated successfully' });
      } catch (err) {
        console.error(err);
      }
    };

    const exportCategoryCSV = () => {
      try {
        const headers = ['Category', 'Income', 'Expenses', 'Balance'];
        const data = categorySummaries.value.map((cat) => ({
          category: cat.category,
          income: cat.income.toFixed(2),
          expenses: cat.expense.toFixed(2),
          balance: (cat.income - cat.expense).toFixed(2),
        }));
        let csv = headers.join(',') + '\n';
        data.forEach((row) => {
          csv +=
            Object.values(row)
              .map((v) => `"${v}"`)
              .join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `category_report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        $q.notify({ type: 'positive', message: 'CSV exported successfully' });
      } catch (err) {
        console.error(err);
      }
    };

    const exportCategoryPDF = async () => {
      try {
        const { jsPDF, autoTable } = await loadPdfTools();
        const doc = new jsPDF();
        doc.text('Category Summary Report', 105, 20, { align: 'center' });
        const tableData = categorySummaries.value.map((cat) => [
          cat.category,
          cat.income.toFixed(2),
          cat.expense.toFixed(2),
          (cat.income - cat.expense).toFixed(2),
        ]);
        autoTable(doc, {
          head: [['Category', 'Income', 'Expenses', 'Balance']],
          body: tableData,
          startY: 30,
        });
        doc.save(`category_report_${new Date().toISOString().slice(0, 10)}.pdf`);
        $q.notify({ type: 'positive', message: 'PDF report generated successfully' });
      } catch (err) {
        console.error(err);
      }
    };

    return {
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
      categorySummaries,
      showCategoryDialog,
      activeCategory,
      openCategoryDialog,
      exportCSV,
      exportPDF,
      exportCategoryCSV,
      exportCategoryPDF,
    };
  },
});
</script>

<style scoped>
.transactions-page {
  overflow-x: hidden;
}

.my-card {
  width: 100%;
  transition: transform 0.3s;
}
.my-card:hover {
  transform: translateY(-5px);
  cursor: pointer;
}
.q-btn-group {
  margin-bottom: 16px;
}

.export-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.category-dialog-card {
  min-width: min(400px, 92vw);
}

@media (max-width: 768px) {
  .export-actions {
    width: 100%;
  }

  .export-actions .q-btn {
    flex: 1 1 240px;
    margin-right: 0 !important;
  }
}

@media (max-width: 480px) {
  .transactions-page {
    padding: 12px !important;
  }

  .export-actions .q-btn {
    flex: 1 1 100%;
  }
}
</style>
