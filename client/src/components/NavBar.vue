<script>
import { ref, onMounted, onBeforeUnmount, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { auth } from "@/utils/auth";

export default {
  name: "NavBar",
  setup() {
    const router = useRouter();
    const tab = ref("home");
    const mobileMenuOpen = ref(false);
    let storageHandler = null;

    const isLoggedIn = ref(auth.isAuthenticated());

    watchEffect(() => {
      isLoggedIn.value = auth.isAuthenticated();
    });

    onMounted(() => {
      storageHandler = () => {
        isLoggedIn.value = auth.isAuthenticated();
      };
      window.addEventListener("storage", storageHandler);
    });

    onBeforeUnmount(() => {
      if (storageHandler) {
        window.removeEventListener("storage", storageHandler);
      }
    });

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value;
    };

    const logout = async () => {
      auth.logout();
      isLoggedIn.value = false;
      await router.push("/");
      window.location.reload();
    };

    return {
      tab,
      mobileMenuOpen,
      isLoggedIn,
      toggleMobileMenu,
      logout,
    };
  },
};
</script>

<template>
  <q-header elevated class="navbar">
    <q-toolbar class="navbar__toolbar">
      <div class="navbar__brand">
        <q-btn flat to="/" class="navbar__logo-btn" padding="none">
          <q-img
            src="/logovaultly.jpg"
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
          name="settings" 
          label="Settings" 
          to="/settings" 
          exact 
          v-if="isLoggedIn"
          class="navbar__tab"
        />
        
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

      <q-btn
        flat
        round
        dense
        icon="menu"
        class="lt-md navbar__mobile-toggle"
        @click="toggleMobileMenu"
        aria-label="Open navigation menu"
      />
    </q-toolbar>
  </q-header>
  <q-drawer 
    v-model="mobileMenuOpen" 
    side="right" 
    overlay 
    bordered
    class="navbar__drawer"
  >
    <div class="navbar__drawer-header">
      <div class="navbar__drawer-brand">
        <q-img src="/logovaultly.jpg" alt="Vaultly Logo" class="navbar__drawer-logo" />
        <div class="navbar__drawer-title">Vaultly</div>
      </div>
      <q-btn
        flat
        round
        dense
        icon="close"
        class="navbar__drawer-close"
        @click="mobileMenuOpen = false"
      />
    </div>
    <q-separator class="navbar__drawer-separator" />

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
</template>

<style lang="scss" scoped>
.navbar {
  background: rgba(18, 18, 18, 0.96);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(71, 85, 105, 0.28);
  box-shadow: none;

  &__toolbar {
    padding: 10px 18px;
    min-height: 72px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__logo-btn {
    border-radius: 10px;
    width: 42px;
    height: 42px;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }

  &__logo {
    border-radius: 8px;
    object-fit: contain;
  }

  &__title {
    font-weight: 700;
    color: #f7fafc;
    letter-spacing: 0.2px;
    white-space: nowrap;
  }

  &__tabs {
    margin-left: auto;
    gap: 4px;
  }

  &__tab {
    border-radius: 8px;
    margin: 0 2px;
    transition: all 0.2s ease;
    font-weight: 500;
    min-height: 40px;
    padding: 0 10px;
    color: #e2e8f0;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    &--active {
      background: rgba(255, 255, 255, 0.14);
    }

    &--auth {
      margin-right: 12px;
    }
  }

  &__auth {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 18px;
  }

  &__register-btn {
    border-radius: 8px;
    font-weight: 600;
    text-transform: none;
    padding: 8px 16px;
    box-shadow: none;
    transition: all 0.2s ease;

    &:hover {
      filter: brightness(1.06);
    }
  }

  &__logout-btn {
    border-radius: 8px;
    margin-left: 10px;
    font-weight: 500;
    color: #f1f5f9;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &__mobile-toggle {
    margin-left: auto;
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
  }

  &__drawer {
    width: min(84vw, 320px);

    .q-drawer__content {
      background: #121212;
    }
  }

  &__drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 14px 14px 12px;
  }

  &__drawer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__drawer-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  &__drawer-title {
    font-size: 1rem;
    font-weight: 700;
    color: #e2e8f0;
    letter-spacing: 0.2px;
  }

  &__drawer-close {
    color: #cbd5e1;
    background: rgba(148, 163, 184, 0.12);
  }

  &__drawer-separator {
    background: rgba(148, 163, 184, 0.2);
    height: 1px;
    margin: 0 12px;
  }

  &__mobile-list {
    padding: 10px 0;
  }

  &__mobile-item {
    margin: 6px 10px;
    border-radius: 10px;
    transition: all 0.2s ease;
    font-weight: 600;
    color: #e2e8f0;

    :deep(.q-item__section--avatar) {
      min-width: 34px;
    }
  }

  &__mobile-item:hover {
    background: rgba(148, 163, 184, 0.14);
  }

  &__mobile-item--highlight {
    background: var(--q-primary);
    color: white;
    font-weight: 700;

    &:hover {
      background: var(--q-primary);
      opacity: 0.95;
    }
  }

  &__mobile-item--logout {
    color: var(--q-negative);

    &:hover {
      background: rgba(var(--q-negative-rgb), 0.12);
    }
  }
}

.body--light {
  .navbar {
    background: rgba(255, 255, 255, 0.96);
    border-bottom-color: rgba(0, 0, 0, 0.1);
    box-shadow: none;
    
    &__title {
      color: #0f172a;
    }

    &__tab {
      color: rgba(15, 23, 42, 0.78);

      &:hover {
        background: rgba(15, 23, 42, 0.07);
      }
    }

    &__logout-btn {
      color: rgba(15, 23, 42, 0.78);
    }

    &__mobile-toggle {
      color: rgba(15, 23, 42, 0.9);
      background: rgba(15, 23, 42, 0.06);
      border-color: rgba(15, 23, 42, 0.12);
    }

    &__drawer {
      .q-drawer__content {
        background: #ffffff;
      }
    }

    &__drawer-title {
      color: #0f172a;
    }

    &__drawer-close {
      color: #334155;
      background: rgba(15, 23, 42, 0.08);
    }

    &__drawer-separator {
      background: rgba(15, 23, 42, 0.12);
    }

    &__mobile-item {
      color: #0f172a;

      &:hover {
        background: rgba(15, 23, 42, 0.06);
      }
    }
  }
}

.body--dark {
  .navbar {
    background: rgba(18, 18, 18, 0.96);
    border-bottom-color: rgba(71, 85, 105, 0.28);
    box-shadow: none;
  }
}

@media (max-width: $breakpoint-md-max) {
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

@media (max-width: 430px) {
  .navbar {
    &__title {
      font-size: 1.05rem;
    }

    &__brand {
      gap: 8px;
      min-width: 0;
    }
  }
}
</style>
