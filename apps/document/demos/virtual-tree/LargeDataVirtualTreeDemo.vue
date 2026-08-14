<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualScrollTree} from 'vue-cdk/virtual-tree';
import {VTreeNode, vTreeNodePadding, vTreeNodeToggle} from 'vue-cdk/tree';

interface Row {
  id: number;
  name: string;
  children?: Row[];
}

/** 10 万个根节点 + 每个根节点 3 个子节点：仅渲染视口附近的行。 */
const data = ref<Row[]>(
  Array.from({length: 100000}, (_, i) => ({
    id: i,
    name: `行 ${i + 1}`,
    children: [
      {id: i * 10 + 1, name: `行 ${i + 1} 子 1`},
      {id: i * 10 + 2, name: `行 ${i + 1} 子 2`},
      {id: i * 10 + 3, name: `行 ${i + 1} 子 3`},
    ],
  })),
);

const firstVisible = ref(0);
const rendered = ref(0);

function onScrolledIndexChange(index: number): void {
  firstVisible.value = index;
  // 通过 DOM 统计当前实际渲染的行数（仅用于演示）。
  rendered.value = document.querySelectorAll('.vt-node').length;
}
</script>

<template>
  <div class="wrap">
    <div class="toolbar">
      <span class="info">数据总量：{{ data.length }} 行（含子节点共 40 万行）；当前实际渲染行数：{{ rendered }}</span>
    </div>
    <VVirtualScrollTree
      :data="data"
      :item-size="36"
      height="280px"
      @scrolled-index-change="onScrolledIndexChange"
    >
      <template #node="{node, isExpandable, isExpanded}">
        <VTreeNode :node="node" :is-expandable="isExpandable" class="vt-node">
          <button
            type="button"
            v-tree-node-toggle
            class="vt-toggle"
            :aria-label="`切换 ${node.name}`"
          >
            <span class="vt-arrow" :class="{open: isExpanded}">▸</span>
          </button>
          <span v-tree-node-padding class="vt-label">{{ node.name }}</span>
        </VTreeNode>
      </template>
    </VVirtualScrollTree>
    <p class="hint">40 万节点（含子级）场景：固定行高虚拟滚动保证 DOM 行数始终在视口 + 缓冲量级，滚动流畅。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.info {
  color: var(--doc-muted);
  font-size: 12px;
}

.vt-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  font-size: 12px;
  cursor: default;
}

.vt-node:hover {
  background: #eef2fb;
}

.vt-toggle {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px;
  line-height: 1;
}

.vt-arrow {
  display: inline-block;
  color: var(--doc-muted, #888);
  transition: transform 0.15s;
}

.vt-arrow.open {
  transform: rotate(90deg);
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
