<template>
  <q-page class="q-pa-md">
    <div class="goals-view">
      <!-- Header mit Statistiken -->
      <div class="row q-mb-lg">
        <div class="col-12">
          <h2 class="text-h4 text-primary q-mb-md">🎯 Meine Sparziele</h2>

          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-sm-4">
              <q-card class="bg-primary text-white text-center">
                <q-card-section>
                  <div class="text-h4">{{ stats.active }}</div>
                  <div>Aktive Ziele</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card class="bg-positive text-white text-center">
                <q-card-section>
                  <div class="text-h4">{{ stats.completed }}</div>
                  <div>Erreicht</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card class="bg-negative text-white text-center">
                <q-card-section>
                  <div class="text-h4">{{ stats.overdue }}</div>
                  <div>Überfällig</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Tabs -->
          <q-tabs v-model="activeTab" class="text-primary">
            <q-tab
              name="active"
              icon="schedule"
              :label="`Aktiv (${stats.active + stats.overdue})`"
            />
            <q-tab
              name="completed"
              icon="check_circle"
              :label="`Erreicht (${stats.completed})`"
            />
            <q-tab
              name="overdue"
              icon="warning"
              :label="`Überfällig (${stats.overdue})`"
            />
          </q-tabs>
        </div>
      </div>

      <!-- Goals Grid -->
      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner size="50px" color="primary" />
        <div class="q-mt-md">Lade Ziele...</div>
      </div>

      <div v-else class="row q-col-gutter-md">
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

      <!-- Empty State -->
      <q-card v-if="!loading && filteredGoals.length === 0" class="text-center q-pa-xl">
        <q-icon name="savings" size="64px" color="grey" class="q-mb-md" />
        <div class="text-h6 text-grey q-mb-md">
          {{ emptyStateMessage }}
        </div>
        <q-btn
          v-if="activeTab === 'active'"
          label="Erstes Ziel erstellen"
          color="primary"
          icon="add"
          @click="showCreateDialog = true"
        />
      </q-card>

      <!-- FAB für neue Goals -->
      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn fab icon="add" color="primary" @click="showCreateDialog = true" />
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
        <q-card>
          <q-card-section>
            <div class="text-h6">Ziel löschen</div>
          </q-card-section>

          <q-card-section>
            Sind Sie sicher, dass Sie das Ziel "{{ deletingGoal?.title }}" löschen
            möchten?
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Abbrechen" color="primary" v-close-popup />
            <q-btn flat label="Löschen" color="negative" @click="deleteGoal" />
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
  components: {
    GoalCard,
    GoalCreator,
    GoalDetails,
  },
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

    // Für Demo - ersetze mit deinem echten User ID
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
          return "Noch keine abgeschlossenen Ziele";
        case "overdue":
          return "Keine überfälligen Ziele";
        default:
          return "Keine Ziele gefunden";
      }
    });

    const fetchGoals = async () => {
      try {
        loading.value = true;
        const response = await fetch(`http://localhost:3000/api/goals/progress/1`);

        console.log("Response status:", response.status);
        console.log("Response content type:", response.headers.get("content-type"));

        const text = await response.text();
        console.log("Raw response:", text);

        // Prüfe ob es JSON ist
        if (response.headers.get("content-type")?.includes("application/json")) {
          const data = JSON.parse(text);
          goals.value = data;
        } else {
          console.error("Server returned HTML instead of JSON:", text);
          $q.notify({
            type: "negative",
            message: "Server-Fehler: Falsches Format",
          });
        }
      } catch (error) {
        console.error("Error fetching goals:", error);
        $q.notify({
          type: "negative",
          message: "Fehler beim Laden der Ziele",
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
        const response = await fetch(`/api/goals/${deletingGoal.value.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          $q.notify({
            type: "positive",
            message: "Ziel erfolgreich gelöscht",
          });
          fetchGoals();
        }
      } catch (error) {
        $q.notify({
          type: "negative",
          message: "Fehler beim Löschen des Ziels",
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
      });
    };

    const closeDialogs = () => {
      showCreateDialog.value = false;
      editingGoal.value = null;
    };

    onMounted(() => {
      fetchGoals();
    });

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
  max-width: 1200px;
  margin: 0 auto;
}
</style>
