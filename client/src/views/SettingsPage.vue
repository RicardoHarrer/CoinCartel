<script>
import { defineComponent, ref, onMounted } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'SettingsPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const loading = ref(false);
    const saving = ref(false);
    const error = ref(null);

    const userPreferences = ref({
      preferred_currency: 'EUR',
      saldo: 1000.0,
    });

    const currencyOptions = ref([]);
    const userId = ref(null);

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

    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(
          'https://v6.exchangerate-api.com/v6/1bfd15eb1d48a0a8759f2adf/latest/EUR',
        );

        const currencies = Object.keys(response.data.conversion_rates).map((code) => ({
          label: code,
          value: code,
        }));

        currencies.sort((a, b) => a.label.localeCompare(b.label));
        return currencies;
      } catch (err) {
        console.error('Error fetching currencies:', err);
        return [
          { label: 'EUR', value: 'EUR' },
          { label: 'USD', value: 'USD' },
          { label: 'GBP', value: 'GBP' },
          { label: 'JPY', value: 'JPY' },
          { label: 'CAD', value: 'CAD' },
          { label: 'AUD', value: 'AUD' },
        ];
      }
    };

    const fetchUserPreferences = async () => {
      loading.value = true;
      userId.value = decodeToken();

      try {
        currencyOptions.value = await fetchCurrencies();

        const response = await axios.get(`http://localhost:3000/preferences/${userId.value}`);
        if (response.data) {
          userPreferences.value = response.data;
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        error.value = 'Failed to fetch user preferences.';
      } finally {
        loading.value = false;
      }
    };

    const savePreferences = async () => {
      saving.value = true;
      try {
        const response = await axios.patch(`http://localhost:3000/preferences/${userId.value}`, {
          preferred_currency: userPreferences.value.preferred_currency,
          saldo: userPreferences.value.saldo,
        });

        userPreferences.value = response.data;

        $q.notify({
          type: 'positive',
          message: 'Preferences saved successfully!',
        });

        router.push('/chart');
      } catch (err) {
        console.error('Error saving preferences:', err);
        $q.notify({
          type: 'negative',
          message: 'Failed to save preferences.',
        });
      } finally {
        saving.value = false;
      }
    };

    onMounted(() => {
      fetchUserPreferences();
    });

    return {
      userPreferences,
      currencyOptions,
      loading,
      saving,
      error,
      savePreferences,
    };
  },
});
</script>

<template>
  <div class="q-pa-md">
    <q-card class="settings-card">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">User Settings</div>
      </q-card-section>

      <q-card-section>
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-sm">Loading settings...</div>
        </div>

        <div v-else>
          <q-form @submit="savePreferences" class="q-gutter-md">
            <q-select
              filled
              v-model="userPreferences.preferred_currency"
              :options="currencyOptions"
              label="Preferred Currency"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Currency is required']"
            />

            <q-input
              filled
              type="number"
              v-model.number="userPreferences.saldo"
              label="Monthly Budget"
              :prefix="userPreferences.preferred_currency || '€'"
              step="0.01"
              min="0"
              :rules="[
                (val) => (val !== null && val !== '') || 'Budget is required',
                (val) => val >= 0 || 'Budget must be positive',
              ]"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Save" type="submit" color="primary" :loading="saving" />
            </div>
          </q-form>
        </div>

        <div v-if="error" class="text-negative q-mt-md">{{ error }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
.settings-card {
  max-width: 600px;
  margin: 0 auto;
}
</style>
