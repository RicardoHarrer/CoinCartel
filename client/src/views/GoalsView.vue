<template>
  <q-page class="q-pa-md">
    <div class="goals-view">
      <!-- Header with statistics -->
      <div class="row q-mb-lg">
        <div class="col-12">
          <h2 class="text-h4 text-primary q-mb-md">🎯 My Savings Goals</h2>

          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-sm-4">
              <q-card class="bg-primary text-white text-center">
                <q-card-section>
                  <div class="text-h4">{{ stats.active }}</div>
                  <div>Active Goals</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card class="bg-positive text-white text-center">
                <q-card-section>
                  <div class="text-h4">{{ stats.completed }}</div>
                  <div>Completed</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card class="bg-negative text-white text-center">
                <q-card-section>
                  <div class="text-h4">{{ stats.overdue }}</div>
                  <div>Overdue</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Tabs -->
          <q-tabs v-model="activeTab" class="text-primary">
            <q-tab
              name="active"
              icon="schedule"
              :label="`Active (${stats.active + stats.overdue})`"
            />
            <q-tab
              name="completed"
              icon="check_circle"
              :label="`Completed (${stats.completed})`"
            />
            <q-tab name="overdue" icon="warning" :label="`Overdue (${stats.overdue})`" />
          </q-tabs>
        </div>
      </div>

      <!-- Goals Grid -->
      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner size="50px" color="primary" />
        <div class="q-mt-md">Loading goals...</div>
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
          label="Create your first goal"
          color="primary"
          icon="add"
          @click="showCreateDialog = true"
        />
      </q-card>

      <!-- FAB for new goals -->
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
            <div class="text-h6">Delete Goal</div>
          </q-card-section>

          <q-card-section>
            Are you sure you want to delete the goal "{{ deletingGoal?.title }}"?
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn flat label="Delete" color="negative" @click="deleteGoal" />
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
          return "No goals yet";
        case "completed":
          return "No completed goals";
        case "overdue":
          return "No overdue goals";
        default:
          return "No goals found";
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
          $q.notify({ type: "negative", message: "Server error: wrong format" });
        }
      } catch (error) {
        console.error("Error fetching goals:", error);
        $q.notify({ type: "negative", message: "Error loading goals" });
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
          $q.notify({ type: "positive", message: "Goal deleted successfully" });
          fetchGoals();
        }
      } catch (error) {
        $q.notify({ type: "negative", message: "Error deleting goal" });
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
        message: editingGoal.value ? "Goal updated" : "Goal created",
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
