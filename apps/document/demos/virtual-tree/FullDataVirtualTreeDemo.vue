<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualScrollTree, type VVirtualScrollTreePublicApi} from 'vue-cdk/virtual-tree';
import {VTreeNode, vTreeNodePadding, vTreeNodeToggle} from 'vue-cdk/tree';

interface Food {
  id: string;
  name: string;
  children?: Food[];
}

/** 递归生成测试树：depth 层、每层 width 个子节点。 */
function buildTree(depth: number, width: number, prefix = ''): Food[] {
  const nodes: Food[] = [];
  for (let i = 0; i < width; i++) {
    const id = prefix ? `${prefix}-${i}` : `${i}`;
    nodes.push({
      id,
      name: `${prefix ? `${prefix} / ` : ''}节点 ${i}`,
      children: depth > 1 ? buildTree(depth - 1, width, id) : undefined,
    });
  }
  return nodes;
}

/** 全量数据：共 1 + 5 + 25 + 125 + 625 = 781 个节点，全部一次性提供。 */
const data = ref(buildTree(4, 5));
const treeRef = ref<VVirtualScrollTreePublicApi<Food> | null>(null);
const firstVisible = ref(0);
</script>

<template>
  <div class="wrap">
    <div class="toolbar">
      <button type="button" class="doc-btn primary" @click="treeRef?.expandAll()">一键展开</button>
      <button type="button" class="doc-btn" @click="treeRef?.collapseAll()">一键折叠</button>
      <span class="info">首个可见行：#{{ firstVisible + 1 }}，全部节点：781</span>
    </div>
    <VVirtualScrollTree
      ref="treeRef"
      :data="data"
      :item-size="40"
      height="280px"
      @scrolled-index-change="firstVisible = $event"
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
    <p class="hint">全量模式：数据源一次性提供全部节点，展开/折叠即时过滤；781 个节点只渲染视口附近的行。</p>
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
  font-size: 13px;
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
