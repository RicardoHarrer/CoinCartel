<template>
  <q-page class="q-pa-lg bg-page">
    <div class="goals-view">
      <!-- Header Section -->
      <div class="header-section q-mb-xl">
        <div class="row items-center justify-between q-mb-lg">
          <div class="col">
            <h1 class="text-h3 text-weight-bold text-dark q-mb-xs">🎯 Sparziele</h1>
            <p class="text-subtitle1 text-grey-7">
              Verwalte und verfolge deine finanziellen Ziele
            </p>
          </div>
          <div class="col-auto">
            <q-btn
              label="Neues Ziel"
              icon="add"
              color="primary"
              class="create-button"
              @click="showCreateDialog = true"
            />
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-sm-4">
            <q-card class="stat-card bg-primary text-white">
              <q-card-section class="text-center">
                <div class="text-h2 text-weight-bold">{{ stats.active }}</div>
                <div class="text-subtitle1">Aktive Ziele</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="stat-card bg-positive text-white">
              <q-card-section class="text-center">
                <div class="text-h2 text-weight-bold">{{ stats.completed }}</div>
                <div class="text-subtitle1">Erreicht</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="stat-card bg-negative text-white">
              <q-card-section class="text-center">
                <div class="text-h2 text-weight-bold">{{ stats.overdue }}</div>
                <div class="text-subtitle1">Überfällig</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Tabs -->
        <q-tabs
          v-model="activeTab"
          class="filter-tabs text-primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab
            name="active"
            icon="schedule"
            :label="`Aktiv (${stats.active + stats.overdue})`"
            class="text-weight-medium"
          />
          <q-tab
            name="completed"
            icon="check_circle"
            :label="`Erreicht (${stats.completed})`"
            class="text-weight-medium"
          />
          <q-tab
            name="overdue"
            icon="warning"
            :label="`Überfällig (${stats.overdue})`"
            class="text-weight-medium"
          />
        </q-tabs>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <div v-if="loading" class="loading-section text-center q-py-xl">
          <q-spinner size="50px" color="primary" />
          <div class="text-h6 text-grey-7 q-mt-md">Lade Ziele...</div>
        </div>

        <div v-else-if="filteredGoals.length > 0" class="goals-grid">
          <div class="row q-col-gutter-lg">
            <div
              v-for="goal in filteredGoals"
              :key="goal.id"
              class="col-12 col-md-6 col-lg-4"
            >
              <GoalCard
                :goal="goal"
                @click="openGoalDetails(goal)"
                @edit="editGoal(goal)"
                @delete="confirmDeleteGoal(goal)"
              />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <q-card v-else class="empty-state text-center">
          <q-card-section class="q-pa-xl">
            <q-icon name="savings" size="80px" color="grey-4" class="q-mb-lg" />
            <div class="text-h5 text-weight-medium text-grey-7 q-mb-md">
              {{ emptyStateMessage }}
            </div>
            <p class="text-grey-6 q-mb-xl">
              {{ emptyStateDescription }}
            </p>
            <q-btn
              v-if="activeTab === 'active'"
              label="Erstes Ziel erstellen"
              color="primary"
              icon="add"
              class="empty-state-button"
              @click="showCreateDialog = true"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- FAB for mobile -->
      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn
          fab
          icon="add"
          color="primary"
          class="fab-button"
          @click="showCreateDialog = true"
        />
      </q-page-sticky>

      <!-- Dialogs -->
      <q-dialog v-model="showCreateDialog" persistent>
        <GoalCreator
          :userId="userId"
          :editGoal="editingGoal"
          @saved="handleGoalSaved"
          @cancel="closeDialogs"
        />
      </q-dialog>

      <q-dialog v-model="showDetailsDialog">
        <GoalDetails
          :goal="selectedGoal"
          @close="showDetailsDialog = false"
          @updated="fetchGoals"
        />
      </q-dialog>

      <!-- Delete Confirmation -->
      <q-dialog v-model="showDeleteDialog">
        <q-card class="delete-dialog bg-surface">
          <q-card-section class="text-center q-pa-xl">
            <q-icon name="warning" size="60px" color="warning" class="q-mb-md" />
            <div class="text-h6 text-weight-bold text-dark q-mb-sm">Ziel löschen</div>
            <p class="text-grey-7">
              Bist du sicher, dass du das Ziel<br />
              <strong>"{{ deletingGoal?.title }}"</strong> löschen möchtest?
            </p>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-xl">
            <q-btn flat label="Abbrechen" color="grey-6" v-close-popup class="q-mr-sm" />
            <q-btn
              flat
              label="Löschen"
              color="negative"
              @click="deleteGoal"
              class="delete-confirm-button"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import GoalCard from "../components/GoalCard.vue";
import GoalCreator from "../components/GoalCreator.vue";
import GoalDetails from "../components/GoalDetails.vue";

