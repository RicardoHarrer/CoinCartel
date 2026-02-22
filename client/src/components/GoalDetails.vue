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
          <div class="row items-start justify-between q-mb-md">
            <div class="col">
              <div class="text-subtitle2 text-weight-bold text-dark">
                Betrag aktualisieren
              </div>
              <div class="text-caption text-grey-7">
                Passe den aktuellen Stand direkt an oder nutze Schnellaktionen.
              </div>
            </div>
            <div class="col-auto">
              <q-badge color="primary" class="text-caption text-weight-medium q-px-sm q-py-xs">
                Live: €{{ formatNumber(goal.current_amount) }}
              </q-badge>
            </div>
          </div>

          <div class="adjustment-controls">
            <q-btn-group spread unelevated class="quick-step-buttons q-mb-sm">
              <q-btn
                color="grey-3"
                text-color="dark"
                label="-100"
                :disable="savingCurrentAmount"
                @click="nudgeCurrentAmount(-100)"
              />
              <q-btn
                color="grey-3"
                text-color="dark"
                label="-50"
                :disable="savingCurrentAmount"
                @click="nudgeCurrentAmount(-50)"
              />
              <q-btn
                color="grey-3"
                text-color="dark"
                label="+50"
                :disable="savingCurrentAmount"
                @click="nudgeCurrentAmount(50)"
              />
              <q-btn
                color="grey-3"
                text-color="dark"
                label="+100"
                :disable="savingCurrentAmount"
                @click="nudgeCurrentAmount(100)"
              />
            </q-btn-group>

            <q-input
              v-model.number="currentAmount"
              type="number"
              dense
              outlined
              min="0"
              step="0.01"
              class="amount-input-full"
              :dark="$q.dark.isActive"
              :disable="savingCurrentAmount"
              @keyup.enter="saveCurrentAmount"
            >
              <template v-slot:prepend>
                <span class="text-caption text-grey-7">€</span>
              </template>
              <template v-slot:append>
                <q-icon
                  :name="isCurrentAmountValid ? 'check_circle' : 'error'"
                  :color="isCurrentAmountValid ? 'positive' : 'negative'"
                  size="18px"
                />
              </template>
            </q-input>

            <div class="row items-center justify-between q-mt-sm">
              <div
                class="text-caption text-weight-medium"
                :class="amountDelta >= 0 ? 'text-positive' : 'text-negative'"
              >
                {{ amountDelta >= 0 ? "+" : "-" }}€{{ formatNumber(Math.abs(amountDelta)) }} Änderung
              </div>
              <q-btn
                flat
                dense
                icon="restart_alt"
                label="Zurücksetzen"
                color="grey-7"
                :disable="savingCurrentAmount || !hasAmountChanged"
                @click="resetCurrentAmount"
              />
            </div>
          </div>

          <div class="row justify-end q-mt-md">
            <q-btn
              color="primary"
              icon="save"
              label="Betrag speichern"
              class="save-amount-button"
              :loading="savingCurrentAmount"
              :disable="savingCurrentAmount || !isCurrentAmountValid || !hasAmountChanged"
              @click="saveCurrentAmount"
            />
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

      <q-card v-if="nextMilestone" flat class="bg-milestone text-dark">
        <q-card-section class="text-center q-py-sm">
          <div class="text-caption">Nächster Meilenstein: {{ nextMilestone.percent }}%</div>
          <div class="text-subtitle2 text-weight-bold text-primary">
            Noch €{{ formatNumber(nextMilestone.missingAmount) }}
          </div>
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

    const currentAmount = ref(Number(props.goal.current_amount) || 0);
    const savingCurrentAmount = ref(false);

    const progress = computed(() => {
      const targetAmount = Number(props.goal.target_amount) || 0;
      if (targetAmount <= 0) return 0;
      return (Number(props.goal.current_amount || 0) / targetAmount) * 100;
    });

    const progressColor = computed(() => {
      return props.goal.status === "completed" ? "positive" : "primary";
    });

    const remainingAmount = computed(() => {
      const targetAmount = Number(props.goal.target_amount) || 0;
      const currentSaved = Number(props.goal.current_amount) || 0;
      return Math.max(0, Number((targetAmount - currentSaved).toFixed(2)));
    });

    const daysRemaining = computed(() => {
      const targetDateValue = props.goal.target_date ? new Date(props.goal.target_date) : null;
      if (!targetDateValue || Number.isNaN(targetDateValue.getTime())) return 0;

      const today = new Date();
      const diffTime = targetDateValue - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });

    const dailySaving = computed(() => {
      const remaining = remainingAmount.value;
      return daysRemaining.value > 0 ? (remaining / daysRemaining.value).toFixed(2) : "0.00";
    });

    const normalizedCurrentAmount = computed(() => {
      const parsed = Number(currentAmount.value);
      if (!Number.isFinite(parsed)) return null;
      return Math.max(0, Number(parsed.toFixed(2)));
    });

    const isCurrentAmountValid = computed(() => normalizedCurrentAmount.value !== null);

    const hasAmountChanged = computed(() => {
      if (normalizedCurrentAmount.value === null) return false;
      const currentSaved = Number(props.goal.current_amount || 0);
      return Math.abs(normalizedCurrentAmount.value - currentSaved) >= 0.01;
    });

    const amountDelta = computed(() => {
      if (normalizedCurrentAmount.value === null) return 0;
      const currentSaved = Number(props.goal.current_amount || 0);
      return Number((normalizedCurrentAmount.value - currentSaved).toFixed(2));
    });

    const nextMilestone = computed(() => {
      const milestones = [25, 50, 75, 100];
      const nextPercent = milestones.find((milestone) => progress.value < milestone);
      if (!nextPercent) return null;

      const targetAmount = Number(props.goal.target_amount || 0);
      const currentSaved = Number(props.goal.current_amount || 0);
      const milestoneAmount = targetAmount * (nextPercent / 100);
      const missingAmount = Math.max(0, milestoneAmount - currentSaved);

      return {
        percent: nextPercent,
        missingAmount: Number(missingAmount.toFixed(2)),
      };
    });

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("de-DE");
    };

    const formatNumber = (number) => {
      return new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(number) || 0);
    };

    const resetCurrentAmount = () => {
      currentAmount.value = Number(props.goal.current_amount) || 0;
    };

    const nudgeCurrentAmount = (delta) => {
      const baseValue =
        normalizedCurrentAmount.value !== null
          ? normalizedCurrentAmount.value
          : Number(props.goal.current_amount || 0);
      const nextValue = Math.max(0, baseValue + delta);
      currentAmount.value = Number(nextValue.toFixed(2));
    };

    const saveCurrentAmount = async () => {
      if (!isCurrentAmountValid.value) {
        $q.notify({
          type: "warning",
          message: "Bitte gib einen gültigen Betrag ein",
          position: "top",
        });
        return;
      }

      if (!hasAmountChanged.value) {
        return;
      }

      savingCurrentAmount.value = true;
      try {
        const response = await fetch(`http://localhost:3000/api/goals/${props.goal.id}/amount`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentAmount: normalizedCurrentAmount.value,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Fehler beim Aktualisieren");
        }

        $q.notify({
          type: "positive",
          message: "Betrag erfolgreich aktualisiert",
          position: "top",
        });
        emit("updated");
      } catch (error) {
        $q.notify({
          type: "negative",
          message: error.message || "Fehler beim Aktualisieren",
          position: "top",
        });
      } finally {
        savingCurrentAmount.value = false;
      }
    };

    watch(
      () => props.goal,
      (newGoal) => {
        currentAmount.value = Number(newGoal.current_amount) || 0;
      }
    );

    return {
      currentAmount,
      savingCurrentAmount,
      progress,
      progressColor,
      remainingAmount,
      daysRemaining,
      dailySaving,
      isCurrentAmountValid,
      hasAmountChanged,
      amountDelta,
      nextMilestone,
      formatDate,
      formatNumber,
      resetCurrentAmount,
      nudgeCurrentAmount,
      saveCurrentAmount,
    };
  },
});
</script>

