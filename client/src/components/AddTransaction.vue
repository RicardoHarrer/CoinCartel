<script>
import { ref } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
  emits: ['transaction-added'],

  setup(props, { emit }) {
    const newTransaction = ref({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      transaction_type: 'Einnahme',
      category_id: '',
      currency: 'EUR',
      description: '',
    });

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

    const addTransaction = async () => {
      const userid = decodeToken();
      if (!userid) {
        console.error('User ID not found. Please log in.');
        return;
      }

      const payload = {
        userId: userid,
        categoryId: newTransaction.value.category_id,
        amount: newTransaction.value.amount,
        transactionType: newTransaction.value.transaction_type,
        currency: newTransaction.value.currency,
        date: newTransaction.value.date + ' 24:00:00',
        description: newTransaction.value.description,
      };

      try {
        const response = await axios.post(`http://localhost:3000/transactions`, payload);

        if (response.status === 200) {
          console.log('Transaction successfully added');
          newTransaction.value = {
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            transaction_type: 'Einnahme',
            category_id: '',
            currency: 'EUR',
            description: '',
          };

          emit('transaction-added');
        } else {
          console.error('Failed to add transaction:', response.data);
        }
      } catch (error) {
        console.error('Error adding transaction:', error);
      }
    };

    const onSubmit = () => {
      addTransaction();
    };

    return {
      newTransaction,
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
      <q-form @submit="onSubmit" class="q-gutter-md">
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
          v-model="newTransaction.amount"
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

        <q-input
          filled
          v-model="newTransaction.category_id"
          label="Category"
          stack-label
          required
        />

        <q-input
          filled
          v-model="newTransaction.currency"
          label="Currency"
          stack-label
          required
        />

        <q-input
          filled
          v-model="newTransaction.description"
          label="Description"
          stack-label
        />

        <div class="flex justify-end">
          <q-btn
            label="Add Transaction"
            type="submit"
            color="primary"
            class="q-mt-md"
          />
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