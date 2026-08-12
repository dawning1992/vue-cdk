<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/scrolling';
import VirtualScrollDemo from '../demos/scrolling/VirtualScrollDemo.vue';
import VirtualScrollDemoSource from '../demos/scrolling/VirtualScrollDemo.vue?raw';
import ScrollableDemo from '../demos/scrolling/ScrollableDemo.vue';
import ScrollableDemoSource from '../demos/scrolling/ScrollableDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="scrolling"
    zh-name="滚动"
    intro="滚动能力集合：全局滚动分发（ScrollDispatcher）、滚动容器（vScrollable / useScrollable）、视口测量（ViewportRuler）与固定尺寸虚拟滚动（VVirtualScrollViewport + VVirtualFor）。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="固定尺寸虚拟滚动"
      description="1000 条数据仅渲染视口附近的条目；随机跳转演示视口暴露的 scrollToIndex API。"
      :source="VirtualScrollDemoSource"
      filename="VirtualScrollDemo.vue"
    >
      <VirtualScrollDemo />
    </DemoCard>

    <DemoCard
      title="滚动容器与全局分发"
      description="v-scrollable 把容器注册到 ScrollDispatcher，滚动事件经节流后进入全局滚动流。"
      :source="ScrollableDemoSource"
      filename="ScrollableDemo.vue"
    >
      <ScrollableDemo />
    </DemoCard>
  </ModulePage>
</template>
