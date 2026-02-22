<template>
  <q-card
    class="goal-card cursor-pointer bg-card"
    :class="statusClass"
    @click="$emit('click', goal)"
  >
    <q-card-section class="q-pa-md">
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
            <q-menu auto-close class="goal-card-menu">
              <q-list class="goal-menu-list">
                <q-item clickable @click="$emit('edit', goal)" class="goal-edit-item">
                  <q-item-section avatar>
                    <q-icon name="edit" size="xs" />
                  </q-item-section>
                  <q-item-section>Bearbeiten</q-item-section>
                </q-item>
                <q-item clickable @click="$emit('delete', goal)" class="goal-delete-item">
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

      <div class="q-mb-md">
        <q-btn
          unelevated
          icon="add_card"
          color="primary"
          label="Transaktionen hinzufügen"
          class="full-width goal-transaction-button"
          @click.stop="$emit('add-transaction', goal)"
        />
      </div>

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
  emits: ["click", "edit", "delete", "menu", "add-transaction"],
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
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.goal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
}

.goal-card-overdue {
  border-left: 4px solid #f44336;
}

:deep(.goal-card .text-h6) {
  color: #111827 !important;
}

:deep(.goal-card .text-grey-6) {
  color: #6b7280 !important;
}

body.body--dark .goal-card {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark :deep(.goal-card .text-h6) {
  color: #ffffff !important;
}

body.body--dark :deep(.goal-card .text-grey-6) {
  color: #b0b0b0 !important;
}

:deep(.q-linear-progress__track) {
  border-radius: 4px;
}

:deep(.q-linear-progress__model) {
  border-radius: 4px;
}

:deep(.goal-transaction-button) {
  border-radius: 10px;
  font-weight: 600;
  text-transform: none;
}
</style>

<style lang="scss">
.goal-card-menu {
  border-radius: 8px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #dee2e6 !important;
  background: white !important;
}

.goal-menu-list .q-item {
  color: #1a1a1a !important;
  border-radius: 6px !important;
  margin: 2px 4px !important;
  transition: all 0.2s ease !important;
}

.goal-menu-list .q-item:hover {
  background: rgba(25, 118, 210, 0.1) !important;
  transform: translateX(2px) !important;
}

.goal-edit-item .q-icon {
  color: #1976d2 !important;
}

.goal-delete-item .q-icon {
  color: #c62828 !important;
}

body.body--dark .goal-card-menu {
  background: #1e1e1e !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
}

body.body--dark .goal-menu-list .q-item {
  color: #ffffff !important;
}

body.body--dark .goal-menu-list .q-item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .goal-edit-item .q-icon {
  color: #42a5f5 !important;
}

body.body--dark .goal-delete-item .q-icon {
  color: #ef5350 !important;
}
</style>
