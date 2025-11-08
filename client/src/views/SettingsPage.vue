//SettingsPage.vue
<!-- ALTE TEMPLATE-SECTION LÖSCHEN UND DIESE EINFÜGEN -->
<template>
  <div class="modern-settings">
    <div class="settings-header">
      <h1>Settings</h1>
      <p>Customize your financial dashboard experience</p>
    </div>

    <div class="settings-grid">
      <!-- Preferences Card -->
      <q-card class="settings-card">
        <q-card-section class="card-header">
          <q-icon name="tune" size="24px" class="header-icon" />
          <div>
            <h3>Financial Preferences</h3>
            <p>Configure your currency and budget settings</p>
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="savePreferences" class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label>Preferred Currency</label>
                <q-select
                  v-model="form.preferred_currency"
                  :options="currencyOptions"
                  outlined
                  map-options
                  emit-value
                  :loading="loadingCurrencies"
                  rules="required"
                  class="modern-select"
                >
                  <template v-slot:selected>
                    <div class="selected-currency">
                      <span class="currency-flag">💰</span>
                      {{ form.preferred_currency }}
                    </div>
                  </template>
                </q-select>
              </div>

              <div class="form-group">
                <label>Monthly Budget</label>
                <q-input
                  v-model.number="form.saldo"
                  type="number"
                  outlined
                  :rules="[
                    (val) => val >= 0 || 'Budget must be positive',
                    (val) => val !== null || 'Budget is required',
                  ]"
                  step="0.01"
                  min="0"
                  class="modern-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="euro" />
                  </template>
                  <template v-slot:append>
                    <span class="currency-badge">{{ form.preferred_currency }}</span>
                  </template>
                </q-input>

                <div class="budget-preview">
                  <div class="preview-label">Monthly Overview</div>
                  <div class="preview-amount">
                    {{ form.saldo }} {{ form.preferred_currency }}
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <q-btn
                label="Save Preferences"
                type="submit"
                color="primary"
                :loading="loading"
                class="save-btn"
                icon="save"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Translation Card -->
      <q-card class="settings-card">
        <q-card-section class="card-header">
          <q-icon name="translate" size="24px" class="header-icon" />
          <div>
            <h3>Language & Translation</h3>
            <p>Translate the website to your preferred language</p>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="translation-info">
            <div class="info-icon">
              <q-icon name="language" size="48px" color="primary" />
            </div>
            <div class="info-content">
              <h4>Google Translate Widget</h4>
              <p>
                Use the Google Translate widget in the top right corner to translate the
                entire website to your preferred language.
              </p>

              <div class="translation-example">
                <div class="example-item">
                  <span class="lang-flag">🇺🇸</span>
                  <span>English</span>
                </div>
                <div class="example-item">
                  <span class="lang-flag">🇩🇪</span>
                  <span>Deutsch</span>
                </div>
                <div class="example-item">
                  <span class="lang-flag">🇫🇷</span>
                  <span>Français</span>
                </div>
                <div class="example-item">
                  <span class="lang-flag">🇪🇸</span>
                  <span>Español</span>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
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
.modern-settings {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 40px;
}

.settings-header h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.settings-header p {
  font-size: 1.2rem;
  color: #718096;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 968px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

.settings-card {
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 30px;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-bottom: 1px solid #e2e8f0;
}

.header-icon {
  color: #667eea;
}

.card-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #2d3748;
}

.card-header p {
  margin: 5px 0 0 0;
  color: #718096;
}

.settings-form {
  padding: 20px 30px 30px;
}

.form-row {
  display: grid;
  gap: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
}

.modern-select .q-field__control,
.modern-input .q-field__control {
  border-radius: 12px;
  height: 56px;
}

.selected-currency {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.currency-flag {
  font-size: 1.2rem;
}

.currency-badge {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.budget-preview {
  margin-top: 15px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.preview-label {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 5px;
}

.preview-amount {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2d3748;
}

/* KORRIGIERTER BUTTON-BEREICH - ZENTRIERT UND GESTYLET */
.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.save-btn {
  padding: 14px 40px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  background: linear-gradient(45deg, #667eea, #764ba2) !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
  transition: all 0.3s ease !important;
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.save-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
}

.save-btn:active {
  transform: translateY(0) !important;
}

/* Translation Section */
.translation-info {
  padding: 20px;
}

.info-icon {
  text-align: center;
  margin-bottom: 20px;
}

.info-content h4 {
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 1.2rem;
}

.info-content p {
  color: #718096;
  line-height: 1.6;
  margin-bottom: 20px;
}

.translation-example {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f7fafc;
  border-radius: 8px;
}

.lang-flag {
  font-size: 1.2rem;
}

/* Form Element Spacing */
.q-input,
.q-select {
  margin-bottom: 20px;
}

/* Dark Mode */
.body--dark .settings-card .card-header {
  background: linear-gradient(135deg, #2d3748, #4a5568);
  border-bottom-color: #4a5568;
}

.body--dark .settings-card .card-header h3 {
  color: #f7fafc;
}

.body--dark .settings-card .card-header p {
  color: #cbd5e0;
}

.body--dark .settings-form .form-group label {
  color: #f7fafc;
}

.body--dark .budget-preview {
  background: #2d3748;
}

.body--dark .preview-amount {
  color: #f7fafc;
}

.body--dark .info-content h4 {
  color: #f7fafc;
}

.body--dark .translation-example .example-item {
  background: #2d3748;
  color: #f7fafc;
}
</style>
