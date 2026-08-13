<script setup lang="ts">
import {ref} from 'vue';
import {VTree, VTreeNode} from 'vue-cdk/tree';

interface A11yItem {
  name: string;
  disabled: boolean;
  typeaheadLabel?: string | null;
}

const items = ref<A11yItem[]>([
  {name: 'apple', disabled: false, typeaheadLabel: null},
  {name: 'banana', disabled: false, typeaheadLabel: null},
  {name: 'cherry', disabled: false, typeaheadLabel: 'typeahead'},
  {name: 'disabled-item', disabled: true, typeaheadLabel: null},
]);

const activated = ref('');
const focused = ref('');

function onActivation(name: string): void {
  activated.value = name;
}

function onFocus(name: string): void {
  focused.value = name;
}
</script>

<template>
  <div class="a11y-demo">
    <VTree
      :data-source="items"
      :level-accessor="() => 0"
      class="demo-tree"
    >
      <template #node="{node}">
        <VTreeNode
          :node="node"
          :is-disabled="node.disabled"
          class="tree-node"
          @activation="onActivation(node.name)"
          @focus="onFocus(node.name)"
        >
          <span class="dot" :class="{disabled: node.disabled}"></span>
          <span :class="{strike: node.disabled}">{{ node.name }}</span>
          <span v-if="node.typeaheadLabel" class="badge">typeahead 标签</span>
        </VTreeNode>
      </template>
    </VTree>
    <div class="status">
      <p>聚焦：{{ focused || '（点击节点或用方向键）' }}</p>
      <p>激活：{{ activated || '（按 Enter / Space）' }}</p>
    </div>
    <ul class="keys">
      <li>↑ / ↓：移动焦点</li>
      <li>→：展开 / 聚焦第一个子节点</li>
      <li>←：收起 / 聚焦父节点</li>
      <li>Home / End：首 / 末节点</li>
      <li>Enter / Space：激活</li>
      <li>字母键：typeahead 定位（200ms 防抖）</li>
      <li>*：展开当前层级全部节点</li>
    </ul>
  </div>
</template>

<style scoped>
.a11y-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.demo-tree {
  width: 320px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: default;
}

.tree-node:hover {
  background: #eef2fb;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4c8bf5;
}

.dot.disabled {
  background: #c3c9d6;
}

.strike {
  text-decoration: line-through;
  color: var(--doc-muted, #888);
}

.badge {
  font-size: 11px;
  color: var(--doc-primary, #3b6fe0);
  background: var(--doc-primary-soft, #eef2fb);
  padding: 1px 6px;
  border-radius: 8px;
}

.status p {
  margin: 4px 0;
  font-size: 13px;
}

.keys {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--doc-muted, #888);
  line-height: 1.9;
}
</style>
