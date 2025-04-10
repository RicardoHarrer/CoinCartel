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
      <div
        v-for="item in formattedTransactions"
        :key="item.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <TransactionCard :data="item" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import TransactionCard from '@/components/TransactionCard.vue'

const transactions = ref([])

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/transactions')
    transactions.value = response.data
  } catch (err) {
    console.error('Fehler beim Laden der Transaktionen:', err)
  }
})

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
    4: 'Kleidung',
    5: 'Tabak'
  }
  return categories[categoryId] || 'Unbekannt'
}
</script>

<style scoped>
.q-toolbar {
  justify-content: center;
  padding: 0;
}
</style>