<script>
import { ref, computed, onMounted, watchEffect } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { auth } from "@/utils/auth";

export default {
  name: "NavBar",
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const tab = ref("home");
    const mobileMenuOpen = ref(false);

    const isLoggedIn = ref(auth.isAuthenticated());

    watchEffect(() => {
      isLoggedIn.value = auth.isAuthenticated();
    });

    onMounted(() => {
      const handleStorageChange = () => {
        isLoggedIn.value = auth.isAuthenticated();
      };
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    });

    const isDarkMode = computed(() => $q.dark.isActive);

    const toggleDarkMode = () => {
      $q.dark.toggle();
    };

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value;
    };

    const logout = async () => {
      auth.removeToken();
      isLoggedIn.value = false;
      await router.push("/");
      window.location.reload();
    };

    return {
      tab,
      mobileMenuOpen,
      isLoggedIn,
      isDarkMode,
      toggleDarkMode,
      toggleMobileMenu,
      logout,
    };
  },
};
</script>

<template>
  <q-header
    elevated
    :class="['navbar', $q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark']"
  >
    <q-toolbar>
      <q-toolbar-title class="text-h5">
        <q-btn flat to="/">
          <q-img
            src="../../public/logovaultly.jpg"
            alt="Vaultly Logo"
            width="50px"
            height="50px"
            class="logo-image"
        /></q-btn>
      </q-toolbar-title>

      <q-tabs v-model="tab" shrink stretch class="gt-sm">
        <q-route-tab name="home" label="Home" to="/" exact />
        <q-route-tab name="chart" label="Chart" to="/chart" exact v-if="isLoggedIn" />
        <q-route-tab
          name="transaction"
          label="Transaction"
          to="/transactions"
          exact
          v-if="isLoggedIn"
        />
        <q-route-tab name="goals" label="Sparziele" to="/goals" exact v-if="isLoggedIn" />
        <q-route-tab name="login" label="Login" to="/login" exact v-if="!isLoggedIn" />
        <q-route-tab
          name="register"
          label="Register"
          to="/register"
          exact
          v-if="!isLoggedIn"
        />
        <q-route-tab
          name="settings"
          label="Settings"
          to="/settings"
          exact
          v-if="isLoggedIn"
        />
        <q-route-tab
          name="bank-import"
          label="Bank Import"
          to="/bank-import"
          exact
          v-if="isLoggedIn"
        />
        <q-btn v-if="isLoggedIn" flat label="Logout" @click="logout" class="q-ml-md" />
      </q-tabs>

      <q-btn
        flat
        round
        :icon="isDarkMode ? 'light_mode' : 'dark_mode'"
        @click="toggleDarkMode"
        class="q-ml-md"
      />

      <q-btn flat round icon="menu" class="lt-md" @click="toggleMobileMenu" />
    </q-toolbar>

    <q-drawer v-model="mobileMenuOpen" side="right" overlay bordered>
      <q-list>
        <q-item clickable v-ripple to="/" exact>
          <q-item-section>Home</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/chart" exact v-if="isLoggedIn">
          <q-item-section>Chart</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/transactions" exact v-if="isLoggedIn">
          <q-item-section>Transaction</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/goals" exact v-if="isLoggedIn">
          <q-item-section>Savinggoals</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/login" exact v-if="!isLoggedIn">
          <q-item-section>Login</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/register" exact v-if="!isLoggedIn">
          <q-item-section>Register</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/settings" exact v-if="isLoggedIn">
          <q-item-section>Settings</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/bank-import" exact v-if="isLoggedIn">
          <q-item-section>Bank Import</q-item-section>
        </q-item>
        <q-item v-if="isLoggedIn" clickable v-ripple @click="logout">
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
  </q-header>
</template>

<style scoped>
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;
  padding: 7px;
}

.q-toolbar-title {
  font-weight: bold;
}

.q-tabs {
  margin-left: auto;
}

.q-drawer {
  background-color: var(--q-primary);
}

.q-item {
  color: inherit;
}

.q-item--active {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
