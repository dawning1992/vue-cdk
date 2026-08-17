<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue'; import ModulePage from '../components/ModulePage.vue'; import {apiGroups} from '../apis/stepper';
import BehaviorDemo from '../demos/stepper/BehaviorDemo.vue'; import BehaviorDemoSource from '../demos/stepper/BehaviorDemo.vue?raw';
import SingleFormDemo from '../demos/stepper/SingleFormDemo.vue'; import SingleFormDemoSource from '../demos/stepper/SingleFormDemo.vue?raw';
import PerStepFormsDemo from '../demos/stepper/PerStepFormsDemo.vue'; import PerStepFormsDemoSource from '../demos/stepper/PerStepFormsDemo.vue?raw';
import StepTypesDemo from '../demos/stepper/StepTypesDemo.vue'; import StepTypesDemoSource from '../demos/stepper/StepTypesDemo.vue?raw';
import ButtonsResetDemo from '../demos/stepper/ButtonsResetDemo.vue'; import ButtonsResetDemoSource from '../demos/stepper/ButtonsResetDemo.vue?raw';
import KeyboardDemo from '../demos/stepper/KeyboardDemo.vue'; import KeyboardDemoSource from '../demos/stepper/KeyboardDemo.vue?raw';
</script>
<template><ModulePage module-name="stepper" zh-name="步进器" intro="对齐 Angular CDK Stepper 的无样式流程协调器。Vue 版以组件和 Composition API 替代 Angular 指令，以通用 StepControl 替代 Angular Forms。" :api-groups="apiGroups">
  <DemoCard title="CdkStepper 捕获的行为与线性流程" description="线性模式检查此前步骤的有效、pending、interacted 与 optional 状态。" :source="BehaviorDemoSource" filename="BehaviorDemo.vue"><BehaviorDemo /></DemoCard>
  <DemoCard title="整个 Stepper 使用同一个表单" description="所有字段共享同一表单对象；中间按钮使用 type=button 避免提前提交。" :source="SingleFormDemoSource" filename="SingleFormDemo.vue"><SingleFormDemo /></DemoCard>
  <DemoCard title="每个步骤各自使用表单" description="每一步拥有独立 StepControl，并通过表单提交触发下一步。" :source="PerStepFormsDemoSource" filename="PerStepFormsDemo.vue"><PerStepFormsDemo /></DemoCard>
  <DemoCard title="步骤类型" description="可选步骤、不可编辑步骤和显式 completed 步骤。" :source="StepTypesDemoSource" filename="StepTypesDemo.vue"><StepTypesDemo /></DemoCard>
  <DemoCard title="步进按钮与重置" description="Next/Previous 默认按钮类型、单个 CdkStep.reset() 与整个 CdkStepper.reset()。" :source="ButtonsResetDemoSource" filename="ButtonsResetDemo.vue"><ButtonsResetDemo /></DemoCard>
  <DemoCard title="键盘交互与 RTL" description="方向键、Home/End、Enter/Space，以及水平 LTR/RTL 和垂直方向。" :source="KeyboardDemoSource" filename="KeyboardDemo.vue"><KeyboardDemo /></DemoCard>
</ModulePage></template>
