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
  <q-header elevated class="navbar">
    <q-toolbar class="navbar__toolbar">
      <!-- Logo Section -->
      <div class="navbar__brand">
        <q-btn flat to="/" class="navbar__logo-btn" padding="none">
          <q-img
            src="../../public/logovaultly.jpg"
            alt="Vaultly Logo"
            width="45px"
            height="45px"
            class="navbar__logo"
          />
        </q-btn>
        <q-toolbar-title class="navbar__title text-h5">
          Vaultly
        </q-toolbar-title>
      </div>

      <!-- Desktop Navigation -->
      <q-tabs 
        v-model="tab" 
        shrink 
        stretch 
        class="gt-sm navbar__tabs"
        indicator-color="primary"
        active-color="primary"
      >
        <q-route-tab 
          name="home" 
          label="Home" 
          to="/" 
          exact 
          class="navbar__tab"
        />
        <q-route-tab 
          name="chart" 
          label="Analytics" 
          to="/chart" 
          exact 
          v-if="isLoggedIn"
          class="navbar__tab"
        />
        <q-route-tab 
          name="goals" 
          label="Goals" 
          to="/goals" 
          exact 
          v-if="isLoggedIn"
          class="navbar__tab"
        />
        <q-route-tab 
          name="bank-import" 
          label="Bank Import" 
          to="/bank-import" 
          exact 
          v-if="isLoggedIn"
          class="navbar__tab"
        />
        <q-route-tab 
          name="settings" 
          label="Settings" 
          to="/settings" 
          exact 
          v-if="isLoggedIn"
          class="navbar__tab"
        />
        
        <!-- Auth Buttons -->
        <div class="navbar__auth" v-if="!isLoggedIn">
          <q-route-tab 
            name="login" 
            label="Login" 
            to="/login" 
            exact 
            class="navbar__tab navbar__tab--auth"
          />
          <q-btn 
            name="register" 
            label="Get Started" 
            to="/register" 
            unelevated 
            color="primary"
            class="navbar__register-btn"
          />
        </div>

        <q-btn 
          v-if="isLoggedIn" 
          flat 
          label="Logout" 
          @click="logout" 
          class="navbar__logout-btn"
          icon="logout"
        />
      </q-tabs>
    </q-toolbar>
    

    <!-- Mobile Drawer -->
    <q-drawer 
      v-model="mobileMenuOpen" 
      side="right" 
      overlay 
      bordered
      class="navbar__drawer"
    >
      <q-list class="navbar__mobile-list">
        <q-item 
          clickable 
          v-ripple 
          to="/" 
          exact
          class="navbar__mobile-item"
          @click="mobileMenuOpen = false"
        >
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Home</q-item-section>
        </q-item>
        
        <template v-if="isLoggedIn">
          <q-item 
            clickable 
            v-ripple 
            to="/chart" 
            exact
            class="navbar__mobile-item"
            @click="mobileMenuOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="analytics" />
            </q-item-section>
            <q-item-section>Analytics</q-item-section>
          </q-item>
          <q-item 
            clickable 
            v-ripple 
            to="/goals" 
            exact
            class="navbar__mobile-item"
            @click="mobileMenuOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="savings" />
            </q-item-section>
            <q-item-section>Goals</q-item-section>
          </q-item>
          <q-item 
            clickable 
            v-ripple 
            to="/bank-import" 
            exact
            class="navbar__mobile-item"
            @click="mobileMenuOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="account_balance" />
            </q-item-section>
            <q-item-section>Bank Import</q-item-section>
          </q-item>
          <q-item 
            clickable 
            v-ripple 
            to="/settings" 
            exact
            class="navbar__mobile-item"
            @click="mobileMenuOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>Settings</q-item-section>
          </q-item>
        </template>

        <template v-else>
          <q-item 
            clickable 
            v-ripple 
            to="/login" 
            exact
            class="navbar__mobile-item"
            @click="mobileMenuOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="login" />
            </q-item-section>
            <q-item-section>Login</q-item-section>
          </q-item>
          <q-item 
            clickable 
            v-ripple 
            to="/register" 
            exact
            class="navbar__mobile-item navbar__mobile-item--highlight"
            @click="mobileMenuOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="person_add" />
            </q-item-section>
            <q-item-section>Get Started</q-item-section>
          </q-item>
        </template>

        <q-item 
          v-if="isLoggedIn" 
          clickable 
          v-ripple 
          @click="logout"
          class="navbar__mobile-item navbar__mobile-item--logout"
        >
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
  </q-header>
</template>

<style lang="scss" scoped>
.navbar {
  background: var(--q-primary);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--q-secondary);
  
  &::before {
    display: none; // Remove any potential glow effect
  }

  &__toolbar {
    padding: 8px 16px;
    min-height: 70px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__logo-btn {
    border-radius: 12px;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  &__logo {
    border-radius: 10px;
    object-fit: contain;
  }

  &__title {
    font-weight: 700;
    background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__tabs {
    margin-left: auto;
    gap: 8px;
  }

  &__tab {
    border-radius: 8px;
    margin: 0 4px;
    transition: all 0.3s ease;
    font-weight: 500;
    min-height: 40px;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    &--active {
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &--auth {
      margin-right: 12px;
    }
  }

  &__auth {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 24px;
  }

  &__register-btn {
    border-radius: 8px;
    font-weight: 600;
    text-transform: none;
    padding: 8px 20px;
    box-shadow: 0 2px 8px rgba(var(--q-primary-rgb), 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--q-primary-rgb), 0.4);
    }
  }

  &__logout-btn {
    border-radius: 8px;
    margin-left: 16px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 16px;
  }

  &__theme-toggle {
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(15deg);
    }
  }

  &__mobile-toggle {
    margin-left: 8px;
  }

  // Mobile Drawer Styles
  &__drawer {
    .q-drawer__content {
      background: var(--q-dark);
    }
  }

  &__mobile-list {
    padding: 16px 0;
  }

  &__mobile-item {
    margin: 4px 12px;
    border-radius: 8px;
    transition: all 0.3s ease;
    font-weight: 500;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);
    }

    &--highlight {
      background: var(--q-primary);
      color: white;
      font-weight: 600;

      &:hover {
        background: var(--q-primary);
        opacity: 0.9;
      }
    }

    &--logout {
      color: var(--q-negative);
      
      &:hover {
        background: rgba(var(--q-negative-rgb), 0.1);
      }
    }
  }
}

// Dark mode adjustments
.body--dark {
  .navbar {
    background: rgba(33, 33, 33, 0.95);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}

.body--light {
  .navbar {
    background: rgba(255, 255, 255, 0.95);
    border-bottom-color: rgba(0, 0, 0, 0.1);
    
    &__tab {
      color: rgba(0, 0, 0, 0.7);

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }

    &__logout-btn {
      color: rgba(0, 0, 0, 0.7);
    }
  }
}

// Responsive adjustments
@media (max-width: $breakpoint-sm-max) {
  .navbar {
    &__toolbar {
      padding: 8px 12px;
      min-height: 64px;
    }

    &__title {
      font-size: 1.25rem;
    }
  }
}
</style>
