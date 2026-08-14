<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualScrollTree, type PageInfo} from 'vue-cdk/virtual-tree';
import {VTreeNode, vTreeNodePadding, vTreeNodeToggle} from 'vue-cdk/tree';

interface FileNode {
  id: string;
  name: string;
}

const log = ref<string[]>([]);

/** 模拟服务端分页：根层共 40 个，其余每个父节点共 120 个子节点，每页 30 条。 */
async function loadChildren(parent: FileNode | null, page: PageInfo): Promise<{children: FileNode[]; hasMore: boolean}> {
  await new Promise(resolve => setTimeout(resolve, 250));
  const total = parent === null ? 40 : 120;
  const start = page.offset;
  const count = Math.min(page.pageSize, total - start);
  const prefix = parent === null ? 'root' : parent.id;
  const children = Array.from({length: count}, (_, i) => ({
    id: `${prefix}-${start + i}`,
    name: `${parent === null ? '根节点' : '子节点'} ${start + i + 1}`,
  }));
  return {children, hasMore: start + count < total};
}

function onLoadMore(parent: FileNode | null, page: PageInfo): void {
  log.value.unshift(`加载 ${parent === null ? '根层级' : `「${parent.name}」`} 第 ${page.page + 1} 页`);
  if (log.value.length > 5) {
    log.value.pop();
  }
}
</script>

<template>
  <div class="wrap">
    <div class="toolbar">
      <span class="info">展开根节点后，滚动到其子节点末尾会继续加载该层下一页；第二层及以上按各自的父节点独立触发。</span>
    </div>
    <VVirtualScrollTree
      ref="treeRef"
      :load-children="loadChildren"
      :item-size="40"
      :page-size="30"
      height="280px"
      @load-more="onLoadMore"
    >
      <template #node="{node, isExpandable, isExpanded, isLoading}">
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
          <span v-if="isLoading" class="vt-loading">加载中…</span>
        </VTreeNode>
      </template>
    </VVirtualScrollTree>
    <pre class="vt-log">{{ log.join('\n') || '暂无加载记录' }}</pre>
    <p class="hint">懒加载模式：每层（含根层）独立分页；滚动接近某个父节点最后一个已加载子节点时才请求该父节点下一页，加载完成后自动缓存。</p>
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

.vt-loading {
  color: var(--doc-primary, #4f7cff);
  font-size: 11px;
}

.vt-log {
  margin: 10px 0 0;
  min-height: 64px;
  padding: 8px 10px;
  border: 1px dashed var(--doc-border);
  border-radius: 6px;
  background: #fafbfe;
  color: var(--doc-muted);
  font-size: 12px;
  white-space: pre-wrap;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
