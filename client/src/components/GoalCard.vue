<template>
  <q-card
    class="goal-card cursor-pointer bg-card"
    :class="statusClass"
    @click="$emit('click', goal)"
  >
    <q-card-section class="q-pa-md">
      <!-- Header mit Titel und Menu -->
      <div class="row items-center no-wrap q-mb-sm">
        <div class="col">
          <div class="text-h6 text-weight-bold text-primary">{{ goal.title }}</div>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            round
            icon="more_vert"
            size="sm"
            color="grey-6"
            @click.stop="$emit('menu', goal)"
          >
            <q-menu auto-close class="bg-surface">
              <q-list class="text-dark">
                <q-item clickable class="text-dark" @click="$emit('edit', goal)">
                  <q-item-section avatar>
                    <q-icon name="edit" size="xs" color="primary" />
                  </q-item-section>
                  <q-item-section>Bearbeiten</q-item-section>
                </q-item>
                <q-item clickable class="text-dark" @click="$emit('delete', goal)">
                  <q-item-section avatar>
                    <q-icon name="delete" size="xs" color="negative" />
                  </q-item-section>
                  <q-item-section>Löschen</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Status und Kategorie -->
      <div class="row q-gutter-xs q-mb-md">
        <q-badge
          :color="statusColor"
          :icon="statusIcon"
          class="text-caption text-weight-medium"
        >
          {{ statusText }}
        </q-badge>
        <q-badge v-if="goal.category_name" outline color="accent" class="text-caption">
          {{ goal.category_name }}
        </q-badge>
      </div>

      <!-- Fortschrittsbalken -->
      <div class="q-mb-md">
        <div class="row justify-between items-center q-mb-xs">
          <div class="text-caption text-grey-6">Fortschritt</div>
          <div class="text-caption text-weight-bold text-primary">
            {{ progressPercentage.toFixed(1) }}%
          </div>
        </div>
        <q-linear-progress
          :value="goal.progress_percentage / 100"
          :color="progressColor"
          size="8px"
          rounded
          class="q-mb-xs"
        />
        <div class="row justify-between">
          <div class="text-caption text-grey-6">
            €{{ formatNumber(goal.current_amount) }}
          </div>
          <div class="text-caption text-grey-6">
            €{{ formatNumber(goal.target_amount) }}
          </div>
        </div>
      </div>

      <!-- Datum -->
      <div class="row items-center justify-between">
        <div class="row items-center">
          <q-icon name="event" size="xs" color="grey-6" class="q-mr-xs" />
          <div class="text-caption text-grey-6">
            Bis {{ formatDate(goal.target_date) }}
          </div>
        </div>
        <q-icon
          name="trending_up"
          size="sm"
          :color="progressPercentage >= 50 ? 'positive' : 'primary'"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "GoalCard",
  props: {
    goal: {
      type: Object,
      required: true,
    },
  },
  emits: ["click", "edit", "delete", "menu"],
  setup(props) {
    const statusColor = computed(() => {
      switch (props.goal.status) {
        case "completed":
          return "positive";
        case "overdue":
          return "negative";
        default:
          return "primary";
      }
    });

    const progressPercentage = computed(() => {
      return (props.goal.current_amount / props.goal.target_amount) * 100;
    });

    const statusIcon = computed(() => {
      switch (props.goal.status) {
        case "completed":
          return "check_circle";
        case "overdue":
          return "warning";
        default:
          return "schedule";
      }
    });

    const statusText = computed(() => {
      switch (props.goal.status) {
        case "completed":
          return "Erreicht";
        case "overdue":
          return "Überfällig";
        default:
          return "In Bearbeitung";
      }
    });

    const progressColor = computed(() => {
      return props.goal.status === "completed" ? "positive" : "primary";
    });

    const statusClass = computed(() => {
      return props.goal.status === "overdue" ? "goal-card-overdue" : "";
    });

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("de-DE");
    };

    const formatNumber = (number) => {
      return new Intl.NumberFormat("de-DE").format(number);
    };

    return {
      statusColor,
      statusIcon,
      statusText,
      progressColor,
      statusClass,
      formatDate,
      progressPercentage,
      formatNumber,
    };
  },
});
</script>

<style scoped>
.goal-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.goal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.goal-card-overdue {
  border-left: 4px solid #f44336;
}

:deep(.q-linear-progress__track) {
  border-radius: 4px;
}

:deep(.q-linear-progress__model) {
  border-radius: 4px;
}
</style>
