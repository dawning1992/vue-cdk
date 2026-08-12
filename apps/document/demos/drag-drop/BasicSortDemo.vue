<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const items = ref(['零', '一', '二', '三', '四']);

/** 排序完成后按事件索引重排数据数组。 */
function onDrop(event: VDragDrop<string>): void {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}
</script>

<template>
  <VDropList :data="items" class="sort-list" @dropped="onDrop">
    <VDrag v-for="item in items" :key="item" :data="item" class="sort-item">
      <span class="grip">⠿</span>
      {{ item }}
    </VDrag>
  </VDropList>
  <p class="hint">顺序：{{ items.join(' → ') }}</p>
</template>

<style scoped>
.sort-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 280px;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f4f6fb;
  border: 1px solid #d9e0f0;
  border-radius: 8px;
  cursor: grab;
}

.grip {
  color: #8a94b0;
}

.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--doc-muted);
}
</style>
