<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/scrolling';
import VirtualScrollDemo from '../demos/scrolling/VirtualScrollDemo.vue';
import VirtualScrollDemoSource from '../demos/scrolling/VirtualScrollDemo.vue?raw';
import ScrollableDemo from '../demos/scrolling/ScrollableDemo.vue';
import ScrollableDemoSource from '../demos/scrolling/ScrollableDemo.vue?raw';
import ViewportRulerDemo from '../demos/scrolling/ViewportRulerDemo.vue';
import ViewportRulerDemoSource from '../demos/scrolling/ViewportRulerDemo.vue?raw';
import HorizontalVirtualScrollDemo from '../demos/scrolling/HorizontalVirtualScrollDemo.vue';
import HorizontalVirtualScrollDemoSource from '../demos/scrolling/HorizontalVirtualScrollDemo.vue?raw';
import WindowScrollVirtualDemo from '../demos/scrolling/WindowScrollVirtualDemo.vue';
import WindowScrollVirtualDemoSource from '../demos/scrolling/WindowScrollVirtualDemo.vue?raw';
import DataSourceVirtualScrollDemo from '../demos/scrolling/DataSourceVirtualScrollDemo.vue';
import DataSourceVirtualScrollDemoSource from '../demos/scrolling/DataSourceVirtualScrollDemo.vue?raw';
import AutoSizeVirtualScrollDemo from '../demos/scrolling/AutoSizeVirtualScrollDemo.vue';
import AutoSizeVirtualScrollDemoSource from '../demos/scrolling/AutoSizeVirtualScrollDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="scrolling"
    zh-name="滚动"
    intro="滚动能力集合：全局滚动分发、滚动容器、视口测量，以及固定尺寸与不定高度虚拟滚动。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="不定高度与双向追加"
      description="条目高度无需预先知道；运行时变高以及向顶部或底部追加时，当前可视内容均保持原位。"
      :source="AutoSizeVirtualScrollDemoSource"
      filename="AutoSizeVirtualScrollDemo.vue"
    >
      <AutoSizeVirtualScrollDemo />
    </DemoCard>

    <DemoCard
      title="固定尺寸虚拟滚动"
      description="1000 条数据仅渲染视口附近的条目；演示 scrollToIndex / scrollToOffset、trackBy 与 appendOnly 模式。"
      :source="VirtualScrollDemoSource"
      filename="VirtualScrollDemo.vue"
    >
      <VirtualScrollDemo />
    </DemoCard>

    <DemoCard
      title="滚动容器与全局分发"
      description="v-scrollable 与 useScrollable 两种注册方式；六向 scrollTo、measureScrollOffset 读数，滚动事件经节流进入全局流。"
      :source="ScrollableDemoSource"
      filename="ScrollableDemo.vue"
    >
      <ScrollableDemo />
    </DemoCard>

    <DemoCard
      title="视口测量（ViewportRuler）"
      description="实时读取 getViewportSize / getViewportRect / getViewportScrollPosition；change(200) 节流订阅 resize 与 orientationchange。"
      :source="ViewportRulerDemoSource"
      filename="ViewportRulerDemo.vue"
    >
      <ViewportRulerDemo />
    </DemoCard>

    <DemoCard
      title="横向与 RTL 虚拟滚动"
      description="orientation='horizontal' 以宽度为条目尺寸；通过最近的 dir 属性切换 LTR / RTL，滚动轴方向自动反转。"
      :source="HorizontalVirtualScrollDemoSource"
      filename="HorizontalVirtualScrollDemo.vue"
    >
      <HorizontalVirtualScrollDemo />
    </DemoCard>

    <DemoCard
      title="窗口滚动与外部容器"
      description="scrollWindow 使用整页窗口滚动；v-virtual-scrollable-element 让外部容器负责滚动、视口只负责渲染，并支持 appendOnly。"
      :source="WindowScrollVirtualDemoSource"
      filename="WindowScrollVirtualDemo.vue"
    >
      <WindowScrollVirtualDemo />
    </DemoCard>

    <DemoCard
      title="DataSource 驱动虚拟滚动"
      description="VVirtualFor :of 直接接收 ArrayDataSource(ref) 与自定义 DataSource（Emitter 推流），追加数据只重渲染增量区间。"
      :source="DataSourceVirtualScrollDemoSource"
      filename="DataSourceVirtualScrollDemo.vue"
    >
      <DataSourceVirtualScrollDemo />
    </DemoCard>
  </ModulePage>
</template>
