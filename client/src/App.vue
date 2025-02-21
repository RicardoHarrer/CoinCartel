<script setup>
import { RouterView } from 'vue-router';
</script>

<template>
  <header>
    <q-tabs>
      <q-route-tab to="/" label="Home"></q-route-tab>
      <q-route-tab to="/about" label="About"></q-route-tab>
    </q-tabs>
  </header>

  <RouterView />
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