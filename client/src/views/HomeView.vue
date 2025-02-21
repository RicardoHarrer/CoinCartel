<script setup>
import WelcomeMessage from '../components/WelcomeMessage.vue';
const msg = 'HTL Wien West';
</script>

<template>
  <div class="q-mx-xl column items-center">
    <h3>Home View</h3>
    <div class="row justify-center q-mt-md">
      <WelcomeMessage :message="msg" />
    </div>
  </div>
</template>

<style></style>

