<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualScrollTree, type PageInfo, type VVirtualScrollTreePublicApi} from 'vue-cdk/virtual-tree';
import {VTreeNode, vTreeNodePadding} from 'vue-cdk/tree';

interface Task {
  id: string;
  name: string;
  status: 'todo' | 'done';
}

const treeRef = ref<VVirtualScrollTreePublicApi<Task> | null>(null);
const logs = ref<string[]>([]);

/** 模拟带失败概率的分页加载：第 3 页之后的请求有 40% 概率失败，用于演示错误态与重试。 */
async function loadChildren(parent: Task | null, page: PageInfo): Promise<{children: Task[]; hasMore: boolean}> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (page.page >= 3 && Math.random() < 0.4) {
    throw new Error('模拟网络抖动：加载失败');
  }
  const total = 120;
  const start = page.offset;
  const count = Math.min(page.pageSize, total - start);
  const prefix = parent === null ? 'root' : parent.id;
  const children = Array.from({length: count}, (_, i) => ({
    id: `${prefix}-${start + i}`,
    name: `${parent === null ? '任务组' : '任务'} ${start + i + 1}`,
    status: ((start + i) % 3 === 0 ? 'done' : 'todo') as Task['status'],
  }));
  return {children, hasMore: start + count < total};
}

function onError(parent: Task | null, error: Error): void {
  logs.value.unshift(`${parent === null ? '根层级' : `「${parent.name}」`}：${error.message}`);
  if (logs.value.length > 3) {
    logs.value.pop();
  }
}

function retryLast(parent: Task | null): void {
  treeRef.value?.retry(parent);
}
</script>

<template>
  <div class="wrap">
    <div class="toolbar">
      <button type="button" class="doc-btn" @click="treeRef?.expandAll()">加载并展开全部</button>
      <button type="button" class="doc-btn" @click="treeRef?.collapseAll()">全部折叠</button>
      <span class="info">节点模板完全自定义：状态徽标、加载动画与错误重试按钮。</span>
    </div>
    <VVirtualScrollTree
      ref="treeRef"
      :load-children="loadChildren"
      :item-size="42"
      :page-size="20"
      height="280px"
      @error="onError"
    >
      <template #node="{node, isExpandable, isExpanded, isLoading, isError}">
        <VTreeNode
          v-tree-node-padding
          :node="node"
          :is-expandable="isExpandable"
          class="vt-node"
        >
          <span class="vt-status" :class="node.status">{{ node.status === 'done' ? '✓' : '○' }}</span>
          <span class="vt-label">{{ node.name }}</span>
          <button
            v-if="isExpandable"
            type="button"
            class="vt-chevron"
            @click="isExpanded ? treeRef?.collapse(node) : treeRef?.expand(node)"
          >
            {{ isExpanded ? '−' : '+' }}
          </button>
          <span v-if="isLoading" class="vt-spinner" aria-label="加载中" />
          <button v-if="isError" type="button" class="vt-retry" @click="retryLast(node)">
            重试
          </button>
        </VTreeNode>
      </template>
    </VVirtualScrollTree>
    <pre class="vt-log">{{ logs.join('\n') || '暂无错误日志' }}</pre>
    <p class="hint">插槽上下文扩展了 isLoading / hasMore / isError / isExpanded / isExpandable，可自由渲染加载与错误状态；retry(parent) 可重试失败层。</p>
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
  gap: 6px;
  padding: 0 8px;
  font-size: 13px;
  cursor: default;
}

.vt-status {
  width: 16px;
  text-align: center;
  font-size: 12px;
}

.vt-status.done {
  color: #18a058;
}

.vt-status.todo {
  color: #c7ccd6;
}

.vt-chevron {
  appearance: none;
  border: 1px solid var(--doc-border);
  border-radius: 4px;
  background: #fff;
  width: 18px;
  height: 18px;
  line-height: 1;
  cursor: pointer;
  font-size: 12px;
}

.vt-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--doc-border);
  border-top-color: var(--doc-primary, #4f7cff);
  border-radius: 50%;
  animation: vt-spin 0.8s linear infinite;
}

@keyframes vt-spin {
  to {
    transform: rotate(360deg);
  }
}

.vt-retry {
  appearance: none;
  border: 1px solid #e5484d;
  border-radius: 4px;
  background: #fff5f5;
  color: #e5484d;
  font-size: 11px;
  padding: 1px 8px;
  cursor: pointer;
}

.vt-log {
  margin: 10px 0 0;
  min-height: 48px;
  padding: 8px 10px;
  border: 1px dashed var(--doc-border);
  border-radius: 6px;
  background: #fafbfe;
  color: #e5484d;
  font-size: 12px;
  white-space: pre-wrap;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
