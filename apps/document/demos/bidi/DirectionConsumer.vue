<script setup lang="ts">
import {computed} from 'vue';
import {useDirectionality} from 'vue-cdk/bidi';

const directionality = useDirectionality();
const label = computed(() => directionality.valueSignal.value.toUpperCase());
</script>

<template>
  <strong>{{ label }}</strong>
</template>
