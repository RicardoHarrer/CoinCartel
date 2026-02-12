<template>
  <q-card class="creator-card bg-surface">
    <q-card-section class="q-pb-none">
      <div class="text-h5 text-weight-bold text-dark">
        {{ editGoal ? "Ziel bearbeiten" : "Neues Sparziel" }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-md">
      <q-form @submit="submitGoal" class="q-gutter-y-md">
        <div v-if="!editGoal" class="q-mb-lg">
          <div class="text-subtitle1 text-weight-medium text-dark q-mb-sm">
            Schnellauswahl
          </div>
          <div class="row q-col-gutter-sm">
            <div
              v-for="(suggestion, index) in goalSuggestions"
              :key="index"
              class="col-6"
            >
              <q-card
                class="cursor-pointer suggestion-card bg-card"
                @click="applySuggestion(suggestion)"
              >
                <q-card-section class="text-center q-pa-sm">
                  <q-icon name="savings" size="md" color="primary" class="q-mb-xs" />
                  <div class="text-caption text-weight-bold text-dark">
                    {{ suggestion.title }}
                  </div>
                  <div class="text-h6 text-primary">
                    €{{ formatNumber(suggestion.target_amount) }}
                  </div>
                  <q-badge :label="suggestion.category" color="accent" />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <q-input
          v-model="formData.title"
          label="Ziel-Titel"
          placeholder="z.B. Neues Auto, Urlaub, Notgroschen..."
          :rules="[(val) => !!val || 'Titel ist erforderlich']"
          filled
          class="input-field"
          color="primary"
          :dark="$q.dark.isActive"
        />

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-input
              v-model="formData.target_amount"
              label="Zielbetrag (€)"
              type="number"
              :rules="[
                (val) => !!val || 'Zielbetrag ist erforderlich',
                (val) => val > 0 || 'Betrag muss positiv sein',
              ]"
              filled
              class="input-field"
              color="primary"
              :dark="$q.dark.isActive"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="formData.current_amount"
              label="Aktueller Betrag (€)"
              type="number"
              filled
              class="input-field"
              color="primary"
              :dark="$q.dark.isActive"
            />
          </div>
        </div>

        <q-input
          v-model="formData.target_date"
          label="Ziel-Datum"
          type="date"
          :rules="[(val) => !!val || 'Datum ist erforderlich']"
          filled
          class="input-field"
          color="primary"
          :dark="$q.dark.isActive"
        />

        <q-select
          v-model="formData.category_id"
          :options="categoryOptions"
          label="Kategorie"
          emit-value
          map-options
          filled
          class="input-field"
          color="primary"
          :dark="$q.dark.isActive"
        />

        <q-input
          v-model="formData.description"
          label="Beschreibung"
          type="textarea"
          rows="2"
          filled
          class="input-field"
          color="primary"
          :dark="$q.dark.isActive"
        />

        <q-card
          v-if="formData.target_amount && formData.target_date"
          flat
          class="bg-info-card"
        >
          <q-card-section class="q-pa-md">
            <div class="text-subtitle2 text-weight-medium text-dark q-mb-sm">
              Sparplan
            </div>
            <div class="row justify-between items-center q-mb-sm">
              <div class="text-caption text-grey-7">Monatliche Sparrate:</div>
              <div class="text-h6 text-primary">€{{ monthlySaving }}</div>
            </div>

            <div v-if="currentProgress > 0" class="q-mt-md">
              <div class="row justify-between items-center q-mb-xs">
                <div class="text-caption text-grey-7">Fortschritt:</div>
                <div class="text-caption text-weight-bold text-primary">
                  {{ currentProgress.toFixed(1) }}%
                </div>
              </div>
              <q-linear-progress
                :value="currentProgress / 100"
                color="primary"
                size="6px"
                rounded
              />
            </div>
          </q-card-section>
        </q-card>

        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn
            label="Abbrechen"
            color="grey-6"
            flat
            v-close-popup
            @click="$emit('cancel')"
            class="cancel-button"
          />
          <q-btn
            :label="editGoal ? 'Aktualisieren' : 'Erstellen'"
            type="submit"
            color="primary"
            :loading="loading"
            class="action-button"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent, ref, computed, watch } from "vue";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "GoalCreator",
  props: {
    userId: {
      type: Number,
      required: true,
    },
    editGoal: {
      type: Object,
      default: null,
    },
  },
  emits: ["saved", "cancel"],
  setup(props, { emit }) {
    const $q = useQuasar();

    const loading = ref(false);

    const formData = ref({
      title: "",
      target_amount: "",
      current_amount: "0",
      target_date: "",
      category_id: null,
      description: "",
    });

    const goalSuggestions = [
      {
        title: "Notgroschen",
        target_amount: 3000,
        category: "Sparen",
        description: "3 Nettogehälter als Sicherheit",
      },
      {
        title: "Urlaubsgeld",
        target_amount: 1500,
        category: "Sparen",
        description: "Für den nächsten Sommerurlaub",
      },
      {
        title: "Smartphone",
        target_amount: 800,
        category: "Technik",
        description: "Aktuelles Modell ersetzen",
      },
      {
        title: "Auto-Reparatur",
        target_amount: 1200,
        category: "Auto",
        description: "Jährliche Wartungskosten",
      },
    ];

    const categoryOptions = computed(() => {
      return [
        { label: "Sparen", value: 11 },
        { label: "Investition", value: 12 },
        { label: "Urlaub", value: 13 },
        { label: "Auto", value: 14 },
        { label: "Technik", value: 15 },
        { label: "Sonstiges", value: 16 },
      ];
    });

    const monthlySaving = computed(() => {
      if (!formData.value.target_amount || !formData.value.target_date) return 0;

      const targetAmount = parseFloat(formData.value.target_amount);
      const currentAmount = parseFloat(formData.value.current_amount) || 0;
      const remaining = targetAmount - currentAmount;

      const today = new Date();
      const targetDate = new Date(formData.value.target_date);
      const monthsDiff =
        (targetDate.getFullYear() - today.getFullYear()) * 12 +
        (targetDate.getMonth() - today.getMonth());

      return monthsDiff > 0 ? (remaining / monthsDiff).toFixed(2) : remaining.toFixed(2);
    });

    const currentProgress = computed(() => {
      if (!formData.value.target_amount) return 0;
      const target = parseFloat(formData.value.target_amount);
      const current = parseFloat(formData.value.current_amount) || 0;
      return target > 0 ? (current / target) * 100 : 0;
    });

    const applySuggestion = (suggestion) => {
      const categoryOption = categoryOptions.value.find(
        (opt) => opt.label === suggestion.category
      );

      formData.value = {
        title: suggestion.title,
        target_amount: suggestion.target_amount.toString(),
        current_amount: "0",
        target_date: getDateInFuture(90),
        category_id: categoryOption ? categoryOption.value : null,
        description: suggestion.description,
      };
    };

    const getDateInFuture = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split("T")[0];
    };

    const formatNumber = (number) => {
      return new Intl.NumberFormat("de-DE").format(number);
    };

    const submitGoal = async () => {
      loading.value = true;

      try {
        const url = props.editGoal
          ? `http://localhost:3000/api/goals/${props.editGoal.id}`
          : "http://localhost:3000/api/goals";

        const response = await fetch(url, {
          method: props.editGoal ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: props.userId,
            title: formData.value.title,
            targetAmount: parseFloat(formData.value.target_amount),
            currentAmount: parseFloat(formData.value.current_amount) || 0,
            targetDate: formData.value.target_date,
            categoryId: formData.value.category_id,
            description: formData.value.description,
          }),
        });

        if (response.ok) {
          emit("saved");
        } else {
          throw new Error("Failed to save goal");
        }
      } catch (error) {
        $q.notify({
          type: "negative",
          message: "Fehler beim Speichern des Ziels",
        });
      } finally {
        loading.value = false;
      }
    };

    watch(
      () => props.editGoal,
      (newGoal) => {
        if (newGoal) {
          formData.value = {
            title: newGoal.title,
            target_amount: newGoal.target_amount.toString(),
            current_amount: newGoal.current_amount.toString(),
            target_date: newGoal.target_date.split("T")[0],
            category_id: newGoal.category_id,
            description: newGoal.description || "",
          };
        } else {
          formData.value = {
            title: "",
            target_amount: "",
            current_amount: "0",
            target_date: "",
            category_id: null,
            description: "",
          };
        }
      },
      { immediate: true }
    );

    return {
      loading,
      formData,
      goalSuggestions,
      categoryOptions,
      monthlySaving,
      currentProgress,
      applySuggestion,
      submitGoal,
      formatNumber,
    };
  },
});
</script>

