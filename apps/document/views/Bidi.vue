<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/bidi';
import GlobalDirectionalityDemo from '../demos/bidi/GlobalDirectionalityDemo.vue';
import GlobalDirectionalityDemoSource from '../demos/bidi/GlobalDirectionalityDemo.vue?raw';
import NestedDirectionDemo from '../demos/bidi/NestedDirectionDemo.vue';
import NestedDirectionDemoSource from '../demos/bidi/NestedDirectionDemo.vue?raw';
import AutoDirectionDemo from '../demos/bidi/AutoDirectionDemo.vue';
import AutoDirectionDemoSource from '../demos/bidi/AutoDirectionDemo.vue?raw';
import ProvideDirectionalityDemo from '../demos/bidi/ProvideDirectionalityDemo.vue';
import ProvideDirectionalityDemoSource from '../demos/bidi/ProvideDirectionalityDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="bidi"
    zh-name="文字方向"
    intro="对齐 Angular CDK bidi 的方向上下文与局部覆盖；以 VDir 组件弥补 Vue 指令不能向后代 provide 的平台差异。"
    :api-groups="apiGroups"
  >
    <DemoCard title="方向上下文" description="useDirectionality 返回响应式 Directionality；setDirection 可更新由调用方管理的上下文。" :source="GlobalDirectionalityDemoSource" filename="GlobalDirectionalityDemo.vue">
      <GlobalDirectionalityDemo />
    </DemoCard>
    <DemoCard title="嵌套局部方向" description="VDir 向后代提供最近方向，支持动态输入和 dirChange。" :source="NestedDirectionDemoSource" filename="NestedDirectionDemo.vue">
      <NestedDirectionDemo />
    </DemoCard>
    <DemoCard title="auto 与非法输入" description="原始 DOM 属性保持不变，注入上下文始终归一化为 ltr 或 rtl。" :source="AutoDirectionDemoSource" filename="AutoDirectionDemo.vue">
      <AutoDirectionDemo />
    </DemoCard>
    <DemoCard title="自定义 Composition provider" description="provideDirectionality 可构建 Fragment 或业务组件，不强制额外宿主元素。" :source="ProvideDirectionalityDemoSource" filename="ProvideDirectionalityDemo.vue">
      <ProvideDirectionalityDemo />
    </DemoCard>
  </ModulePage>
</template>
