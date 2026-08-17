<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/layout';
import ResponsiveLayoutDemo from '../demos/layout/ResponsiveLayoutDemo.vue';
import ResponsiveLayoutDemoSource from '../demos/layout/ResponsiveLayoutDemo.vue?raw';
import ObserverLayoutDemo from '../demos/layout/ObserverLayoutDemo.vue';
import ObserverLayoutDemoSource from '../demos/layout/ObserverLayoutDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="layout"
    zh-name="响应式布局"
    intro="对齐 Angular CDK layout 的 Breakpoints、MediaMatcher 与 BreakpointObserver，并提供适配 Vue 3 Composition API 的 useBreakpoints 响应式入口；支持 SSR、依赖注入和自动清理。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="Composition API 响应式布局"
      description="useBreakpoints 将一个或多个媒体查询转换为只读 ref；组件销毁时自动退订。示例同时使用标准 Handset 与 Large/XLarge 断点。"
      :source="ResponsiveLayoutDemoSource"
      filename="ResponsiveLayoutDemo.vue"
    >
      <ResponsiveLayoutDemo />
    </DemoCard>
    <DemoCard
      title="BreakpointObserver 命令式观察"
      description="保留 Angular CDK 的 observe(...).subscribe(...) 设计，适合 store、服务和组件外逻辑；订阅与服务均支持显式释放。"
      :source="ObserverLayoutDemoSource"
      filename="ObserverLayoutDemo.vue"
    >
      <ObserverLayoutDemo />
    </DemoCard>
  </ModulePage>
</template>