<style scoped>
.creator-card {
  width: 600px;
  max-width: 90vw;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.suggestion-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.bg-info-card {
  background: rgba(25, 118, 210, 0.04) !important;
  border: 1px solid rgba(25, 118, 210, 0.12) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.action-button {
  border-radius: 8px;
  font-weight: 600;
}

.cancel-button {
  border-radius: 8px;
  font-weight: 600;
}

:deep(.input-field .q-field__control) {
  border-radius: 8px;
}

:deep(.input-field .q-field__label) {
  font-weight: 500;
}

body.body--dark .creator-card {
  background: #1e1e1e !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .creator-card .text-dark {
  color: #ffffff !important;
}

body.body--dark .suggestion-card {
  background: #2d2d2d !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .suggestion-card .text-dark {
  color: #ffffff !important;
}

body.body--dark .suggestion-card:hover {
  border-color: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .bg-info-card {
  background: rgba(66, 165, 245, 0.1) !important;
  border-color: rgba(66, 165, 245, 0.2) !important;
}

body.body--dark .bg-info-card .text-dark {
  color: #ffffff !important;
}

body.body--dark .bg-info-card .text-grey-7 {
  color: #b0b0b0 !important;
}

body.body--dark :deep(.q-field--filled .q-field__control) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark :deep(.q-field--filled .q-field__label) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-field--filled .q-field__native) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-field--filled .q-field__control:before) {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark :deep(.q-field--filled.q-field--focused .q-field__control) {
  background: rgba(255, 255, 255, 0.08) !important;
}

body.body--dark :deep(.q-field--filled .q-field__append) {
  color: #ffffff !important;
}

body.body--dark .action-button {
  background: #1976d2 !important;
  color: white !important;
  border: none !important;
}

body.body--dark .cancel-button {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  border: none !important;
}

body.body--dark .cancel-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark :deep(.q-badge) {
  background: rgba(66, 165, 245, 0.2) !important;
  color: #42a5f5 !important;
  border: 1px solid rgba(66, 165, 245, 0.3) !important;
}

body.body--dark :deep(.q-linear-progress__track) {
  background: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark :deep(.q-date) {
  background: #1e1e1e !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

body.body--dark :deep(.q-date .q-date__header) {
  background: #2d2d2d !important;
}

body.body--dark :deep(.q-date .q-date__navigation) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-date .q-date__calendar-item) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-date .q-date__calendar-item--in) {
  background: rgba(66, 165, 245, 0.2) !important;
}

body.body--dark :deep(.q-menu) {
  background: #1e1e1e !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

body.body--dark :deep(.q-item) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-item--active) {
  background: rgba(66, 165, 245, 0.2) !important;
  color: #42a5f5 !important;
}

body.body--dark :deep(.q-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

@media (max-width: 600px) {
  .creator-card {
    width: 95vw !important;
    margin: 0 auto;
  }
  
  .suggestion-card .q-card-section {
    padding: 8px !important;
  }
  
  .row.q-col-gutter-sm .col-6 {
    padding: 4px !important;
  }
}

.creator-card,
.suggestion-card,
.bg-info-card,
:deep(.q-field),
:deep(.q-btn) {
  transition: all 0.3s ease;
}
</style>
