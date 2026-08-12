<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const items = ref(['红', '绿', '蓝', '黄']);

function onDrop(event: VDragDrop<string>): void {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}
</script>

<template>
  <VDropList :data="items" class="custom-list" @dropped="onDrop">
    <VDrag v-for="item in items" :key="item" :data="item" class="custom-item">
      <template #preview="{data}">
        <div class="preview-chip">预览：{{ data }}</div>
      </template>
      <template #placeholder="{data}">
        <div class="placeholder-chip">放在这里：{{ data }}</div>
      </template>
      {{ item }}
    </VDrag>
  </VDropList>
</template>

<style scoped>
.custom-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 300px;
}

.custom-item {
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #d9e0f0;
  border-radius: 8px;
  cursor: grab;
}

.preview-chip {
  padding: 10px 14px;
  background: #4b6ef5;
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: 0 6px 16px rgb(75 110 245 / 35%);
}

.placeholder-chip {
  padding: 10px 14px;
  border: 2px dashed #b9c4de;
  border-radius: 8px;
  color: #6b7693;
  font-size: 13px;
}
</style>
