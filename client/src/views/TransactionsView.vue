<template>
  <q-page class="q-pa-md">
    <div class="column items-center q-mb-lg">
      <q-toolbar class="text-center">
        <q-toolbar-title class="text-h4 text-primary">
          Transaktionen
        </q-toolbar-title>
      </q-toolbar>

      <q-separator color="primary" class="full-width q-my-md" />
    </div>

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
        v-for="item in formattedTransactions"
        :key="item.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <TransactionCard
          :data="item"
          @delete="deleteTransaction(item.id)"
        />
      </div>
    </div>

    <!-- Add Transaction Dialog (wie in Ihrer Chart-Komponente) -->
    <q-dialog v-model="showAddTransactionDialog">
      <AddTransaction @transaction-added="handleTransactionAdded" />
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import TransactionCard from '@/components/TransactionCard.vue'
import AddTransaction from '@/components/AddTransaction.vue'

export default defineComponent({
  components: { TransactionCard, AddTransaction },
  setup() {
    const transactions = ref([])
    const showAddTransactionDialog = ref(false)

    const decodeToken = () => {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found! Please log in.')
        return null
      }
      try {
        const decodedToken = jwtDecode(token)
        return decodedToken.id || null
      } catch (error) {
        console.error('Invalid token:', error)
        return null
      }
    }

    const userid = decodeToken()

    onMounted(async () => {
      await fetchTransactions()
    })

    async function fetchTransactions() {
      try {
        const response = await axios.get(`http://localhost:3000/transactions/users/${userid}`)
        transactions.value = response.data
      } catch (err) {
        console.error('Fehler beim Laden der Transaktionen:', err)
      }
    }

    const formattedTransactions = computed(() => {
      return transactions.value.map(transaction => ({
        id: transaction.id,
        title: transaction.description || 'Keine Beschreibung',
        category: getCategoryName(transaction.category_id),
        amount: transaction.amount,
        type: transaction.transaction_type === 'Einnahme' ? 'income' : 'expense',
        currency: transaction.currency,
        date: new Date(transaction.date).toLocaleDateString('de-DE')
      }))
    })

    const getCategoryName = (categoryId) => {
      const categories = {
        1: 'Lebensmittel',
        2: 'Miete',
        3: 'Freizeit',
        4: 'Kleidung'
      }
      return categories[categoryId] || 'Unbekannt'
    }

    async function deleteTransaction(id) {
      try {
        await axios.delete(`http://localhost:3000/transactions/${id}`)
        await fetchTransactions()
      } catch (err) {
        console.error('Fehler beim Löschen der Transaktion:', err)
      }
    }

    function handleTransactionAdded() {
      showAddTransactionDialog.value = false
      fetchTransactions()
    }

    return {
      transactions,
      formattedTransactions,
      showAddTransactionDialog,
      deleteTransaction,
      handleTransactionAdded
    }
  }
})
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