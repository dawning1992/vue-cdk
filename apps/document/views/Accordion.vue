<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/accordion';
import BasicAccordionDemo from '../demos/accordion/BasicAccordionDemo.vue';
import BasicAccordionDemoSource from '../demos/accordion/BasicAccordionDemo.vue?raw';
import MultiAccordionDemo from '../demos/accordion/MultiAccordionDemo.vue';
import MultiAccordionDemoSource from '../demos/accordion/MultiAccordionDemo.vue?raw';
import ControlledAccordionDemo from '../demos/accordion/ControlledAccordionDemo.vue';
import ControlledAccordionDemoSource from '../demos/accordion/ControlledAccordionDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="accordion"
    zh-name="手风琴"
    intro="对齐 Angular CDK accordion 的无样式展开状态协调器；提供 CdkAccordion/CdkAccordionItem 与 useAccordion/useAccordionItem，不限定视觉、动画或业务 DOM。"
    intro-en="An unstyled expansion-state coordinator aligned with Angular CDK accordion. It provides CdkAccordion/CdkAccordionItem and useAccordion/useAccordionItem without prescribing visuals, animation, or application markup."
    :api-groups="apiGroups"
  >
    <DemoCard title="基础单选与无障碍结构" title-en="Basic single selection and accessible structure" description="CDK 不替应用决定标记；示例显式连接 header、region、aria-controls、aria-labelledby 与 aria-expanded。" description-en="The CDK does not prescribe markup. This demo explicitly connects the header, region, aria-controls, aria-labelledby, and aria-expanded attributes." :source="BasicAccordionDemoSource" filename="BasicAccordionDemo.vue">
      <BasicAccordionDemo />
    </DemoCard>
    <DemoCard title="多选与批量操作" title-en="Multiple expansion and bulk actions" description="multi 允许多项展开；公开实例的 openAll/closeAll 跳过禁用项。" description-en="multi allows multiple items to remain expanded. The public openAll and closeAll methods skip disabled items." :source="MultiAccordionDemoSource" filename="MultiAccordionDemo.vue">
      <MultiAccordionDemo />
    </DemoCard>
    <DemoCard title="v-model 与命令式实例" title-en="v-model and imperative instance" description="v-model:expanded、组件公开方法和作用域插槽共享同一响应式状态；as 可替换宿主元素。" description-en="v-model:expanded, public component methods, and scoped slots share the same reactive state. Use as to replace the host element." :source="ControlledAccordionDemoSource" filename="ControlledAccordionDemo.vue">
      <ControlledAccordionDemo />
    </DemoCard>
  </ModulePage>
</template>
