<script setup lang="ts">
import {ref} from 'vue';
import {ArrayDataSource, type CollectionViewer, type ListRange} from 'vue-cdk/collections';
import {Emitter} from 'vue-cdk/emitter';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

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
    log.value.unshift(t('已连接，无需重复 connect', 'Already connected; no need to call connect again'));
    return;
  }
  const stream = dataSource.connect(new DemoViewer());
  unsubscribe = stream.subscribe(data => {
    log.value.unshift(
      t(`收到数据流：${data.length} 条（${data.map(item => item.name).join(', ')}）`, `Stream emitted ${data.length} items (${data.map(item => item.name).join(', ')})`),
    );
    if (log.value.length > 5) {
      log.value.pop();
    }
  });
  log.value.unshift(t('已 connect：数组首帧将在微任务中派发', 'Connected: the array emits its initial value in a microtask'));
}

function addItem(): void {
  const nextId = items.value.length + 1;
  items.value = [...items.value, {id: nextId, name: `item-${nextId}`}];
}

function disconnect(): void {
  unsubscribe?.();
  unsubscribe = null;
  log.value.unshift(t('已 disconnect', 'Disconnected'));
}
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="connect">{{ t('连接数据源', 'Connect data source') }}</button>
      <button type="button" class="doc-btn" @click="addItem">{{ t('追加一条数据', 'Add an item') }}</button>
      <button type="button" class="doc-btn" @click="disconnect">{{ t('断开连接', 'Disconnect') }}</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || t('点击「连接数据源」开始', 'Click “Connect data source” to begin') }}</div>
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
