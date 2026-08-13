<script setup lang="ts">
import {ref} from 'vue';
import {FlatTreeControl, VTree, VTreeNode, vTreeNodePadding} from 'vue-cdk/tree';

interface FileNode {
  name: string;
  level: number;
  expandable: boolean;
}

/** 扁平节点数组：节点引用在初始化后保持稳定，trackBy 用 name 标识。 */
const nodes: FileNode[] = [
  {name: 'src', level: 0, expandable: true},
  {name: 'components', level: 1, expandable: true},
  {name: 'App.vue', level: 1, expandable: false},
  {name: 'main.ts', level: 0, expandable: false},
  {name: 'package.json', level: 0, expandable: false},
];

/** 经典 TreeControl 用法：控制实例可在树外直接操作展开状态。 */
const treeControl = new FlatTreeControl<FileNode, string>(
  node => node.level,
  node => node.expandable,
  {trackBy: node => node.name},
);
treeControl.dataNodes = nodes;

const expandedCount = ref(0);

function refreshCount(): void {
  expandedCount.value = nodes.filter(node => treeControl.isExpanded(node)).length;
}

function expandAll(): void {
  treeControl.expandAll();
  refreshCount();
}

function collapseAll(): void {
  treeControl.collapseAll();
  refreshCount();
}
</script>

<template>
  <div class="control-demo">
    <VTree :data-source="nodes" :tree-control="treeControl" class="demo-tree">
      <template #node="{node}">
        <VTreeNode :node="node" class="tree-node">
          <span class="folder">{{ node.expandable ? '📁' : '📄' }}</span>
          <span v-tree-node-padding class="label">{{ node.name }}</span>
        </VTreeNode>
      </template>
    </VTree>
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="expandAll">expandAll()</button>
      <button type="button" class="doc-btn" @click="collapseAll">collapseAll()</button>
    </div>
    <p class="hint">已展开 {{ expandedCount }} / {{ nodes.length }} 个节点；也可用方向键 + 左右键操作。</p>
  </div>
</template>

<style scoped>
.control-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.demo-tree {
  width: 300px;
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

.buttons {
  display: flex;
  gap: 8px;
}
</style>
