<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/coercion';
import CoercionDemo from '../demos/coercion/CoercionDemo.vue';
import CoercionDemoSource from '../demos/coercion/CoercionDemo.vue?raw';
import CoercionInPracticeDemo from '../demos/coercion/CoercionInPracticeDemo.vue';
import CoercionInPracticeDemoSource from '../demos/coercion/CoercionInPracticeDemo.vue?raw';
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
      description="点击按钮运行 coerceArray / coerceCssPixelValue / coerceElement，覆盖数字、负数、百分比、auto、空值与空 ref 等边界输入。"
      :source="CoercionDemoSource"
      filename="CoercionDemo.vue"
    >
      <CoercionDemo />
    </DemoCard>

    <DemoCard
      title="实战用法"
      description="把转换函数用于真实场景：number | string 尺寸归一为样式、string | string[] props 归一渲染标签、模板 ref 经 coerceElement 交给逻辑。"
      :source="CoercionInPracticeDemoSource"
      filename="CoercionInPracticeDemo.vue"
    >
      <CoercionInPracticeDemo />
    </DemoCard>
  </ModulePage>
</template>
