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
  <q-layout>
    <Navbar v-if="showNavbar()" />
    <q-page-container>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>

<style>
@font-face {
  font-family: "Montserrat";
  src: url("/fonts/Montserrat/Montserrat-Regular.ttf") format("truetype");
}

* {
  font-family: "Montserrat";
}
</style>