<template>
  <q-page class="q-pa-lg bg-page responsive-page-padding">
    <div class="goals-view">
      <div class="dark-mode-toggle">
        <q-btn 
          round 
          :color="$q.dark.isActive ? 'grey-9' : 'yellow-9'" 
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'" 
          class="toggle-btn"
          @click="toggleDarkMode"
          size="lg"
        />
      </div>

      <div class="header-section q-mb-xl">
        <div class="row items-center justify-between q-mb-lg">
          <div class="col">
            <div class="header-content">
              <h1 class="text-h3 text-weight-bold text-dark q-mb-xs">Savings Goals</h1>
              <p class="text-subtitle1 text-grey-7">
                Manage and track your financial goals
              </p>
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              label="New Goal"
              icon="add"
              color="primary"
              class="create-button"
              @click="showCreateDialog = true"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-sm-4">
            <q-card class="stat-card active-stat">
              <q-card-section class="text-center q-pa-lg">
                <div class="stat-icon bg-primary">
                  <q-icon name="trending_up" color="white" />
                </div>
                <div class="text-h2 text-weight-bold text-primary">{{ stats.active }}</div>
                <div class="text-subtitle2 text-grey-7">Active Goals</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="stat-card completed-stat">
              <q-card-section class="text-center q-pa-lg">
                <div class="stat-icon bg-positive">
                  <q-icon name="check_circle" color="white" />
                </div>
                <div class="text-h2 text-weight-bold text-positive">{{ stats.completed }}</div>
                <div class="text-subtitle2 text-grey-7">Completed</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="stat-card overdue-stat">
              <q-card-section class="text-center q-pa-lg">
                <div class="stat-icon bg-negative">
                  <q-icon name="warning" color="white" />
                </div>
                <div class="text-h2 text-weight-bold text-negative">{{ stats.overdue }}</div>
                <div class="text-subtitle2 text-grey-7">Overdue</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-card class="filter-card">
          <q-tabs
            v-model="activeTab"
            class="filter-tabs text-primary"
            indicator-color="primary"
            align="justify"
          >
            <q-tab
              name="active"
              icon="schedule"
              :label="`Active (${stats.active + stats.overdue})`"
              class="text-weight-medium"
            />
            <q-tab
              name="completed"
              icon="check_circle"
              :label="`Completed (${stats.completed})`"
              class="text-weight-medium"
            />
            <q-tab
              name="overdue"
              icon="warning"
              :label="`Overdue (${stats.overdue})`"
              class="text-weight-medium"
            />
          </q-tabs>
        </q-card>
      </div>

      <div class="content-section">
        <div v-if="loading" class="loading-section text-center q-py-xl">
          <q-spinner size="50px" color="primary" class="loading-spinner" />
          <div class="text-h6 text-grey-7 q-mt-md">Loading goals...</div>
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
                @add-transaction="openGoalTransactionDialog"
              />
            </div>
          </div>
        </div>

        <q-card v-else class="empty-state text-center">
          <q-card-section class="q-pa-xl">
            <div class="empty-icon">
              <q-icon name="savings" />
            </div>
            <div class="text-h5 text-weight-medium text-grey-7 q-mb-md">
              {{ emptyStateMessage }}
            </div>
            <p class="text-grey-6 q-mb-xl">
              {{ emptyStateDescription }}
            </p>
            <q-btn
              v-if="activeTab === 'active'"
              label="Create first goal"
              color="primary"
              icon="add"
              class="empty-state-button"
              @click="showCreateDialog = true"
            />
          </q-card-section>
        </q-card>
      </div>

      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn
          fab
          icon="add"
          color="primary"
          class="fab-button"
          @click="showCreateDialog = true"
        />
      </q-page-sticky>

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

      <q-dialog v-model="showAddTransactionDialog" persistent>
        <q-card class="goal-transaction-dialog">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-weight-bold">Add transaction</div>
            <q-space />
            <q-btn icon="close" flat round dense @click="closeGoalTransactionDialog" />
          </q-card-section>

          <q-card-section class="q-pt-sm">
            <div class="text-subtitle2 q-mb-sm">
              Goal: <strong>{{ selectedGoalForTransaction?.title || "-" }}</strong>
            </div>

            <q-btn
              outline
              color="primary"
              icon="playlist_add"
              label="Add existing transaction"
              class="full-width q-mb-md existing-transaction-toggle"
              :disable="savingGoalTransaction"
              @click="openExistingTransactionPicker"
            />

            <div v-if="showExistingTransactionPicker" class="existing-transaction-box q-mb-md">
              <q-select
                v-model="selectedExistingTransactionId"
                :options="filteredExistingTransactionOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                filled
                label="Select saved transaction"
                hint="Search by date, amount, description or ID"
                use-input
                fill-input
                hide-selected
                clearable
                input-debounce="0"
                :loading="loadingExistingTransactions"
                :disable="savingGoalTransaction || loadingExistingTransactions"
                no-error-icon
                @filter="filterExistingTransactions"
              />

              <div class="row justify-end q-mt-sm">
                <q-btn
                  color="primary"
                  icon="add_task"
                  label="Use selected transaction"
                  :disable="savingGoalTransaction || loadingExistingTransactions"
                  :loading="savingGoalTransaction"
                  @click="addExistingTransactionToGoal"
                />
              </div>
            </div>

            <div class="text-caption text-grey-6 q-mb-sm">Or create a new transaction</div>

            <q-form class="q-gutter-md" @submit.prevent="addGoalTransaction">
              <q-input
                v-model.number="goalTransactionForm.amount"
                type="number"
                min="0.01"
                step="0.01"
                filled
                label="Amount"
                :disable="savingGoalTransaction"
              >
                <template v-slot:prepend>€</template>
              </q-input>

              <q-input
                v-model="goalTransactionForm.date"
                type="date"
                filled
                label="Date"
                :disable="savingGoalTransaction"
              />

              <q-input
                v-model="goalTransactionForm.currency"
                filled
                label="Currency"
                maxlength="5"
                :disable="savingGoalTransaction"
              />

              <q-input
                v-model="goalTransactionForm.description"
                filled
                label="Description (optional)"
                :disable="savingGoalTransaction"
              />

              <div class="row justify-end q-gutter-sm">
                <q-btn
                  flat
                  label="Cancel"
                  color="grey-7"
                  :disable="savingGoalTransaction"
                  @click="closeGoalTransactionDialog"
                />
                <q-btn
                  color="primary"
                  label="Save transaction"
                  icon="save"
                  type="submit"
                  :loading="savingGoalTransaction"
                  :disable="savingGoalTransaction"
                  class="goal-transaction-submit"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showDeleteDialog">
        <q-card class="delete-dialog">
          <q-card-section class="text-center q-pa-xl">
            <div class="warning-icon">
              <q-icon name="warning" />
            </div>
            <div class="text-h6 text-weight-bold text-dark q-mb-sm">Delete goal</div>
            <p class="text-grey-7">
              Are you sure you want to delete the goal<br />
              <strong>"{{ deletingGoal?.title }}"</strong>?
            </p>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-xl">
            <q-btn 
              flat 
              label="Cancel" 
              color="grey-6" 
              v-close-popup 
              class="cancel-button"
            />
            <q-btn
              label="Delete"
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
import { jwtDecode } from "jwt-decode";
import { auth } from "@/utils/auth";
import GoalCard from "../components/GoalCard.vue";
import GoalCreator from "../components/GoalCreator.vue";
import GoalDetails from "../components/GoalDetails.vue";
import { toEnglishCategoryName } from "@/utils/displayText";

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
    const showAddTransactionDialog = ref(false);
    const selectedGoal = ref(null);
    const editingGoal = ref(null);
    const deletingGoal = ref(null);
    const selectedGoalForTransaction = ref(null);
    const savingGoalTransaction = ref(false);
    const showExistingTransactionPicker = ref(false);
    const loadingExistingTransactions = ref(false);
    const selectedExistingTransactionId = ref(null);
    const existingTransactions = ref([]);
    const existingTransactionsLoaded = ref(false);
    const allExistingTransactionOptions = ref([]);
    const filteredExistingTransactionOptions = ref([]);
    const goalTransactionForm = ref({
      amount: null,
      date: new Date().toISOString().split("T")[0],
      currency: "EUR",
      description: "",
    });

    const userId = ref(null);

    const resolveUserIdFromToken = () => {
      const token = auth.getToken();
      if (!token) return null;

      try {
        const decoded = jwtDecode(token);
        return decoded?.id ?? null;
      } catch (error) {
        console.error("Invalid token while resolving user id:", error);
        return null;
      }
    };

    const normalizeGoal = (goal) => ({
      ...goal,
      category_name: toEnglishCategoryName(goal.category_name),
      target_amount: Number(goal.target_amount) || 0,
      current_amount: Number(goal.current_amount) || 0,
      progress_percentage: Number(goal.progress_percentage) || 0,
      target_date: goal.target_date ? String(goal.target_date).split("T")[0] : null,
      status: goal.status || "in_progress",
    });

    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);
    };

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

    const emptyStateDescription = computed(() => {
      switch (activeTab.value) {
        case "active":
          return "Start by creating your first goal.";
        case "completed":
          return "You have not completed any goals yet.";
        case "overdue":
          return "Great. All goals are currently on track.";
        default:
          return "No goals in this category.";
      }
    });

    const normalizeSearchText = (value) =>
      String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const formatTransactionAmount = (amount, currency) => {
      const normalizedAmount = Math.abs(Number(amount) || 0);
      const normalizedCurrency = String(currency || "EUR").trim().toUpperCase() || "EUR";
      try {
        return normalizedAmount.toLocaleString("en-US", {
          style: "currency",
          currency: normalizedCurrency,
        });
      } catch (error) {
        return `${normalizedAmount.toLocaleString("en-US")} ${normalizedCurrency}`;
      }
    };

    const mapTransactionToOption = (transaction) => {
      const transactionId = String(transaction.id ?? "").trim();
      const transactionDate = transaction.date
        ? new Date(transaction.date).toLocaleDateString("en-US")
        : "-";
      const transactionDescription = String(transaction.description || "No description").trim();
      const amountLabel = formatTransactionAmount(transaction.amount, transaction.currency);
      const label = `${transactionDate} • ${amountLabel} • ${transactionDescription}`;

      return {
        label,
        value: transactionId,
        searchText: normalizeSearchText(
          `${label} ${transactionId} ${transactionDescription} ${transaction.currency || ""} ${transaction.date || ""}`
        ),
      };
    };

    const fetchGoals = async () => {
      if (!userId.value) {
        goals.value = [];
        loading.value = false;
        return;
      }

      try {
        loading.value = true;
        const response = await fetch(`http://localhost:3000/api/goals/progress/${userId.value}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch goals: ${response.status}`);
        }

        const payload = await response.json();
        goals.value = Array.isArray(payload) ? payload.map(normalizeGoal) : [];
      } catch (error) {
        console.error("Error fetching goals:", error);
        $q.notify({
          type: "negative",
          message: "Error loading goals",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const resetGoalTransactionForm = (goal = null) => {
      goalTransactionForm.value = {
        amount: null,
        date: new Date().toISOString().split("T")[0],
        currency: "EUR",
        description: goal?.title ? `Goal contribution: ${goal.title}` : "",
      };
      selectedExistingTransactionId.value = null;
      showExistingTransactionPicker.value = false;
      filteredExistingTransactionOptions.value = allExistingTransactionOptions.value.slice(0, 200);
    };

    const openGoalDetails = (goal) => {
      selectedGoal.value = goal;
      showDetailsDialog.value = true;
    };

    const openGoalTransactionDialog = (goal) => {
      if (!goal?.id) return;
      selectedGoalForTransaction.value = goal;
      resetGoalTransactionForm(goal);
      showAddTransactionDialog.value = true;
    };

    const closeGoalTransactionDialog = () => {
      showAddTransactionDialog.value = false;
      selectedGoalForTransaction.value = null;
      resetGoalTransactionForm();
    };

    const fetchExistingTransactions = async () => {
      if (!userId.value) return;
      loadingExistingTransactions.value = true;
      try {
        const response = await fetch(`http://localhost:3000/transactions/users/${userId.value}`);
        if (!response.ok) {
          throw new Error(`Error while loading: ${response.status}`);
        }
        const payload = await response.json();
        existingTransactions.value = Array.isArray(payload)
          ? payload
              .map((transaction) => ({
                ...transaction,
                amount: Number(transaction.amount) || 0,
              }))
              .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          : [];
        allExistingTransactionOptions.value = existingTransactions.value.map(mapTransactionToOption);
        filteredExistingTransactionOptions.value = allExistingTransactionOptions.value.slice(0, 200);
        existingTransactionsLoaded.value = true;
      } catch (error) {
        console.error("Error fetching existing transactions:", error);
        $q.notify({
          type: "negative",
          message: "Could not load saved transactions",
          position: "top",
        });
      } finally {
        loadingExistingTransactions.value = false;
      }
    };

    const openExistingTransactionPicker = async () => {
      showExistingTransactionPicker.value = true;
      if (!existingTransactionsLoaded.value) {
        await fetchExistingTransactions();
      } else if (filteredExistingTransactionOptions.value.length === 0) {
        filteredExistingTransactionOptions.value = allExistingTransactionOptions.value.slice(0, 200);
      }
    };

    const filterExistingTransactions = (inputValue, update) => {
      update(() => {
        const needle = normalizeSearchText(inputValue);
        if (!needle) {
          filteredExistingTransactionOptions.value = allExistingTransactionOptions.value.slice(0, 200);
          return;
        }

        filteredExistingTransactionOptions.value = allExistingTransactionOptions.value
          .filter((option) => option.searchText.includes(needle))
          .slice(0, 200);
      });
    };

    const addExistingTransactionToGoal = async () => {
      if (!userId.value) {
        $q.notify({
          type: "negative",
          message: "Please log in again",
          position: "top",
        });
        return;
      }

      if (!selectedGoalForTransaction.value?.id) {
        $q.notify({
          type: "negative",
          message: "No savings goal selected",
          position: "top",
        });
        return;
      }

      const selectedTransactionId = String(selectedExistingTransactionId.value || "").trim();
      const selectedTransaction = existingTransactions.value.find(
        (transaction) => String(transaction.id ?? "").trim() === selectedTransactionId
      );
      if (!selectedTransaction) {
        $q.notify({
          type: "warning",
          message: "Please select a saved transaction first",
          position: "top",
        });
        return;
      }

      const transactionAmount = Math.abs(Number(selectedTransaction.amount));
      if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) {
        $q.notify({
          type: "warning",
          message: "The selected transaction has an invalid amount",
          position: "top",
        });
        return;
      }

      savingGoalTransaction.value = true;
      try {
        const nextCurrentAmount =
          Number(selectedGoalForTransaction.value.current_amount || 0) + transactionAmount;
        const updateGoalResponse = await fetch(
          `http://localhost:3000/api/goals/${selectedGoalForTransaction.value.id}/amount`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentAmount: nextCurrentAmount }),
          }
        );

        if (!updateGoalResponse.ok) {
          const errorText = await updateGoalResponse.text();
          throw new Error(errorText || "Could not update savings goal");
        }

        await fetchGoals();

        if (selectedGoal.value?.id) {
          const refreshedSelectedGoal = goals.value.find((item) => item.id === selectedGoal.value.id);
          if (refreshedSelectedGoal) {
            selectedGoal.value = refreshedSelectedGoal;
          }
        }

        $q.notify({
          type: "positive",
          message: "Existing transaction added to savings goal",
          position: "top",
        });

        closeGoalTransactionDialog();
      } catch (error) {
        console.error("Error adding existing transaction to goal:", error);
        $q.notify({
          type: "negative",
          message: error.message || "Error while adding existing transaction",
          position: "top",
        });
      } finally {
        savingGoalTransaction.value = false;
      }
    };

    const addGoalTransaction = async () => {
      if (!userId.value) {
        $q.notify({
          type: "negative",
          message: "Please log in again",
          position: "top",
        });
        return;
      }

      if (!selectedGoalForTransaction.value?.id) {
        $q.notify({
          type: "negative",
          message: "No savings goal selected",
          position: "top",
        });
        return;
      }

      const categoryId = Number(selectedGoalForTransaction.value.category_id);
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        $q.notify({
          type: "negative",
          message: "This savings goal has no valid category",
          position: "top",
        });
        return;
      }

      const amount = Number(goalTransactionForm.value.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        $q.notify({
          type: "warning",
          message: "Please enter a valid amount",
          position: "top",
        });
        return;
      }

      savingGoalTransaction.value = true;
      try {
        const transactionPayload = {
          userId: userId.value,
          categoryId,
          amount: Math.abs(amount),
          transactionType: "Ausgabe",
          currency: String(goalTransactionForm.value.currency || "EUR").trim().toUpperCase() || "EUR",
          date: `${goalTransactionForm.value.date || new Date().toISOString().split("T")[0]}T00:00:00`,
          description:
            String(goalTransactionForm.value.description || "").trim()
            || `Goal contribution: ${selectedGoalForTransaction.value.title}`,
        };

        const transactionResponse = await fetch("http://localhost:3000/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transactionPayload),
        });

        if (!transactionResponse.ok) {
          const errorText = await transactionResponse.text();
          throw new Error(errorText || "Could not save transaction");
        }

        const nextCurrentAmount =
          Number(selectedGoalForTransaction.value.current_amount || 0) + Math.abs(amount);

        const updateGoalResponse = await fetch(
          `http://localhost:3000/api/goals/${selectedGoalForTransaction.value.id}/amount`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentAmount: nextCurrentAmount }),
          }
        );

        if (!updateGoalResponse.ok) {
          const errorText = await updateGoalResponse.text();
          throw new Error(errorText || "Could not update savings goal");
        }

        await fetchGoals();

        if (selectedGoal.value?.id) {
          const refreshedSelectedGoal = goals.value.find((item) => item.id === selectedGoal.value.id);
          if (refreshedSelectedGoal) {
            selectedGoal.value = refreshedSelectedGoal;
          }
        }

        $q.notify({
          type: "positive",
          message: "Transaction saved and savings goal updated",
          position: "top",
        });

        closeGoalTransactionDialog();
      } catch (error) {
        console.error("Error adding goal transaction:", error);
        $q.notify({
          type: "negative",
          message: error.message || "Error while adding transaction",
          position: "top",
        });
      } finally {
        savingGoalTransaction.value = false;
      }
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
            message: "Goal deleted successfully",
            position: "top",
          });
          fetchGoals();
        }
      } catch (error) {
        $q.notify({
          type: "negative",
          message: "Error while deleting goal",
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
        message: editingGoal.value ? "Goal updated" : "Goal created",
        position: "top",
      });
    };

    const closeDialogs = () => {
      showCreateDialog.value = false;
      editingGoal.value = null;
    };

    onMounted(() => {
      userId.value = resolveUserIdFromToken();

      if (!userId.value) {
        $q.notify({
          type: "negative",
          message: "Session invalid. Please log in again.",
          position: "top",
        });
        loading.value = false;
        return;
      }

      fetchGoals();
    });

    return {
      goals,
      loading,
      activeTab,
      showCreateDialog,
      showDetailsDialog,
      showDeleteDialog,
      showAddTransactionDialog,
      selectedGoal,
      editingGoal,
      deletingGoal,
      selectedGoalForTransaction,
      goalTransactionForm,
      savingGoalTransaction,
      showExistingTransactionPicker,
      loadingExistingTransactions,
      selectedExistingTransactionId,
      filteredExistingTransactionOptions,
      userId,
      stats,
      filteredGoals,
      emptyStateMessage,
      emptyStateDescription,
      openGoalDetails,
      editGoal,
      confirmDeleteGoal,
      deleteGoal,
      openGoalTransactionDialog,
      closeGoalTransactionDialog,
      openExistingTransactionPicker,
      filterExistingTransactions,
      addGoalTransaction,
      addExistingTransactionToGoal,
      handleGoalSaved,
      closeDialogs,
      fetchGoals,
      toggleDarkMode,
    };
  },
});
</script>

