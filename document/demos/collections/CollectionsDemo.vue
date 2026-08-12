<script setup lang="ts">
import {ref} from 'vue';
import {ArrayDataSource, type CollectionViewer, type ListRange} from 'vue-cdk/collections';
import {Emitter} from 'vue-cdk/emitter';

/** 模拟虚拟滚动等消费方：通过 viewChange 声明查看区间。 */
class DemoViewer implements CollectionViewer {
  readonly viewChange = new Emitter<ListRange>();
}

const items = ref([
  {id: 1, name: 'alpha'},
  {id: 2, name: 'beta'},
  {id: 3, name: 'gamma'},
]);
const dataSource = new ArrayDataSource(items);
const log = ref<string[]>([]);

let unsubscribe: (() => void) | null = null;

function connect(): void {
  if (unsubscribe) {
    log.value.unshift('已连接，无需重复 connect');
    return;
  }
  const stream = dataSource.connect(new DemoViewer());
  unsubscribe = stream.subscribe(data => {
    log.value.unshift(
      `收到数据流：${data.length} 条（${data.map(item => item.name).join(', ')}）`,
    );
    if (log.value.length > 5) {
      log.value.pop();
    }
  });
  log.value.unshift('已 connect：数组首帧将在微任务中派发');
}

function addItem(): void {
  const nextId = items.value.length + 1;
  items.value = [...items.value, {id: nextId, name: `item-${nextId}`}];
}

function disconnect(): void {
  unsubscribe?.();
  unsubscribe = null;
  log.value.unshift('已 disconnect');
}
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="connect">连接数据源</button>
      <button type="button" class="doc-btn" @click="addItem">追加一条数据</button>
      <button type="button" class="doc-btn" @click="disconnect">断开连接</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || '点击「连接数据源」开始' }}</div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
