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
    intro-en="Provides Angular CDK-compatible Breakpoints, MediaMatcher, and BreakpointObserver, plus the reactive Vue Composition API entry point useBreakpoints. Supports SSR, dependency injection, and automatic cleanup."
    :api-groups="apiGroups"
  >
    <DemoCard
      title="Composition API 响应式布局"
      title-en="Responsive layout with the Composition API"
      description="useBreakpoints 将一个或多个媒体查询转换为只读 ref；组件销毁时自动退订。示例同时使用标准 Handset 与 Large/XLarge 断点。"
      description-en="useBreakpoints turns one or more media queries into read-only refs and unsubscribes when the component is destroyed. The demo uses the Handset and Large/XLarge presets."
      :source="ResponsiveLayoutDemoSource"
      filename="ResponsiveLayoutDemo.vue"
    >
      <ResponsiveLayoutDemo />
    </DemoCard>
    <DemoCard
      title="BreakpointObserver 命令式观察"
      title-en="Imperative observation with BreakpointObserver"
      description="保留 Angular CDK 的 observe(...).subscribe(...) 设计，适合 store、服务和组件外逻辑；订阅与服务均支持显式释放。"
      description-en="Keeps Angular CDK's observe(...).subscribe(...) shape for stores, services, and logic outside components. Both subscriptions and the observer can be explicitly disposed."
      :source="ObserverLayoutDemoSource"
      filename="ObserverLayoutDemo.vue"
    >
      <ObserverLayoutDemo />
    </DemoCard>
  </ModulePage>
</template>