<style lang="scss">



.goals-view {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

.bg-page {
  background: #f8f9fa;
  min-height: 100vh;
  transition: all 0.3s ease;
}

.dark-mode-toggle {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
}

.toggle-btn {
  width: 60px;
  height: 60px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 2px solid #dee2e6 !important;
}

.toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  border-color: #adb5bd !important;
}

.toggle-btn:active {
  transform: scale(0.95);
}

.header-section {
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 24px;
  margin-bottom: 32px;
  transition: all 0.3s ease;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid #dee2e6 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: white;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  border-color: #adb5bd !important;
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 28px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.active-stat {
  border-left: 4px solid #1976d2 !important;
}

.completed-stat {
  border-left: 4px solid #2e7d32 !important;
}

.overdue-stat {
  border-left: 4px solid #c62828 !important;
}

.filter-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #dee2e6 !important;
  overflow: hidden;
  background: white;
}

.filter-tabs {
  background: transparent;
}

.filter-tabs :deep(.q-tab) {
  padding: 16px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  border-right: 1px solid #f1f3f4;
}

.filter-tabs :deep(.q-tab:last-child) {
  border-right: none;
}

.filter-tabs :deep(.q-tab--active) {
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976d2;
  border-bottom-color: #1976d2;
}

.create-button {
  border-radius: 8px;
  font-weight: 600;
  padding: 12px 28px;
  text-transform: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  background: white;
  color: #1976d2;
}

