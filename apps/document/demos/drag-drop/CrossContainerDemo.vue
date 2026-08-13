<script setup lang="ts">
import {ref} from 'vue';
import {transferArrayItem, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const todo = ref(['写周报', '回邮件', '整理代码']);
const done = ref(['喝咖啡']);

/** 跨容器放下：把条目从 previousContainer 的数据移到 container 的数据。 */
function onDrop(event: VDragDrop<string>): void {
  if (event.previousContainer === event.container) {
    return;
  }
  transferArrayItem(
    event.previousContainer.data as string[],
    event.container.data as string[],
    event.previousIndex,
    event.currentIndex,
  );
}
</script>

<template>
  <div class="columns">
    <div class="column">
      <p class="column-title">待办（{{ todo.length }}）</p>
      <VDropList id="todo" :data="todo" :connected-to="['done']" class="drop-area" @dropped="onDrop">
        <VDrag v-for="item in todo" :key="item" :data="item" class="task">
          {{ item }}
        </VDrag>
      </VDropList>
    </div>
    <div class="column">
      <p class="column-title">已完成（{{ done.length }}）</p>
      <VDropList id="done" :data="done" class="drop-area" @dropped="onDrop">
        <VDrag v-for="item in done" :key="item" :data="item" class="task">
          {{ item }}
        </VDrag>
      </VDropList>
    </div>
  </div>
</template>

<style scoped>
.columns {
  display: flex;
  gap: 20px;
  width: 100%;
}

.column {
  flex: 1;
  min-width: 0;
}

.column-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
}

.drop-area {
  min-height: 120px;
  padding: 10px;
  background: #f4f6fb;
  border: 1px dashed #b9c4de;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #c7d2ea;
  border-radius: 6px;
  cursor: grab;
}
</style>
