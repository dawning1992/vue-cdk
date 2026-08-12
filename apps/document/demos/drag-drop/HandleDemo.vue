<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList, vDragHandle} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const items = ref(['甲', '乙', '丙', '丁']);
const handleDisabled = ref(false);

function onDrop(event: VDragDrop<string>): void {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}
</script>

<template>
  <label class="toggle">
    <input v-model="handleDisabled" type="checkbox" />
    禁用所有手柄
  </label>
  <VDropList :data="items" class="handle-list" @dropped="onDrop">
    <VDrag v-for="item in items" :key="item" :data="item" class="handle-item">
      <span class="text">{{ item }}</span>
      <span v-drag-handle="{disabled: handleDisabled}" class="handle">⠿ 拖我</span>
    </VDrag>
  </VDropList>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.handle-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 300px;
}

.handle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f4f6fb;
  border: 1px solid #d9e0f0;
  border-radius: 8px;
}

.handle {
  padding: 4px 10px;
  background: #e6ebf7;
  border-radius: 6px;
  font-size: 12px;
  cursor: grab;
  user-select: none;
}
</style>