.create-button:hover {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
  background: #1976d2;
  color: white;
  transform: translateY(-1px);
}

.fab-button {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.3);
}

.empty-state-button {
  border-radius: 8px;
  font-weight: 600;
  padding: 14px 32px;
  text-transform: none;
  background: white;
  color: #1976d2;
}

.empty-state-button:hover {
  background: #1976d2;
  color: white;
}

.cancel-button {
  border-radius: 6px;
  font-weight: 600;
  padding: 10px 24px;
  border: 2px solid #6c757d !important;
  color: #6c757d;
  background: white;
}

.cancel-button:hover {
  background: #6c757d;
  color: white;
}

.delete-confirm-button {
  border-radius: 6px;
  font-weight: 600;
  padding: 10px 24px;
  border: 2px solid #c62828 !important;
  background: white;
  color: #c62828;
}

.delete-confirm-button:hover {
  background: #c62828;
  color: white;
}

.empty-state {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid #dee2e6 !important;
  background: white;
}

.empty-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: #6c757d;
  font-size: 56px;
  border: 3px solid #dee2e6;
}

.delete-dialog {
  border-radius: 16px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid #dee2e6 !important;
  background: white;
}

.goal-transaction-dialog {
  border-radius: 16px;
  width: min(520px, 92vw);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid #dee2e6 !important;
  background: white;
}

