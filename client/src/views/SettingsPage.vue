<template>
  <q-page class="q-pa-lg bg-page responsive-page-padding">
    <div class="modern-settings">
      <div class="dark-mode-toggle">
        <q-btn 
          round 
          :color="$q.dark.isActive ? 'grey-9' : 'yellow-9'" 
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'" 
          class="toggle-btn"
          @click="toggleDarkMode"
          size="lg"
        />
      </div>

      <div class="settings-header q-mb-xl">
        <h1 class="text-h3 text-weight-bold text-dark q-mb-xs">Settings</h1>
        <p class="text-subtitle1 text-grey-7">Customize your financial dashboard experience</p>
      </div>

      <div class="settings-grid">
        <q-card class="settings-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="tune" size="24px" class="text-primary" />
              <h3 class="text-h6 text-weight-medium">Financial Preferences</h3>
            </div>
            <p class="text-caption text-grey-6 q-mb-lg">Configure your currency and budget settings</p>

            <q-form @submit="savePreferences" class="settings-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="text-weight-medium">Preferred Currency</label>
                  <q-select
                    v-model="form.preferred_currency"
                    :options="currencyOptions"
                    outlined
                    map-options
                    emit-value
                    :loading="loadingCurrencies"
                    rules="required"
                    class="modern-select q-mb-md"
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
                  <label class="text-weight-medium">Monthly Budget</label>
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
                    class="modern-input q-mb-md"
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

        <q-card class="settings-card">
          <q-card-section class="card-section">
            <div class="section-header">
              <q-icon name="translate" size="24px" class="text-primary" />
              <h3 class="text-h6 text-weight-medium">Language & Translation</h3>
            </div>
            <p class="text-caption text-grey-6 q-mb-lg">Translate the website to your preferred language</p>

            <div class="translation-info">
              <div class="info-icon">
                <q-icon name="language" size="48px" color="primary" />
              </div>
              <div class="info-content">
                <h4 class="text-h6 text-weight-medium q-mb-sm">Google Translate Widget</h4>
                <p class="text-body2 text-grey-7 q-mb-lg">
                  Use the Google Translate widget in the top right corner to translate the
                  entire website to your preferred language.
                </p>

                <div class="translation-example">
                  <button
                    v-for="lang in translationLanguages"
                    :key="lang.code"
                    type="button"
                    class="example-item"
                    @click="changeWebsiteLanguage(lang.code, lang.label)"
                  >
                    <span class="lang-flag">{{ lang.flag }}</span>
                    <span class="text-caption">{{ lang.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <q-card class="settings-card settings-card--full q-mt-lg">
        <q-card-section class="card-section">
          <div class="section-header">
            <q-icon name="account_balance" size="24px" class="text-primary" />
            <h3 class="text-h6 text-weight-medium">Bank Import</h3>
          </div>
          <p class="text-caption text-grey-6 q-mb-md">
            Alle Bank-Import-Funktionen sind jetzt direkt in den Settings verfugbar.
          </p>
          <BankImportView :embedded="true" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "vue-router";
import { auth } from "@/utils/auth";
import BankImportView from "@/views/BankImportView.vue";

export default defineComponent({
  name: "SettingsPage",
  components: {
    BankImportView,
  },
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const loading = ref(false);
    const loadingCurrencies = ref(false);
    const exchangeRates = ref({});
    const currencyOptions = ref([]);
    const translationLanguages = ref([
      { code: "en", label: "English", flag: "🇺🇸" },
      { code: "de", label: "Deutsch", flag: "🇩🇪" },
      { code: "fr", label: "Français", flag: "🇫🇷" },
      { code: "es", label: "Español", flag: "🇪🇸" },
    ]);

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

    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);
    };

    const changeWebsiteLanguage = (langCode, langLabel) => {
      try {
        const target = (langCode || "en").toLowerCase();
        const cookieValue = `/en/${target}`;
        document.cookie = `googtrans=${cookieValue};path=/`;
        const host = window.location.hostname;
        if (host && host !== "localhost" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
          document.cookie = `googtrans=${cookieValue};path=/;domain=.${host}`;
        }
        document.documentElement.setAttribute("lang", langCode);
        localStorage.setItem("vaultly_selected_language", target);
        let tries = 0;
        const maxTries = 10;
        const timer = window.setInterval(() => {
          const translateSelect = document.querySelector(".goog-te-combo");
          if (translateSelect) {
            translateSelect.value = langCode;
            translateSelect.dispatchEvent(new Event("change"));
            window.clearInterval(timer);
            $q.notify({
              type: "positive",
              message: `Language switched to ${langLabel}`,
            });
            return;
          }

          tries += 1;
          if (tries >= maxTries) {
            window.clearInterval(timer);
            window.location.reload();
          }
        }, 250);
      } catch (error) {
        console.error("Error switching website language:", error);
        $q.notify({
          type: "negative",
          message: "Could not switch language.",
        });
      }
    };

    onMounted(async () => {
      await fetchExchangeRates();
      await fetchUserPreferences();
    });

    return {
      form,
      currencyOptions,
      translationLanguages,
      loading,
      loadingCurrencies,
      convertedBudget,
      savePreferences,
      changeWebsiteLanguage,
      toggleDarkMode,
    };
  },
});
</script>

