<template>
  <q-card style="width: 500px; max-width: 90vw">
    <q-card-section>
      <div class="text-h6 text-center">{{ goal.title }}</div>
      <div v-if="goal.description" class="text-caption text-grey text-center q-mt-xs">
        {{ goal.description }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <!-- Fortschritts-Kreis -->
      <div class="row justify-center q-mb-lg">
        <div class="relative-position" style="width: 120px; height: 120px">
          <q-circular-progress
            show-value
            :value="progress"
            size="120px"
            :thickness="0.2"
            :color="progressColor"
            track-color="grey-3"
            class="q-mb-md"
          >
            <div class="text-center">
              <div class="text-h6 text-weight-bold">{{ Math.round(progress) }}%</div>
              <div class="text-caption text-grey">erreicht</div>
            </div>
          </q-circular-progress>
        </div>
      </div>

      <!-- Beträge -->
      <div class="row justify-between q-mb-md">
        <div>
          <div class="text-caption text-grey">Gespart</div>
          <div class="text-h6 text-primary">€{{ goal.current_amount }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption text-grey">Ziel</div>
          <div class="text-h6">€{{ goal.target_amount }}</div>
        </div>
      </div>

      <!-- Aktuellen Betrag bearbeiten -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <div class="text-caption">Aktuellen Betrag anpassen:</div>
        </div>
        <div class="col-auto">
          <q-input
            v-model="currentAmount"
            type="number"
            dense
            style="width: 100px"
            @update:model-value="updateCurrentAmount"
          />
        </div>
      </div>

      <!-- Details Grid -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6">
          <q-card flat class="bg-grey-1">
            <q-card-section class="q-pa-sm text-center">
              <q-icon name="event" size="sm" color="grey" class="q-mb-xs" />
              <div class="text-caption text-weight-bold">Ziel-Datum</div>
              <div class="text-caption">{{ formatDate(goal.target_date) }}</div>
              <div class="text-caption text-grey">{{ daysRemaining }} Tage</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card flat class="bg-grey-1">
            <q-card-section class="q-pa-sm text-center">
              <q-icon name="savings" size="sm" color="grey" class="q-mb-xs" />
              <div class="text-caption text-weight-bold">Täglich sparen</div>
              <div class="text-caption">€{{ dailySaving }}</div>
              <div class="text-caption text-grey">für Ziel</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Kategorie -->
      <div v-if="goal.category_name" class="row items-center q-mb-md">
        <q-icon name="category" size="sm" color="grey" class="q-mr-sm" />
        <div class="text-caption text-grey">Kategorie:</div>
        <q-badge :label="goal.category_name" color="primary" class="q-ml-sm" />
      </div>

      <!-- Verbleibender Betrag -->
      <q-card flat class="bg-primary text-white">
        <q-card-section class="text-center">
          <div class="text-caption">Noch zu sparen</div>
          <div class="text-h5">€{{ remainingAmount }}</div>
        </q-card-section>
      </q-card>

      <!-- Motivations-Nachricht -->
      <q-card v-if="progress < 100" flat class="bg-positive text-white q-mt-md">
        <q-card-section class="text-center">
          <div class="text-caption">{{ motivationMessage }}</div>
        </q-card-section>
      </q-card>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Schließen" color="primary" v-close-popup />
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

    const updateCurrentAmount = async () => {
      try {
        const response = await fetch(`/api/goals/${props.goal.id}/amount`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentAmount: parseFloat(currentAmount.value),
          }),
        });

        if (response.ok) {
          $q.notify({
            type: "positive",
            message: "Betrag erfolgreich aktualisiert",
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
      updateCurrentAmount,
    };
  },
});
</script>
