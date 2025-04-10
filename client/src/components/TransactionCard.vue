<template>
  <q-card class="my-card" flat bordered>
    <q-card-section class="bg-primary text-white">
      <div class="text-h6 text-center">{{ data.title }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row items-center">
        <q-icon
          :name="data.type === 'income' ? 'arrow_upward' : 'arrow_downward'"
          :color="data.type === 'income' ? 'positive' : 'negative'"
          size="sm"
          class="q-mr-sm"
        />
        <div :class="amountClass">
          {{ formattedAmount }} €
        </div>
      </div>

      <div class="row justify-between q-mt-sm">
        <q-badge color="secondary" class="q-pa-sm">
          {{ data.category }}
        </q-badge>
        <div class="text-caption text-grey">
          {{ data.date }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const amountClass = computed(() =>
  props.data.type === 'income'
    ? 'text-positive text-h6 text-bold'
    : 'text-negative text-h6 text-bold'
)

const formattedAmount = computed(() =>
  props.data.type === 'income'
    ? `+${props.data.amount}`
    : `-${props.data.amount}`
)
</script>

<style scoped>
.my-card {
  width: 100%;
  transition: transform 0.3s;
}

.my-card:hover {
  transform: translateY(-5px);
}
</style>