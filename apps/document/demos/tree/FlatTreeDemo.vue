<script setup lang="ts">
import {ref} from 'vue';
import {VTree, VTreeNode, vTreeNodeToggle, vTreeNodePadding} from 'vue-cdk/tree';

interface Food {
  name: string;
  level: number;
  expandable: boolean;
}

/** 扁平树数据：数据源直接提供全部可渲染节点，level 标明层级。 */
const items = ref<Food[]>([
  {name: 'Fruit', level: 0, expandable: true},
  {name: 'Apple', level: 1, expandable: false},
  {name: 'Banana', level: 1, expandable: false},
  {name: 'Vegetables', level: 0, expandable: true},
  {name: 'Carrot', level: 1, expandable: false},
  {name: 'Leek', level: 1, expandable: false},
]);

const log = ref<string[]>([]);

function onExpandedChange(name: string, expanded: boolean): void {
  log.value.unshift(`${name}：${expanded ? '展开' : '收起'}`);
  if (log.value.length > 5) {
    log.value.pop();
  }
}
</script>

<template>
  <div class="flat-demo">
    <VTree
      :data-source="items"
      :level-accessor="(node: Food) => node.level"
      class="demo-tree"
    >
      <template #node="{node}">
        <VTreeNode
          :node="node"
          :is-expandable="node.expandable"
          class="tree-node"
          @expanded-change="onExpandedChange(node.name, $event)"
        >
          <button
            type="button"
            v-tree-node-toggle
            class="toggle"
            :aria-label="`切换 ${node.name}`"
          >
            <span class="arrow">▸</span>
          </button>
          <span v-tree-node-padding class="label">{{ node.name }}</span>
        </VTreeNode>
      </template>
    </VTree>
    <div class="doc-output">{{ log.join('\n') || '点击箭头展开/收起节点' }}</div>
  </div>
</template>

<style scoped>
.flat-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.demo-tree {
  width: 280px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
}

.tree-node:hover {
  background: #eef2fb;
}

.toggle {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px;
  line-height: 1;
}

.arrow {
  display: inline-block;
  color: var(--doc-muted, #888);
  transition: transform 0.15s;
}
</style>
