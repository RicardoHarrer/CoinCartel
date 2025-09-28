<template>
  <div class="q-pa-md">
    <q-card class="settings-card">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">User Settings</div>
      </q-card-section>

      <q-card-section>
        <!-- Language Translation Info -->
        <q-card flat bordered class="q-mb-lg bg-blue-1">
          <q-card-section>
            <div class="row items-center">
              <q-icon name="translate" size="24px" class="q-mr-sm" />
              <div>
                <div class="text-weight-bold">Website Translation</div>
                <div class="text-caption q-mt-xs">
                  Use the Google Translate widget in the top right corner to translate the
                  entire website.
                </div>
                <div class="text-caption q-mt-xs">
                  Verwenden Sie das Google Translate-Widget in der oberen rechten Ecke, um
                  die gesamte Website zu übersetzen.
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Abstand zwischen Übersetzung und Formular -->
        <div class="separator-space"></div>

        <q-form @submit="savePreferences" class="q-gutter-md">
          <q-select
            v-model="form.preferred_currency"
            :options="currencyOptions"
            label="Preferred Currency"
            outlined
            map-options
            emit-value
            :loading="loadingCurrencies"
            rules="required"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No currencies available
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-model.number="form.saldo"
            type="number"
            label="Monthly Budget"
            outlined
            :rules="[
              (val) => val >= 0 || 'Budget must be positive',
              (val) => val !== null || 'Budget is required',
            ]"
            step="0.01"
            min="0"
            :suffix="form.preferred_currency"
          >
          </q-input>

          <div class="row justify-end q-mt-lg">
            <q-btn
              label="Save Settings"
              type="submit"
              color="primary"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "vue-router";
import { auth } from "@/utils/auth";

export default defineComponent({
  name: "SettingsPage",
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const loading = ref(false);
    const loadingCurrencies = ref(false);
    const exchangeRates = ref({});
    const currencyOptions = ref([]);

    const form = ref({
      preferred_currency: "EUR",
      saldo: 1000.0,
    });

    function decodeToken() {
      const token = auth.getToken();
      if (!token) return null;
      try {
        console.log("Decoding token:", jwtDecode(token));
        return jwtDecode(token).id;
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }

    const userId = decodeToken();

    const fetchUserPreferences = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/preferences/${userId}`);
        if (response.data && response.data.length > 0) {
          form.value = {
            preferred_currency: response.data[0].preferred_currency || "EUR",
            saldo: parseFloat(response.data[0].saldo) || 1000.0,
          };
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    const fetchExchangeRates = async () => {
      loadingCurrencies.value = true;
      try {
        const response = await axios.get(
          "https://v6.exchangerate-api.com/v6/1bfd15eb1d48a0a8759f2adf/latest/EUR"
        );
        exchangeRates.value = response.data.conversion_rates;
        currencyOptions.value = Object.keys(exchangeRates.value).map((code) => ({
          label: code,
          value: code,
        }));
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load currency data. Using default options.",
        });
        currencyOptions.value = [
          { label: "EUR", value: "EUR" },
          { label: "USD", value: "USD" },
          { label: "GBP", value: "GBP" },
          { label: "JPY", value: "JPY" },
        ];
      } finally {
        loadingCurrencies.value = false;
      }
    };

    const savePreferences = async () => {
      loading.value = true;
      try {
        await axios.patch(`http://localhost:3000/preferences/${userId}`, {
          preferred_currency: form.value.preferred_currency,
          saldo: form.value.saldo,
        });

        $q.notify({
          type: "positive",
          message: "Preferences saved successfully!",
        });

        router.push({ path: "/chart", query: { saved: true } });
      } catch (error) {
        console.error("Error saving preferences:", error);
        $q.notify({
          type: "negative",
          message: "Failed to save preferences. Please try again.",
        });
      } finally {
        loading.value = false;
      }
    };

    const convertedBudget = computed(() => {
      if (!exchangeRates.value[form.value.preferred_currency]) return "N/A";
      return (
        form.value.saldo * exchangeRates.value[form.value.preferred_currency]
      ).toFixed(2);
    });

    onMounted(async () => {
      await fetchExchangeRates();
      await fetchUserPreferences();
    });

    return {
      form,
      currencyOptions,
      loading,
      loadingCurrencies,
      convertedBudget,
      savePreferences,
    };
  },
});
</script>

<style scoped>
.settings-card {
  max-width: 600px;
  margin: 0 auto;
}

.q-input,
.q-select {
  margin-bottom: 20px;
}

/* Abstand zwischen Übersetzung und Formular */
.separator-space {
  height: 24px;
  margin: 16px 0;
  border-bottom: 1px solid #e0e0e0;
}

/* Dark Mode Support */
.body--dark .separator-space {
  border-bottom: 1px solid #424242;
}

/* Mehr Abstand für die Übersetzungszeilen */
.text-caption {
  line-height: 1.4;
}

/* Button mehr Abstand */
.q-btn {
  margin-top: 8px;
}
</style>
