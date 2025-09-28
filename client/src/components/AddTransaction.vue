<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useQuasar } from 'quasar';

export default {
  emits: ['transaction-added'],

  setup(props, { emit }) {
    const $q = useQuasar();
    const newTransaction = ref({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      transaction_type: 'Einnahme',
      category_id: null,
      currency: 'EUR',
      description: '',
    });

    const categories = ref([]);

    const decodeToken = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found! Please log in.');
        return null;
      }

      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.id || null;
      } catch (error) {
        console.error('Invalid token:', error);
        return null;
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3000/categories');
        categories.value = response.data;
      } catch (err) {
        console.error('Fehler beim Laden der Kategorien:', err);
        $q.notify({
          type: 'negative',
          message: 'Failed to load categories',
        });
      }
    };

    const addTransaction = async () => {
      const userid = decodeToken();
      if (!userid) {
        console.error('User ID not found. Please log in.');
        $q.notify({
          type: 'negative',
          message: 'Please log in to add transactions',
        });
        return;
      }

      if (!newTransaction.value.category_id) {
        $q.notify({
          type: 'negative',
          message: 'Please select a category',
        });
        return;
      }

      const payload = {
        userId: userid,
        categoryId: Number(newTransaction.value.category_id),
        amount: Number(newTransaction.value.amount),
        transactionType: newTransaction.value.transaction_type,
        currency: newTransaction.value.currency,
        date: newTransaction.value.date + 'T00:00:00',
        description: newTransaction.value.description,
      };

      try {
        const response = await axios.post('http://localhost:3000/transactions', payload);

        if (response.status === 201) {
          $q.notify({
            type: 'positive',
            message: 'Transaction successfully added',
          });

          newTransaction.value = {
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            transaction_type: 'Einnahme',
            category_id: null,
            currency: 'EUR',
            description: '',
          };

          emit('transaction-added');
        }
      } catch (error) {
        console.error('Error adding transaction:', error);
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to add transaction',
        });
      }
    };

    const onSubmit = () => {
      addTransaction();
    };

    onMounted(async () => {
      await fetchCategories();
    });

    return {
      newTransaction,
      categories,
      onSubmit,
    };
  },
};
</script>

<template>
  <q-card class="add-transaction-card">
    <q-card-section class="bg-primary text-white">
      <div class="text-h6">Add New Transaction</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit.prevent="onSubmit" class="q-gutter-md">
        <q-input
          filled
          v-model="newTransaction.date"
          label="Date"
          type="date"
          stack-label
          required
        />

        <q-input
          filled
          v-model.number="newTransaction.amount"
          label="Amount"
          type="number"
          step="0.01"
          stack-label
          required
        />

        <q-select
          filled
          v-model="newTransaction.transaction_type"
          label="Type"
          :options="['Einnahme', 'Ausgabe']"
          stack-label
          required
        />

        <q-select
          filled
          v-model.number="newTransaction.category_id"
          label="Category"
          :options="
            categories.map((c) => ({
              label: c.name,
              value: c.id,
            }))
          "
          option-value="value"
          option-label="label"
          emit-value
          map-options
          stack-label
          required
        />

        <q-input filled v-model="newTransaction.currency" label="Currency" stack-label required />

        <q-input filled v-model="newTransaction.description" label="Description" stack-label />

        <div class="flex justify-end">
          <q-btn label="Add Transaction" type="submit" color="primary" class="q-mt-md" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.add-transaction-card {
  width: 100%;
  max-width: 500px;
  margin: auto;
}

.q-card-section {
  padding: 20px;
}

.q-input,
.q-select {
  margin-bottom: 16px;
}

.flex.justify-end {
  display: flex;
  justify-content: flex-end;
}
</style>
