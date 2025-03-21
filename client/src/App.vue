<script>
import { RouterView } from 'vue-router';
import Navbar from './components/NavBar.vue';

export default {
  components: { Navbar },
};
</script>

<template>
  <q-layout>
    <Navbar />
    <q-page-container>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>

<style>
@font-face {
  font-family: 'Montserrat';
  src: url('/fonts/Montserrat/Montserrat-Regular.ttf') format('truetype');
}

* {
  font-family: 'Montserrat';
}
</style>
