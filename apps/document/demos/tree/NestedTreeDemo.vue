<script setup lang="ts">
import {ref} from 'vue';
import {VTree, VNestedTreeNode, vTreeNodeToggle} from 'vue-cdk/tree';

interface TreeNode {
  name: string;
  children: TreeNode[];
}

/** 嵌套树数据：数据源只提供根节点，childrenAccessor 返回每个节点的子节点。 */
const roots = ref<TreeNode[]>([
  {
    name: 'Fruit',
    children: [
      {name: 'Apple', children: []},
      {name: 'Banana', children: []},
      {
        name: 'Citrus',
        children: [{name: 'Orange', children: []}],
      },
    ],
  },
  {name: 'Vegetables', children: [{name: 'Carrot', children: []}]},
]);

const log = ref<string[]>([]);

function onExpandedChange(name: string, expanded: boolean): void {
  log.value.unshift(`${name}：${expanded ? '展开（含子树递归）' : '收起'}`);
  if (log.value.length > 5) {
    log.value.pop();
  }
}
</script>

<template>
  <div class="nested-demo">
    <VTree
      :data-source="roots"
      :children-accessor="(node: TreeNode) => node.children"
      class="demo-tree"
    >
      <template #node="{node}">
        <VNestedTreeNode
          :node="node"
          :is-expandable="node.children.length > 0"
          class="tree-node"
          @expanded-change="onExpandedChange(node.name, $event)"
        >
          <button type="button" v-tree-node-toggle="true" class="toggle">
            {{ node.children.length ? '▾' : '·' }}
          </button>
          {{ node.name }}
        </VNestedTreeNode>
      </template>
    </VTree>
    <p class="hint">
      点击节点行切换（默认递归切换子树）；子节点自动渲染在节点内部，收起时从 DOM 移除。
    </p>
    <div class="doc-output">{{ log.join('\n') || '点击节点行体验展开/收起' }}</div>
  </div>
</template>

<style scoped>
.nested-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.demo-tree {
  width: 320px;
}

.tree-node {
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.tree-node:hover {
  background: #eef2fb;
}

.toggle {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-block;
  width: 14px;
  padding: 0;
  color: var(--doc-muted, #888);
}

:deep(.vcdk-tree-node-children) {
  margin-left: 18px;
  padding-left: 10px;
  border-left: 1px dashed #c9d4ec;
}
</style>
