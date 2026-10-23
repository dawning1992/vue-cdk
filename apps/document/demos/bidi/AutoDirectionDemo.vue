<script setup lang="ts">
import {ref} from 'vue';
import {VDir} from 'vue-cdk/bidi';
import {useLocale} from '../../composables/useLocale';
const {locale} = useLocale();

const rawDirection = ref('auto');
</script>

<template>
  <label>
    {{ locale === 'en-US' ? 'Raw dir: ' : '原始 dir：' }}
    <select v-model="rawDirection">
      <option value="auto">auto</option>
      <option value="RTL">RTL</option>
      <option value="invalid">invalid</option>
    </select>
  </label>
  <VDir v-slot="slot" :dir="rawDirection" class="result">
    {{ locale === 'en-US' ? 'DOM attribute is ' : 'DOM 属性为 ' }}<code>{{ rawDirection }}</code>{{ locale === 'en-US' ? ', injected context is ' : '，注入上下文为 ' }}
    <strong>{{ slot.direction }}</strong>
  </VDir>
</template>

<style scoped>
.result { margin-top: 12px; padding: 12px; border: 1px solid #d7daea; border-radius: 8px; }
select { margin-left: 8px; padding: 4px 8px; }
</style>
