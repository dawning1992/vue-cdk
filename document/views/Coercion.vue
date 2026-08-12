<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/coercion';
import CoercionDemo from '../demos/coercion/CoercionDemo.vue';
import CoercionDemoSource from '../demos/coercion/CoercionDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="coercion"
    zh-name="强制转换"
    intro="类型/值强制转换工具，语义与 Angular CDK 的 coercion 一致：把单个值或数组统一为数组、数字与 CSS 像素值互转、把元素与其 ref 归一为元素。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="转换函数交互演示"
      description="点击按钮运行 coerceArray / coerceCssPixelValue / coerceElement，查看三种典型输入的结果；空 ref 场景展示异常行为。"
      :source="CoercionDemoSource"
      filename="CoercionDemo.vue"
    >
      <CoercionDemo />
    </DemoCard>
  </ModulePage>
</template>