export default defineComponent({
  name: "GoalsView",
  components: { GoalCard, GoalCreator, GoalDetails },
  setup() {
    const $q = useQuasar();

    const goals = ref([]);
    const loading = ref(true);
    const activeTab = ref("active");
    const showCreateDialog = ref(false);
    const showDetailsDialog = ref(false);
    const showDeleteDialog = ref(false);
    const selectedGoal = ref(null);
    const editingGoal = ref(null);
    const deletingGoal = ref(null);

    const userId = ref(1);

    const stats = computed(() => {
      const active = goals.value.filter((g) => g.status === "in_progress").length;
      const completed = goals.value.filter((g) => g.status === "completed").length;
      const overdue = goals.value.filter((g) => g.status === "overdue").length;
      return { active, completed, overdue };
    });

    const filteredGoals = computed(() => {
      switch (activeTab.value) {
        case "active":
          return goals.value.filter((g) => g.status !== "completed");
        case "completed":
          return goals.value.filter((g) => g.status === "completed");
        case "overdue":
          return goals.value.filter((g) => g.status === "overdue");
        default:
          return goals.value;
      }
    });

    const emptyStateMessage = computed(() => {
      switch (activeTab.value) {
        case "active":
          return "Noch keine Ziele";
        case "completed":
          return "Keine erreichten Ziele";
        case "overdue":
          return "Keine überfälligen Ziele";
        default:
          return "Keine Ziele gefunden";
      }
    });

    const emptyStateDescription = computed(() => {
      switch (activeTab.value) {
        case "active":
          return "Beginne deine Sparreise, indem du dein erstes Ziel erstellst.";
        case "completed":
          return "Du hast noch keine Ziele erfolgreich abgeschlossen.";
        case "overdue":
          return "Glückwunsch! Alle Ziele sind aktuell im Zeitplan.";
        default:
          return "Keine Ziele in dieser Kategorie vorhanden.";
      }
    });

    const fetchGoals = async () => {
      try {
        loading.value = true;
        const response = await fetch(`http://localhost:3000/api/goals/progress/1`);
        const text = await response.text();

        if (response.headers.get("content-type")?.includes("application/json")) {
          goals.value = JSON.parse(text);
        } else {
          console.error("Server returned HTML instead of JSON:", text);
          $q.notify({
            type: "negative",
            message: "Server-Fehler: Falsches Format",
            position: "top",
          });
        }
      } catch (error) {
        console.error("Error fetching goals:", error);
        $q.notify({
          type: "negative",
          message: "Fehler beim Laden der Ziele",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const openGoalDetails = (goal) => {
      selectedGoal.value = goal;
      showDetailsDialog.value = true;
    };

    const editGoal = (goal) => {
      editingGoal.value = goal;
      showCreateDialog.value = true;
    };

    const confirmDeleteGoal = (goal) => {
      deletingGoal.value = goal;
      showDeleteDialog.value = true;
    };

    const deleteGoal = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/goals/${deletingGoal.value.id}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          $q.notify({
            type: "positive",
            message: "Ziel erfolgreich gelöscht",
            position: "top",
          });
          fetchGoals();
        }
      } catch (error) {
        $q.notify({
          type: "negative",
          message: "Fehler beim Löschen des Ziels",
          position: "top",
        });
      } finally {
        showDeleteDialog.value = false;
        deletingGoal.value = null;
      }
    };

    const handleGoalSaved = () => {
      closeDialogs();
      fetchGoals();
      $q.notify({
        type: "positive",
        message: editingGoal.value ? "Ziel aktualisiert" : "Ziel erstellt",
        position: "top",
      });
    };

    const closeDialogs = () => {
      showCreateDialog.value = false;
      editingGoal.value = null;
    };

    onMounted(fetchGoals);

    return {
      goals,
      loading,
      activeTab,
      showCreateDialog,
      showDetailsDialog,
      showDeleteDialog,
      selectedGoal,
      editingGoal,
      deletingGoal,
      userId,
      stats,
      filteredGoals,
      emptyStateMessage,
      emptyStateDescription,
      openGoalDetails,
      editGoal,
      confirmDeleteGoal,
      deleteGoal,
      handleGoalSaved,
      closeDialogs,
      fetchGoals,
    };
  },
});
</script>

<style scoped>
.goals-view {
  max-width: 1400px;
  margin: 0 auto;
}

.bg-page {
  background: #f8f9fa;
}

.header-section {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 24px;
}

.stat-card {
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.filter-tabs {
  background: white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.create-button {
  border-radius: 10px;
  font-weight: 600;
  padding: 8px 20px;
}

.fab-button {
  box-shadow: 0 4px 20px rgba(25, 118, 210, 0.3);
}

.empty-state {
  border-radius: 20px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
}

.empty-state-button {
  border-radius: 10px;
  font-weight: 600;
  padding: 12px 24px;
}

.delete-dialog {
  border-radius: 20px;
  width: 400px;
  max-width: 90vw;
}

.delete-confirm-button {
  border-radius: 8px;
  font-weight: 600;
}

.loading-section {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.goals-grid {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 599px) {
  .header-section .row.items-center {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-section .col-auto {
    width: 100%;
  }

  .create-button {
    width: 100%;
  }
}
</style>
