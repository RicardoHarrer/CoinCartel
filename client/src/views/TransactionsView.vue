//TransactionView.vue
<template>
  <q-page class="q-pa-md">
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
      <q-btn-group>
        <q-btn
          color="secondary"
          icon="picture_as_pdf"
          label="Export PDF"
          @click="exportPDF"
          class="q-mr-sm"
        />
        <q-btn color="positive" icon="text_snippet" label="Export CSV" @click="exportCSV" />
      </q-btn-group>
    </div>

    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card class="my-card add-card" flat bordered @click="showAddTransactionDialog = true">
          <q-card-section class="text-center">
            <q-icon name="add" size="xl" color="primary" />
            <div class="text-h6 text-primary q-mt-sm">Add Transaction</div>
          </q-card-section>
        </q-card>
      </div>

      <div
        v-for="item in filteredTransactions"
        :key="item.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <TransactionCard :data="item" @delete="deleteTransaction(item.id)" />
      </div>
    </div>

    <q-dialog v-model="showAddTransactionDialog">
      <AddTransaction @transaction-added="handleTransactionAdded" />
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import TransactionCard from '@/components/TransactionCard.vue';
import AddTransaction from '@/components/AddTransaction.vue';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuasar } from 'quasar';
import { auth } from '@/utils/auth';

