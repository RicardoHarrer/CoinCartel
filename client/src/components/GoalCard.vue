<template>
  <q-card
    class="goal-card cursor-pointer"
    :class="statusClass"
    @click="$emit('click', goal)"
  >
    <q-card-section>
      <!-- Header mit Titel und Menu -->
      <div class="row items-start no-wrap">
        <div class="col">
          <div class="text-h6 text-weight-bold">{{ goal.title }}</div>
        </div>
        <div class="col-auto">
          <q-btn flat round icon="more_vert" size="sm" @click.stop="$emit('menu', goal)">
            <q-menu auto-close>
              <q-list style="min-width: 100px">
                <q-item clickable @click="$emit('edit', goal)">
                  <q-item-section avatar>
                    <q-icon name="edit" size="xs" />
                  </q-item-section>
                  <q-item-section>Bearbeiten</q-item-section>
                </q-item>
                <q-item clickable @click="$emit('delete', goal)">
                  <q-item-section avatar>
                    <q-icon name="delete" size="xs" />
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
        <q-badge :color="statusColor" :icon="statusIcon">
          {{ statusText }}
        </q-badge>
        <q-badge v-if="goal.category_name" outline color="primary">
          {{ goal.category_name }}
        </q-badge>
      </div>

      <!-- Fortschrittsbalken -->
      <div class="q-mb-md">
        <div class="row justify-between items-center q-mb-xs">
          <div class="text-caption text-grey">Fortschritt</div>
          <div class="text-caption text-weight-bold">
            {{ Math.round(goal.progress_percentage) }}%
          </div>
        </div>
        <q-linear-progress
          :value="goal.progress_percentage / 100"
          :color="progressColor"
          size="10px"
          rounded
        />
      </div>

      <!-- Beträge -->
      <div class="row justify-between q-mb-xs">
        <div class="text-caption">Gespart:</div>
        <div class="text-caption text-weight-bold">€{{ goal.current_amount }}</div>
      </div>
      <div class="row justify-between q-mb-md">
        <div class="text-caption">Ziel:</div>
        <div class="text-caption text-weight-bold">€{{ goal.target_amount }}</div>
      </div>

      <!-- Datum -->
      <div class="row items-center">
        <q-icon name="event" size="xs" color="grey" class="q-mr-xs" />
        <div class="text-caption text-grey">Bis {{ formatDate(goal.target_date) }}</div>
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

    return {
      statusColor,
      statusIcon,
      statusText,
      progressColor,
      statusClass,
      formatDate,
    };
  },
});
</script>

<style scoped>
.goal-card {
  transition: all 0.3s ease;
  height: 100%;
}

.goal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.goal-card-overdue {
  border-left: 4px solid #f44336;
}
</style>