<style lang="scss" scoped>
.modern-settings {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.dark-mode-toggle {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
}

.toggle-btn {
  width: 60px;
  height: 60px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 2px solid #dee2e6 !important;
}

.toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  border-color: #adb5bd !important;
}

.settings-header {
  text-align: center;
  padding: 16px 0;
  border-bottom: 2px solid #e9ecef;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.settings-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid #dee2e6 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    border-color: #adb5bd !important;
  }
}

.settings-card--full {
  grid-column: 1 / -1;
}

.card-section {
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    flex: 1;
  }
}

.settings-form {
  .form-row {
    display: grid;
    gap: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    margin-bottom: 8px;
  }
}

.modern-select,
.modern-input {
  .q-field__control {
    border-radius: 8px;
    height: 48px;
  }
}

.selected-currency {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.currency-flag {
  font-size: 1.1rem;
}

.currency-badge {
  background: #1976d2;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.budget-preview {
  margin-top: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.preview-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 4px;
}

.preview-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.save-btn {
  width: 100%;
  border-radius: 8px;
  font-weight: 600;
  padding: 12px;
  border: none !important;
  background: #1976d2 !important;
  color: white !important;
  transition: all 0.3s ease;

  &:hover {
    background: #1565c0 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  }
}

.translation-info {
  text-align: center;
  padding: 16px 0;
}

.info-icon {
  margin-bottom: 20px;
}

.info-content {
  h4 {
    margin: 0 0 8px 0;
  }

  p {
    line-height: 1.6;
    margin-bottom: 20px;
  }
}

.translation-example {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.lang-flag {
  font-size: 1.2rem;
}

body.body--dark .bg-page {
  background: #121212 !important;
}

body.body--dark .settings-header {
  border-bottom-color: rgba(255, 255, 255, 0.15) !important;
}

body.body--dark .settings-header .text-dark {
  color: #ffffff !important;
}

body.body--dark .settings-header .text-grey-7 {
  color: #b0b0b0 !important;
}

body.body--dark .settings-card {
  background: #1e1e1e !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .settings-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

body.body--dark .settings-card .text-grey-6 {
  color: #b0b0b0 !important;
}

body.body--dark .budget-preview {
  background: rgba(255, 255, 255, 0.05) !important;
  border-left-color: #42a5f5 !important;
}

body.body--dark .budget-preview .preview-label {
  color: #b0b0b0 !important;
}

body.body--dark .budget-preview .preview-amount {
  color: #ffffff !important;
}

body.body--dark .translation-example .example-item {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .translation-example .example-item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .translation-example .example-item .text-caption {
  color: #ffffff !important;
}

body.body--dark .save-btn {
  border: none !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

body.body--dark .save-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark .modern-select .q-field__control,
body.body--dark .modern-input .q-field__control {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

body.body--dark .modern-select .q-field__label,
body.body--dark .modern-input .q-field__label {
  color: #b0b0b0 !important;
}

body.body--dark .currency-badge {
  background: #42a5f5 !important;
}

@media (max-width: 768px) {
  .responsive-page-padding {
    padding: 12px !important;
  }

  .modern-settings {
    padding: 8px;
  }

  .settings-grid {
    gap: 16px;
  }

  .card-section {
    padding: 20px;
  }

  .translation-example {
    grid-template-columns: 1fr;
  }

  .dark-mode-toggle {
    bottom: 16px;
    left: 16px;
  }

  .toggle-btn {
    width: 56px;
    height: 56px;
  }

  .form-row {
    gap: 16px;
  }
}

.q-btn, .settings-card, .example-item, .toggle-btn, .save-btn {
  transition: all 0.3s ease;
}
</style>