export default defineComponent({
  components: { TransactionCard, AddTransaction },
  setup() {
    const $q = useQuasar();
    const transactions = ref([]);
    const categories = ref([]);
    const showAddTransactionDialog = ref(false);

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

    const categoryOptions = computed(() => {
      return categories.value.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    });

    function decodeToken() {
      const token = auth.getToken();
      if (!token) return null;
      try {
        console.log('Decoding token:', jwtDecode(token));
        return jwtDecode(token).id;
      } catch (error) {
        console.error('Invalid token:', error);
        return null;
      }
    }

    const userid = decodeToken();

    onMounted(async () => {
      await fetchCategories();
      await fetchTransactions();
    });

    async function fetchCategories() {
      try {
        const response = await axios.get('http://localhost:3000/categories');
        categories.value = response.data;
      } catch (err) {
        console.error('Error loading categories:', err);
        $q.notify({
          type: 'negative',
          message: 'Failed to load categories',
        });
      }
    }

    async function fetchTransactions() {
      try {
        const response = await axios.get(`http://localhost:3000/transactions/users/${userid}`);
        transactions.value = response.data.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
        }));
      } catch (err) {
        console.error('Error loading transactions:', err);
        $q.notify({
          type: 'negative',
          message: 'Failed to load transactions',
        });
      }
    }

    const filteredTransactions = computed(() => {
      let filtered = [...transactions.value];

      if (searchText.value) {
        const search = searchText.value.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.description?.toLowerCase().includes(search) ||
            categories.value
              .find((c) => c.id === t.category_id)
              ?.name.toLowerCase()
              .includes(search),
        );
      }

      if (transactionType.value) {
        filtered = filtered.filter((t) => t.transaction_type === transactionType.value);
      }

      if (selectedCategories.value.length > 0) {
        filtered = filtered.filter((t) => selectedCategories.value.includes(t.category_id));
      }

      if (dateRange.value.from && dateRange.value.to) {
        const fromDate = new Date(dateRange.value.from);
        const toDate = new Date(dateRange.value.to);
        filtered = filtered.filter((t) => {
          const transDate = new Date(t.date);
          return transDate >= fromDate && transDate <= toDate;
        });
      }

      filtered = filtered.filter(
        (t) => t.amount >= amountRange.value.min && t.amount <= amountRange.value.max,
      );

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
        default:
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      return filtered.map((transaction) => ({
        id: transaction.id,
        title: transaction.description || 'No description',
        category: getCategoryName(transaction.category_id),
        amount: Number(transaction.amount),
        type: transaction.transaction_type === 'Einnahme' ? 'income' : 'expense',
        currency: transaction.currency,
        date: new Date(transaction.date).toLocaleDateString(),
      }));
    });

    const getCategoryName = (categoryId) => {
      const category = categories.value.find((c) => c.id === categoryId);
      return category ? category.name : 'Unknown';
    };

    function resetFilters() {
      searchText.value = '';
      transactionType.value = null;
      selectedCategories.value = [];
      dateRange.value = { from: '', to: '' };
      amountRange.value = { min: 0, max: 5000 };
      sortOption.value = 'date_desc';
    }

    async function deleteTransaction(id) {
      try {
        await axios.delete(`http://localhost:3000/transactions/${id}`);
        await fetchTransactions();
        $q.notify({
          type: 'positive',
          message: 'Transaction deleted successfully',
        });
      } catch (err) {
        console.error('Error deleting transaction:', err);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete transaction',
        });
      }
    }

    function handleTransactionAdded() {
      showAddTransactionDialog.value = false;
      fetchTransactions();
      $q.notify({
        type: 'positive',
        message: 'Transaction added successfully',
      });
    }

    const exportPDF = () => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
        });

        doc.setFontSize(18);
        doc.setTextColor(41, 128, 185);
        doc.setFont('helvetica', 'bold');
        doc.text('Transaction Report', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`User ID: ${userid}`, 14, 36);

        const filtersText = `Active Filters: ${getActiveFilters() || 'None'}`;
        const splitFilters = doc.splitTextToSize(filtersText, 180);
        doc.text(splitFilters, 14, 42);

        const totals = calculateTotals();

        doc.setDrawColor(41, 128, 185);
        doc.setFillColor(236, 239, 241);
        doc.roundedRect(14, 50, 180, 30, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text('Summary', 22, 60);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Income: +${totals.income.toFixed(2)} €`, 60, 60);
        doc.text(`Expenses: -${totals.expense.toFixed(2)} €`, 60, 68);
        doc.text(`Balance: ${totals.balance.toFixed(2)} €`, 60, 76);

        const tableData = filteredTransactions.value.map((t) => [
          t.date,
          t.title,
          t.category,
          t.type === 'income' ? 'Income' : 'Expense',
          {
            content: `${Number(t.amount).toFixed(2)} ${t.currency || '€'}`,
            styles: {
              fontStyle: t.type === 'income' ? 'bold' : 'normal',
              textColor: t.type === 'income' ? [0, 128, 0] : [128, 0, 0],
            },
          },
        ]);

        autoTable(doc, {
          startY: 90,
          head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 3,
            valign: 'middle',
          },
          columnStyles: {
            0: { cellWidth: 20, halign: 'left' },
            1: { cellWidth: 70 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30, halign: 'right' },
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { left: 14, right: 14 },
          styles: {
            overflow: 'linebreak',
            lineWidth: 0.1,
          },
          didDrawPage: function (data) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            const pageCount = doc.internal.getNumberOfPages();
            doc.text(
              `Page ${data.pageNumber} of ${pageCount}`,
              data.settings.margin.left,
              doc.internal.pageSize.height - 10,
            );
          },
        });

        doc.save(`transactions_report_${new Date().toISOString().slice(0, 10)}.pdf`);

        $q.notify({
          type: 'positive',
          message: 'PDF report generated successfully',
          icon: 'picture_as_pdf',
          position: 'top-right',
        });
      } catch (error) {
        console.error('PDF generation failed:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to generate PDF report: ' + error.message,
          icon: 'error',
          position: 'top-right',
          timeout: 5000,
        });
      }
    };

    const exportCSV = () => {
      try {
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const data = filteredTransactions.value.map((t) => ({
          date: t.date,
          description: t.title,
          category: t.category,
          type: t.type === 'income' ? 'Income' : 'Expense',
          amount: `${t.type === 'income' ? '+' : '-'}${t.amount} ${t.currency || '€'}`,
        }));

        let csv = headers.join(',') + '\n';
        data.forEach((row) => {
          csv +=
            Object.values(row)
              .map((value) => `"${value.toString().replace(/"/g, '""')}"`)
              .join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $q.notify({
          type: 'positive',
          message: 'CSV exported successfully',
        });
      } catch (error) {
        console.error('CSV export failed:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to export CSV',
        });
      }
    };

    const calculateTotals = () => {
      const totals = {
        income: 0,
        expense: 0,
        balance: 0,
      };

      filteredTransactions.value.forEach((t) => {
        const amount = Number(t.amount);

        if (t.type === 'income') {
          totals.income += amount;
        } else {
          totals.expense += amount;
        }
      });

      totals.balance = totals.income - totals.expense;
      return totals;
    };

    const getActiveFilters = () => {
      const activeFilters = [];
      if (searchText.value) activeFilters.push(`Search: "${searchText.value}"`);
      if (transactionType.value) activeFilters.push(`Type: ${transactionType.value}`);
      if (selectedCategories.value.length > 0) {
        const categoryNames = selectedCategories.value.map(
          (id) => categories.value.find((c) => c.id === id)?.name || id,
        );
        activeFilters.push(`Categories: ${categoryNames.join(', ')}`);
      }
      if (amountRange.value.min > 0 || amountRange.value.max < 5000) {
        activeFilters.push(`Amount: ${amountRange.value.min}€-${amountRange.value.max}€`);
      }
      return activeFilters.length > 0 ? activeFilters.join(', ') : 'None';
    };

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
      exportPDF,
      exportCSV,
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

.q-btn-group {
  margin-bottom: 16px;
}
</style>
