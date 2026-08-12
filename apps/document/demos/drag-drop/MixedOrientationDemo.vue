<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const items = ref(Array.from({length: 8}, (_, i) => `卡片 ${i + 1}`));

function onDrop(event: VDragDrop<string>): void {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}
</script>

<template>
  <p class="hint">orientation="mixed"：flex-wrap 换行网格，条目通过 DOM 重排。</p>
  <VDropList :data="items" orientation="mixed" class="grid" @dropped="onDrop">
    <VDrag v-for="item in items" :key="item" :data="item" class="card">
      {{ item }}
    </VDrag>
  </VDropList>
</template>

<style scoped>
.hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--doc-muted);
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  background: #f4f6fb;
  border: 1px solid #d9e0f0;
  border-radius: 8px;
}

.card {
  width: 90px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #c7d2ea;
  border-radius: 8px;
  cursor: grab;
}
</style>
