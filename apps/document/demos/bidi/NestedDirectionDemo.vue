<script setup lang="ts">
import {ref} from 'vue';
import {VDir, type Direction} from 'vue-cdk/bidi';

const outer = ref<Direction>('rtl');
const changes = ref<string[]>([]);
</script>

<template>
  <div class="controls">
    <button type="button" @click="outer = outer === 'rtl' ? 'ltr' : 'rtl'">切换外层</button>
    <span>dirChange：{{ changes.join(' → ') || '尚未触发' }}</span>
  </div>
  <VDir :dir="outer" class="box" @dir-change="changes.push($event)">
    外层 {{ outer }}
    <VDir dir="ltr" class="box nested">内层固定 LTR，覆盖外层上下文</VDir>
  </VDir>
</template>

<style scoped>
.controls { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.box { border: 1px solid #aeb7d8; border-radius: 8px; padding: 14px; }
.nested { margin-top: 10px; background: #f5f7ff; }
button { padding: 6px 12px; cursor: pointer; }
</style>
