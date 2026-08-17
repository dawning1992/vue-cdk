<script setup lang="ts">
import {ref} from 'vue';
import {VDir} from 'vue-cdk/bidi';

const rawDirection = ref('auto');
</script>

<template>
  <label>
    原始 dir：
    <select v-model="rawDirection">
      <option value="auto">auto</option>
      <option value="RTL">RTL</option>
      <option value="invalid">invalid</option>
    </select>
  </label>
  <VDir v-slot="slot" :dir="rawDirection" class="result">
    DOM 属性为 <code>{{ rawDirection }}</code>，注入上下文为
    <strong>{{ slot.direction }}</strong>
  </VDir>
</template>

<style scoped>
.result { margin-top: 12px; padding: 12px; border: 1px solid #d7daea; border-radius: 8px; }
select { margin-left: 8px; padding: 4px 8px; }
</style>