<style scoped>
.details-card {
  width: 480px;
  max-width: 90vw;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
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

.bg-milestone {
  background: linear-gradient(135deg, #eaf4ff, #d9ebff) !important;
  border: 1px solid rgba(25, 118, 210, 0.14) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.adjustment-controls {
  border: 1px dashed rgba(25, 118, 210, 0.25);
  border-radius: 12px;
  padding: 10px;
}

.quick-step-buttons {
  border-radius: 10px;
  overflow: hidden;
}

.amount-input-full {
  width: 100%;
}

.save-amount-button {
  border-radius: 10px;
  font-weight: 600;
  text-transform: none;
}

.close-button {
  border-radius: 8px;
  font-weight: 600;
}

:deep(.amount-input-full .q-field__control) {
  border-radius: 8px;
}

:deep(.quick-step-buttons .q-btn) {
  font-weight: 600;
}

:deep(.q-circular-progress__text) {
  font-weight: 600;
}

body.body--dark .details-card {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
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
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

body.body--dark .bg-milestone {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.2), rgba(21, 101, 192, 0.25)) !important;
  border-color: rgba(66, 165, 245, 0.35) !important;
}

body.body--dark .adjustment-controls {
  border-color: rgba(66, 165, 245, 0.3);
}

body.body--dark :deep(.quick-step-buttons .q-btn) {
  background: rgba(255, 255, 255, 0.08) !important;
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

  .amount-input-full {
    width: 100% !important;
  }
}

.details-card,
.bg-edit-card,
.bg-detail-card,
.bg-milestone,
:deep(.q-field),
:deep(.q-btn) {
  transition: all 0.3s ease;
}
</style>
