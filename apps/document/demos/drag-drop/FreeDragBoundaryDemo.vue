<script setup lang="ts">
import {ref} from 'vue';
import {VDrag} from 'vue-cdk/drag-drop';
import type {VDragEnd} from 'vue-cdk/drag-drop';

const position = ref({x: 0, y: 0});

function onEnd(event: VDragEnd): void {
  position.value = {x: event.distance.x, y: event.distance.y};
}
</script>

<template>
  <p class="hint">
    自由拖拽（无容器）+ boundary 约束。位移：{{ position.x }}px / {{ position.y }}px
  </p>
  <div class="arena">
    <VDrag boundary-element=".arena" :free-drag-position="{x: 20, y: 20}" class="token" @ended="onEnd">
      拖动我
    </VDrag>
  </div>
</template>

<style scoped>
.hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--doc-muted);
}

.arena {
  position: relative;
  width: 100%;
  height: 260px;
  background: #f4f6fb;
  border: 1px dashed #b9c4de;
  border-radius: 8px;
  overflow: hidden;
}

.token {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 48px;
  background: #4b6ef5;
  color: #fff;
  border-radius: 10px;
  cursor: grab;
  user-select: none;
}
</style>
