<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/virtual-tree';
import FullDataVirtualTreeDemo from '../demos/virtual-tree/FullDataVirtualTreeDemo.vue';
import FullDataVirtualTreeDemoSource from '../demos/virtual-tree/FullDataVirtualTreeDemo.vue?raw';
import LazyLoadVirtualTreeDemo from '../demos/virtual-tree/LazyLoadVirtualTreeDemo.vue';
import LazyLoadVirtualTreeDemoSource from '../demos/virtual-tree/LazyLoadVirtualTreeDemo.vue?raw';
import LargeDataVirtualTreeDemo from '../demos/virtual-tree/LargeDataVirtualTreeDemo.vue';
import LargeDataVirtualTreeDemoSource from '../demos/virtual-tree/LargeDataVirtualTreeDemo.vue?raw';
import CustomNodeVirtualTreeDemo from '../demos/virtual-tree/CustomNodeVirtualTreeDemo.vue';
import CustomNodeVirtualTreeDemoSource from '../demos/virtual-tree/CustomNodeVirtualTreeDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="virtual-tree"
    zh-name="虚拟滚动树"
    intro="基于 scrolling 虚拟滚动与 tree 节点能力的树形组件：全量/懒加载两种数据模式，每层独立分页 + 滚动边界触发加载，固定行高只渲染视口附近节点；#node 插槽与 VTreeNode 生态完全兼容。"
    intro-en="A tree built on virtual scrolling and tree nodes. It supports full-data and lazy-loading modes, independent pagination per level with scroll-triggered loading, fixed-height rows, and a #node slot compatible with VTreeNode."
    :api-groups="apiGroups"
  >
    <DemoCard
      title="全量数据 + 一键展开/折叠"
      title-en="Full data with expand/collapse all"
      description="data 一次性提供全部节点；展开/折叠即时过滤可见列表，expandAll / collapseAll 一键操作，781 个节点只渲染视口附近的行。"
      description-en="Provide all nodes through data at once. Expansion filters the visible list immediately; expandAll and collapseAll operate on all nodes. Only viewport rows are rendered for the 781-node tree."
      :source="FullDataVirtualTreeDemoSource"
      filename="FullDataVirtualTreeDemo.vue"
    >
      <FullDataVirtualTreeDemo />
    </DemoCard>

    <DemoCard
      title="懒加载 + 每层独立滚动分页"
      title-en="Lazy loading with per-level scroll pagination"
      description="loadChildren 按父节点分页：根层级、第二层、更深层级各自维护分页状态；滚动接近某父节点最后一个已加载子节点时只加载该父节点下一页，加载记录实时展示。"
      description-en="loadChildren paginates by parent, with independent state at the root and every deeper level. Scrolling near a parent's last loaded child requests only that parent's next page; load events appear live."
      :source="LazyLoadVirtualTreeDemoSource"
      filename="LazyLoadVirtualTreeDemo.vue"
    >
      <LazyLoadVirtualTreeDemo />
    </DemoCard>

    <DemoCard
      title="大数据量（40 万行）"
      title-en="Large data set (400,000 rows)"
      description="10 万个根节点、每个含 3 个子节点（共 40 万行）：固定行高虚拟滚动保证 DOM 行数始终在视口 + 缓冲量级。"
      description-en="The tree contains 100,000 roots with three children each, for 400,000 rows. Fixed-height virtual scrolling keeps the DOM limited to the viewport and its buffer."
      :source="LargeDataVirtualTreeDemoSource"
      filename="LargeDataVirtualTreeDemo.vue"
    >
      <LargeDataVirtualTreeDemo />
    </DemoCard>

    <DemoCard
      title="自定义节点模板与加载/错误态"
      title-en="Custom node template, loading, and error states"
      description="插槽上下文扩展 isLoading / hasMore / isError 等状态；自定义状态徽标、加载动画与错误重试按钮，retry(parent) 重试失败层。"
      description-en="The slot context exposes isLoading, hasMore, and isError. Render custom status badges, loading indicators, and retry buttons; retry(parent) retries a failed level."
      :source="CustomNodeVirtualTreeDemoSource"
      filename="CustomNodeVirtualTreeDemo.vue"
    >
      <CustomNodeVirtualTreeDemo />
    </DemoCard>
  </ModulePage>
</template>