.goal-transaction-submit {
  border-radius: 8px;
  text-transform: none;
  font-weight: 600;
}

.existing-transaction-toggle {
  text-transform: none;
  font-weight: 600;
  border-radius: 10px;
}

.existing-transaction-box {
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 12px;
  background: #f8fbff;
}

.warning-icon {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #ff9800;
  font-size: 40px;
  border: 3px solid #ff9800;
}

.loading-section {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 2px solid #dee2e6 !important;
  margin: 20px 0;
}

.loading-spinner {
  border: 2px solid #e9ecef;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
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

body.body--dark .bg-page {
  background: #121212 !important;
}

body.body--dark .header-section {
  border-bottom-color: rgba(255, 255, 255, 0.15) !important;
}

body.body--dark .header-section .text-dark {
  color: #ffffff !important;
}

body.body--dark .header-section .text-grey-7 {
  color: #b0b0b0 !important;
}

body.body--dark .stat-card {
  background: #1e1e1e !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .stat-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

body.body--dark .filter-card {
  background: #1e1e1e !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .filter-tabs :deep(.q-tab) {
  color: #ffffff !important;
  border-right-color: rgba(255, 255, 255, 0.1) !important;
}

body.body--dark .filter-tabs :deep(.q-tab--active) {
  background-color: rgba(66, 165, 245, 0.15) !important;
  color: #42a5f5 !important;
}

body.body--dark .create-button,
body.body--dark .empty-state-button,
body.body--dark .cancel-button,
body.body--dark .delete-confirm-button {
  border: none !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

body.body--dark .create-button:hover,
body.body--dark .empty-state-button:hover {
  background: #1976d2 !important;
}

body.body--dark .cancel-button:hover {
  background: #6c757d !important;
}

body.body--dark .delete-confirm-button:hover {
  background: #c62828 !important;
}

body.body--dark .fab-button {
  border: none !important;
  background: #1976d2 !important;
}

body.body--dark .empty-state {
  background: #1e1e1e !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .empty-state .text-grey-7 {
  color: #ffffff !important;
}

body.body--dark .empty-state .text-grey-6 {
  color: #b0b0b0 !important;
}

body.body--dark .empty-icon {
  background: linear-gradient(135deg, #334155, #475569) !important;
  color: #cbd5e1 !important;
  border-color: #475569 !important;
}

body.body--dark .loading-section {
  background: rgba(30, 30, 30, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}

body.body--dark .loading-section .text-grey-7 {
  color: #b0b0b0 !important;
}

body.body--dark .delete-dialog {
  background: #1e1e1e !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

body.body--dark .goal-transaction-dialog {
  background: #1e1e1e !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

body.body--dark .existing-transaction-box {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
}

body.body--dark .delete-dialog .text-dark {
  color: #ffffff !important;
}

body.body--dark .delete-dialog .text-grey-7 {
  color: #b0b0b0 !important;
}

body.body--dark .delete-dialog strong {
  color: #ffffff !important;
}

body.body--dark .warning-icon {
  background: linear-gradient(135deg, #451a03, #7c2d12) !important;
  color: #fdba74 !important;
  border-color: #7c2d12 !important;
}

body.body--dark :deep(.q-btn) {
  color: inherit !important;
}

body.body--dark :deep(.q-card) {
  background: #1e1e1e !important;
  color: #ffffff !important;
}

/* Unified design language with ChartView */
.goals-view .header-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.goals-view .header-section .header-content h1 {
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.goals-view .header-section .header-content p {
  color: #4b5563 !important;
}

.goals-view .stat-card,
.goals-view .filter-card,
.goals-view .empty-state,
.goals-view .delete-dialog,
.goals-view .loading-section {
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
}

.goals-view .filter-card {
  border-radius: 14px;
  overflow: hidden;
}

body.body--dark .goals-view .header-section {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(18, 18, 18, 0.8) 100%
  ) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

body.body--dark .goals-view .header-section .header-content h1 {
  background: linear-gradient(45deg, #8baafe, #a67fce) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}

body.body--dark .goals-view .header-section .header-content p {
  color: #ffffff !important;
}

body.body--dark .goals-view .stat-card,
body.body--dark .goals-view .filter-card,
body.body--dark .goals-view .empty-state,
body.body--dark .goals-view .delete-dialog,
body.body--dark .goals-view .loading-section {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

@media (max-width: 599px) {
  .responsive-page-padding {
    padding: 12px !important;
  }

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

  .dark-mode-toggle {
    bottom: 16px;
    left: 16px;
  }

  .toggle-btn {
    width: 56px;
    height: 56px;
  }

  .filter-tabs :deep(.q-tab) {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
}

.q-btn, .stat-card, .filter-card, .empty-state, .delete-dialog {
  transition: all 0.3s ease;
}
</style>
