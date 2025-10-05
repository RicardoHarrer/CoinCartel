<template>
  <q-card style="width: 600px; max-width: 90vw">
    <q-card-section>
      <div class="text-h6">
        {{ editGoal ? "Ziel bearbeiten" : "Neues Sparziel" }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-form @submit="submitGoal" class="q-gutter-md">
        <!-- Schnellauswahl -->
        <div v-if="!editGoal" class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Schnellauswahl</div>
          <div class="row q-col-gutter-sm">
            <div
              v-for="(suggestion, index) in goalSuggestions"
              :key="index"
              class="col-6"
            >
              <q-card
                class="cursor-pointer suggestion-card"
                @click="applySuggestion(suggestion)"
              >
                <q-card-section class="text-center q-pa-sm">
                  <q-icon name="savings" size="md" color="primary" class="q-mb-xs" />
                  <div class="text-caption text-weight-bold">{{ suggestion.title }}</div>
                  <div class="text-h6 text-primary">€{{ suggestion.target_amount }}</div>
                  <q-badge :label="suggestion.category" />
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
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="formData.current_amount"
              label="Aktueller Betrag (€)"
              type="number"
              filled
            />
          </div>
        </div>

        <q-input
          v-model="formData.target_date"
          label="Ziel-Datum"
          type="date"
          :rules="[(val) => !!val || 'Datum ist erforderlich']"
          filled
        />

        <q-select
          v-model="formData.category_id"
          :options="categoryOptions"
          label="Kategorie"
          emit-value
          map-options
          filled
        />

        <q-input
          v-model="formData.description"
          label="Beschreibung"
          type="textarea"
          rows="3"
          filled
        />

        <!-- Spar-Informationen -->
        <q-card
          v-if="formData.target_amount && formData.target_date"
          flat
          class="bg-grey-2"
        >
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">Sparplan</div>
            <div class="row justify-between items-center">
              <div>Monatliche Sparrate:</div>
              <div class="text-h6 text-primary">€{{ monthlySaving }}</div>
            </div>

            <div v-if="currentProgress > 0" class="q-mt-md">
              <div class="row justify-between items-center q-mb-xs">
                <div>Fortschritt:</div>
                <div>{{ currentProgress.toFixed(2) }}%</div>
              </div>
              <q-linear-progress
                :value="currentProgress / 100"
                color="primary"
                size="10px"
                rounded
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Buttons -->
        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn label="Abbrechen" color="grey" v-close-popup @click="$emit('cancel')" />
          <q-btn
            :label="editGoal ? 'Aktualisieren' : 'Erstellen'"
            type="submit"
            color="primary"
            :loading="loading"
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
    const categories = ref([]);

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
        title: "Notgroschen aufbauen",
        target_amount: 3000,
        category: "Sparen",
        description: "3 Nettogehälter als Sicherheit",
      },
      {
        title: "Urlaubsgeld sparen",
        target_amount: 1500,
        category: "Sparen",
        description: "Für den nächsten Sommerurlaub",
      },
      {
        title: "Neues Smartphone",
        target_amount: 800,
        category: "Sonstiges",
        description: "Aktuelles Modell ersetzen",
      },
    ];

    const categoryOptions = computed(() => {
      return [
        { label: "Sparen", value: 11 },
        { label: "Investition", value: 15 },
        { label: "Sonstiges", value: 15 },
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
      // Finde die Kategorie ID aus den festen Optionen
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

    // Formular mit editGoal-Daten füllen
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
          // Formular zurücksetzen
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
      categories,
      categoryOptions,
      monthlySaving,
      currentProgress,
      applySuggestion,
      submitGoal,
    };
  },
});
</script>

<style scoped>
.suggestion-card {
  transition: all 0.2s ease;
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
