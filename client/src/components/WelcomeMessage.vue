<script setup>
defineProps({
  message: {
    type: String,
    default: 'Fremder!',
  },
});
</script>

<template>
  <q-icon class="q-mx-sm" color="red" name="fa-solid fa-heart" size="2.1rem" />
  <span class="text-h4">Hallo {{ message }}</span>
  <q-icon class="q-mx-sm" color="red" name="fa-solid fa-heart" size="2.1rem" />
</template>

<style></style>
