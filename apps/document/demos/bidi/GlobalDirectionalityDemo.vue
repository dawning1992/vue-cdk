<script setup lang="ts">
import {computed} from 'vue';
import {useDirectionality} from 'vue-cdk/bidi';

const directionality = useDirectionality();
const label = computed(() => directionality.valueSignal.value.toUpperCase());

function toggle() {
  directionality.setDirection(directionality.value === 'ltr' ? 'rtl' : 'ltr');
}
</script>

<template>
  <div class="demo-row">
    <span>当前方向：<strong>{{ label }}</strong></span>
    <button type="button" @click="toggle">切换方向上下文</button>
  </div>
</template>

<style scoped>
.demo-row { display: flex; align-items: center; gap: 16px; }
button { padding: 6px 12px; cursor: pointer; }
</style>
