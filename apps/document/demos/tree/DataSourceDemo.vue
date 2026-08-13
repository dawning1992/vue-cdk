<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {DataSource} from 'vue-cdk/collections';
import {Emitter} from 'vue-cdk/emitter';
import {VTree, VTreeNode} from 'vue-cdk/tree';

interface Item {
  name: string;
  level: number;
  expandable: boolean;
}

/** 形态一：Ref 数据源，深层监听，push 后自动更新。 */
const refItems = ref<Item[]>([
  {name: 'ref-a', level: 0, expandable: false},
  {name: 'ref-b', level: 0, expandable: false},
]);

/** 形态二：Emitter 数据源，手动推流。 */
const emitter = new Emitter<readonly Item[]>();
const emitterItems = ref<Item[]>([]);
emitter.subscribe(items => {
  emitterItems.value = [...items];
});

/** 形态三：自定义 DataSource，connect/disconnect 生命周期。 */
class DemoDataSource extends DataSource<Item> {
  readonly stream = new Emitter<readonly Item[]>();
  counter = 0;
  override connect(): Emitter<readonly Item[]> {
    return this.stream;
  }
  override disconnect(): void {
    this.stream.complete();
  }
  refresh(): void {
    this.counter++;
    this.stream.next([
      {name: `ds-root-${this.counter}`, level: 0, expandable: true},
      {name: `ds-child-${this.counter}`, level: 1, expandable: false},
    ]);
  }
}

const demoSource = new DemoDataSource();

onMounted(() => {
  // Emitter 无重放能力：挂载（树完成订阅）后再推首帧。
  demoSource.refresh();
});
</script>

<template>
  <div class="source-demo">
    <section class="source-card">
      <h4>Ref 数据源（深层监听）</h4>
      <VTree
        :data-source="refItems"
        :level-accessor="(node: Item) => node.level"
        class="mini-tree"
      >
        <template #node="{node}">
          <VTreeNode :node="node" :is-expandable="node.expandable">{{ node.name }}</VTreeNode>
        </template>
      </VTree>
      <button type="button" class="doc-btn" @click="refItems.push({name: `ref-${refItems.length + 1}`, level: 0, expandable: false})">
        追加节点
      </button>
    </section>

    <section class="source-card">
      <h4>Emitter 数据源（手动推流）</h4>
      <VTree
        :data-source="emitter"
        :level-accessor="(node: Item) => node.level"
        class="mini-tree"
      >
        <template #node="{node}">
          <VTreeNode :node="node" :is-expandable="node.expandable">{{ node.name }}</VTreeNode>
        </template>
      </VTree>
      <button
        type="button"
        class="doc-btn"
        @click="emitter.next([{name: `emitter-${emitterItems.length + 1}`, level: 0, expandable: false}])"
      >
        派发数据
      </button>
    </section>

    <section class="source-card">
      <h4>自定义 DataSource（connect / disconnect）</h4>
      <VTree
        :data-source="demoSource"
        :level-accessor="(node: Item) => node.level"
        class="mini-tree"
      >
        <template #node="{node}">
          <VTreeNode :node="node" :is-expandable="node.expandable">{{ node.name }}</VTreeNode>
        </template>
      </VTree>
      <button type="button" class="doc-btn" @click="demoSource.refresh()">刷新数据</button>
      <p class="hint">卸载树组件时会调用 DataSource.disconnect() 释放连接。</p>
    </section>
  </div>
</template>

<style scoped>
.source-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  width: 100%;
}

.source-card {
  border: 1px solid var(--doc-border, #e3e8f2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-card h4 {
  margin: 0;
  font-size: 14px;
}

.mini-tree {
  min-height: 84px;
}

.mini-tree :deep(.vcdk-tree-node) {
  padding: 3px 6px;
}
</style>
