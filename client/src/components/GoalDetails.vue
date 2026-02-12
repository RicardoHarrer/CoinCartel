<template>
  <q-card class="details-card bg-surface">
    <q-card-section class="text-center q-pb-none">
      <div class="text-h5 text-weight-bold text-dark">{{ goal.title }}</div>
      <div v-if="goal.description" class="text-caption text-grey-7 q-mt-xs">
        {{ goal.description }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-md">
      <div class="row justify-center q-mb-lg">
        <div class="relative-position" style="width: 140px; height: 140px">
          <q-circular-progress
            show-value
            :value="progress"
            size="140px"
            :thickness="0.22"
            :color="progressColor"
            :track-color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
            class="q-mb-md"
          >
            <div class="text-center">
              <div class="text-h5 text-weight-bold text-primary">
                {{ progress.toFixed(1) }}%
              </div>
              <div class="text-caption text-grey-7">erreicht</div>
            </div>
          </q-circular-progress>
        </div>
      </div>

      <div class="row justify-between items-center q-mb-lg">
        <div class="text-center">
          <div class="text-caption text-grey-7">Gespart</div>
          <div class="text-h4 text-weight-bold text-primary">
            €{{ formatNumber(goal.current_amount) }}
          </div>
        </div>
        <q-icon name="arrow_forward" size="sm" :color="$q.dark.isActive ? 'grey-6' : 'grey-5'" />
        <div class="text-center">
          <div class="text-caption text-grey-7">Ziel</div>
          <div class="text-h4 text-weight-bold text-dark">
            €{{ formatNumber(goal.target_amount) }}
          </div>
        </div>
      </div>

      <q-card flat class="bg-edit-card q-mb-lg">
        <q-card-section class="q-pa-md">
          <div class="row items-center">
            <div class="col">
              <div class="text-caption text-weight-medium text-dark">
                Aktuellen Betrag anpassen
              </div>
            </div>
            <div class="col-auto">
              <q-input
                v-model="currentAmount"
                type="number"
                dense
                outlined
                style="width: 120px"
                @update:model-value="updateCurrentAmount"
                class="amount-input"
                :dark="$q.dark.isActive"
              >
                <template v-slot:prepend>
                  <span class="text-caption text-grey-7">€</span>
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-sm q-mb-lg">
        <div class="col-6">
          <q-card flat class="bg-detail-card">
            <q-card-section class="q-pa-md text-center">
              <q-icon name="event" size="sm" color="primary" class="q-mb-xs" />
              <div class="text-caption text-weight-medium text-dark">Ziel-Datum</div>
              <div class="text-caption text-grey-7">
                {{ formatDate(goal.target_date) }}
              </div>
              <div class="text-caption text-primary text-weight-medium">
                {{ daysRemaining }} Tage
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card flat class="bg-detail-card">
            <q-card-section class="q-pa-md text-center">
              <q-icon name="savings" size="sm" color="primary" class="q-mb-xs" />
              <div class="text-caption text-weight-medium text-dark">Täglich sparen</div>
              <div class="text-caption text-primary text-weight-medium">
                €{{ dailySaving }}
              </div>
              <div class="text-caption text-grey-7">für Ziel</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div v-if="goal.category_name" class="row items-center justify-center q-mb-lg">
        <q-icon name="category" size="sm" :color="$q.dark.isActive ? 'grey-5' : 'grey-6'" class="q-mr-sm" />
        <div class="text-caption text-grey-7">Kategorie:</div>
        <q-badge
          :label="goal.category_name"
          color="accent"
          class="q-ml-sm text-caption"
        />
      </div>

      <q-card flat class="bg-primary text-white q-mb-md">
        <q-card-section class="text-center q-py-sm">
          <div class="text-caption">Noch zu sparen</div>
          <div class="text-h5 text-weight-bold">€{{ formatNumber(remainingAmount) }}</div>
        </q-card-section>
      </q-card>

      <q-card v-if="progress < 100" flat class="bg-motivation text-dark">
        <q-card-section class="text-center q-py-sm">
          <div class="text-caption">{{ motivationMessage }}</div>
        </q-card-section>
      </q-card>
    </q-card-section>

    <q-card-actions align="center" class="q-pa-md">
      <q-btn flat label="Schließen" color="primary" v-close-popup class="close-button" />
    </q-card-actions>
  </q-card>
</template>

<script>
import { defineComponent, ref, computed, watch } from "vue";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "GoalDetails",
  props: {
    goal: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "updated"],
  setup(props, { emit }) {
    const $q = useQuasar();

    const currentAmount = ref(props.goal.current_amount);

    const progress = computed(() => {
      return (props.goal.current_amount / props.goal.target_amount) * 100;
    });

    const progressColor = computed(() => {
      return props.goal.status === "completed" ? "positive" : "primary";
    });

    const remainingAmount = computed(() => {
      return (props.goal.target_amount - props.goal.current_amount).toFixed(2);
    });

    const daysRemaining = computed(() => {
      const today = new Date();
      const targetDate = new Date(props.goal.target_date);
      const diffTime = targetDate - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });

    const dailySaving = computed(() => {
      const remaining = props.goal.target_amount - props.goal.current_amount;
      return daysRemaining.value > 0
        ? (remaining / daysRemaining.value).toFixed(2)
        : "0.00";
    });

    const motivationMessage = computed(() => {
      if (progress.value < 25) return "Du hast einen großartigen Start! Weiter so! 🚀";
      if (progress.value < 50) return "Du bist auf dem besten Weg! Bleib dran! 💪";
      if (progress.value < 75) return "Schon mehr als die Hälfte geschafft! 🤩";
      return "Fast geschafft! Das letzte Stück ist am schwersten! 🎯";
    });

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("de-DE");
    };

    const formatNumber = (number) => {
      return new Intl.NumberFormat("de-DE").format(number);
    };

    const updateCurrentAmount = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/goals/${props.goal.id}/amount`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              currentAmount: parseFloat(currentAmount.value),
            }),
          }
        );

        if (response.ok) {
          $q.notify({
            type: "positive",
            message: "Betrag erfolgreich aktualisiert",
            position: "top",
          });
          emit("updated");
        }
      } catch (error) {
        $q.notify({
          type: "negative",
          message: "Fehler beim Aktualisieren",
        });
      }
    };

    watch(
      () => props.goal,
      (newGoal) => {
        currentAmount.value = newGoal.current_amount;
      }
    );

    return {
      currentAmount,
      progress,
      progressColor,
      remainingAmount,
      daysRemaining,
      dailySaving,
      motivationMessage,
      formatDate,
      formatNumber,
      updateCurrentAmount,
    };
  },
});
</script>

<style scoped>
.details-card {
  width: 480px;
  max-width: 90vw;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.bg-edit-card {
  background: rgba(25, 118, 210, 0.04) !important;
  border: 1px solid rgba(25, 118, 210, 0.12) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.bg-detail-card {
  background: #f8f9fa !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.bg-motivation {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.close-button {
  border-radius: 8px;
  font-weight: 600;
}

:deep(.amount-input .q-field__control) {
  border-radius: 6px;
}

:deep(.q-circular-progress__text) {
  font-weight: 600;
}

body.body--dark .details-card {
  background: #1e1e1e !important;
}

body.body--dark .details-card .text-dark {
  color: #ffffff !important;
}

body.body--dark .details-card .text-grey-7 {
  color: #b0b0b0 !important;
}

body.body--dark .bg-edit-card {
  background: rgba(25, 118, 210, 0.1) !important;
  border-color: rgba(25, 118, 210, 0.3) !important;
}

body.body--dark .bg-detail-card {
  background: #2d2d2d !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .bg-motivation {
  background: linear-gradient(135deg, #1b5e20, #2e7d32) !important;
  color: #ffffff !important;
}

body.body--dark .bg-motivation.text-dark {
  color: #ffffff !important;
}

body.body--dark :deep(.q-field--outlined .q-field__control) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark :deep(.q-field--outlined .q-field__label) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-field--outlined .q-field__native) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-field--outlined .q-field__control:before) {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

body.body--dark :deep(.q-btn) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-btn--flat) {
  color: #42a5f5 !important;
}

body.body--dark :deep(.q-circular-progress) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-circular-progress__text) {
  color: #ffffff !important;
}

body.body--dark :deep(.q-badge) {
  background: rgba(66, 165, 245, 0.2) !important;
  color: #42a5f5 !important;
  border: 1px solid rgba(66, 165, 245, 0.3) !important;
}

body.body--dark :deep(.q-icon) {
  color: inherit !important;
}

body.body--dark :deep(.bg-primary) {
  background: linear-gradient(135deg, #1976d2, #1565c0) !important;
}

@media (max-width: 480px) {
  .details-card {
    width: 95vw !important;
    margin: 0 auto;
  }
  
  .bg-edit-card .row.items-center {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .bg-edit-card .col-auto {
    width: 100%;
  }
  
  .amount-input {
    width: 100% !important;
  }
}

.details-card,
.bg-edit-card,
.bg-detail-card,
.bg-motivation,
:deep(.q-field),
:deep(.q-btn) {
  transition: all 0.3s ease;
}
</style>
