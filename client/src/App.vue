<script>
import { RouterView } from "vue-router";
import Navbar from "./components/NavBar.vue";
import { useRoute } from "vue-router";

export default {
  components: { Navbar, RouterView },
  setup() {
    const route = useRoute();
    
    const showNavbar = () => {
      return !route.meta.hideNavbar;
    };

    return {
      showNavbar
    };
  },
};
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <Navbar v-if="showNavbar()" />
    <q-page-container>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>

<style>
.dark-mode-toggle {
  position: fixed !important;
  left: 20px !important;
  right: auto !important;
  bottom: 20px !important;
  z-index: 1100 !important;
}

.toggle-btn {
  width: 54px !important;
  height: 54px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(148, 163, 184, 0.38) !important;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.22) !important;
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.toggle-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.3) !important;
}

.body--dark .toggle-btn {
  border-color: rgba(100, 116, 139, 0.44) !important;
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.62) !important;
}

@media (max-width: 768px) {
  .dark-mode-toggle {
    left: 14px !important;
    bottom: 14px !important;
  }

  .toggle-btn {
    width: 50px !important;
    height: 50px !important;
  }
}
</style>
