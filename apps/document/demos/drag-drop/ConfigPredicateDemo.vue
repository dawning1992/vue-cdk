<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop, VDragPublicApi} from 'vue-cdk/drag-drop';

const items = ref(['A', 'B', 'C', 'D', 'E']);
const disabled = ref(false);
const sortingDisabled = ref(false);
const lockAxis = ref<'x' | 'y' | null>(null);
const onlyAllowA = ref(false);

function onDrop(event: VDragDrop<string>): void {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}

/** enterPredicate 演示：只允许条目 A 进入本列表。 */
function enterPredicate(drag: VDragPublicApi): boolean {
  return !onlyAllowA.value || drag.data === 'A';
}
</script>

<template>
  <div class="controls">
    <label><input v-model="disabled" type="checkbox" /> disabled</label>
    <label><input v-model="sortingDisabled" type="checkbox" /> sortingDisabled</label>
    <label><input v-model="onlyAllowA" type="checkbox" /> enterPredicate：只放行 A</label>
    <label>
      lockAxis
      <select v-model="lockAxis">
        <option :value="null">无</option>
        <option value="x">x</option>
        <option value="y">y</option>
      </select>
    </label>
  </div>
  <VDropList
    :data="items"
    :disabled="disabled"
    :sorting-disabled="sortingDisabled"
    :lock-axis="lockAxis"
    :enter-predicate="enterPredicate"
    class="config-list"
    @dropped="onDrop"
  >
    <VDrag v-for="item in items" :key="item" :data="item" class="config-item">
      {{ item }}
    </VDrag>
  </VDropList>
</template>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 12px;
  font-size: 13px;
}

.controls label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 280px;
}

.config-item {
  padding: 10px 14px;
  background: #f4f6fb;
  border: 1px solid #d9e0f0;
  border-radius: 8px;
  cursor: grab;
}
</style>
