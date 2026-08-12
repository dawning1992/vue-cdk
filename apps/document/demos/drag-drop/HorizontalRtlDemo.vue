<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const items = ref(['一', '二', '三', '四']);
const rtl = ref(false);

function onDrop(event: VDragDrop<string>): void {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}
</script>

<template>
  <label class="toggle">
    <input v-model="rtl" type="checkbox" />
    RTL 布局（dir="rtl"）
  </label>
  <div :dir="rtl ? 'rtl' : 'ltr'">
    <VDropList :data="items" orientation="horizontal" class="row-list" @dropped="onDrop">
      <VDrag v-for="item in items" :key="item" :data="item" class="row-item">
        {{ item }}
      </VDrag>
    </VDropList>
  </div>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.row-list {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #f4f6fb;
  border: 1px solid #d9e0f0;
  border-radius: 8px;
}

.row-item {
  padding: 10px 18px;
  background: #fff;
  border: 1px solid #c7d2ea;
  border-radius: 8px;
  cursor: grab;
}
</style>
