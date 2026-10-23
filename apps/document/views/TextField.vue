<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/text-field';
import TextareaAutosizeDemo from '../demos/text-field/TextareaAutosizeDemo.vue';
import TextareaAutosizeDemoSource from '../demos/text-field/TextareaAutosizeDemo.vue?raw';
import AutofillMonitorDemo from '../demos/text-field/AutofillMonitorDemo.vue';
import AutofillMonitorDemoSource from '../demos/text-field/AutofillMonitorDemo.vue?raw';
import AutofillStyleDemo from '../demos/text-field/AutofillStyleDemo.vue';
import AutofillStyleDemoSource from '../demos/text-field/AutofillStyleDemo.vue?raw';

const sassExample = `@use 'vue-cdk/text-field/index' as text-field;

@include text-field.text-field-autofill();

input.custom-autofill {
  @include text-field.text-field-autofill-color(#ccfbf1, #134e4a);
}`;

</script>

<template>
  <ModulePage
    module-name="text-field"
    zh-name="文本字段"
    intro="对齐 Angular CDK text-field：通过 Composition API、控制器和指令实现 textarea 自动伸缩，并使用 CSS animation 探针监控 Chromium/WebKit 自动填充状态。模块可在 SSR 中安全导入。"
    intro-en="Aligned with Angular CDK text-field: textarea autosizing is provided through the Composition API, a controller, and a directive, while a CSS animation probe monitors Chromium/WebKit autofill state. The module is safe to import during SSR."
    :api-groups="apiGroups"
  >
    <DemoCard title="自动调整 textarea 大小" title-en="Autosize a textarea" description="响应 v-model、最小/最大行数和启停状态；适配中文等输入法，组合输入期间暂停测量并在选词完成后统一重算。样式变化后可 force 强制重算。" description-en="Responds to v-model, minimum/maximum rows, and enabled state. Supports IME input by pausing measurement during composition and recalculating afterward; pass force to recalculate after style changes." :source="TextareaAutosizeDemoSource" filename="TextareaAutosizeDemo.vue">
      <TextareaAutosizeDemo />
    </DemoCard>
    <DemoCard title="监控 input 自动填充" title-en="Monitor input autofill" description="标准 username/current-password 表单分别监控两个字段。真实自动填充要求密码管理器已为当前域名保存凭据；示例不会伪造或预置用户凭据，按钮仅模拟同一 CSS 探针事件用于调试。" description-en="A standard username/current-password form monitors both fields. Real autofill requires credentials saved for this domain in the browser password manager. The demo does not fabricate or preload credentials; buttons simulate the same CSS probe event for debugging." :source="AutofillMonitorDemoSource" filename="AutofillMonitorDemo.vue">
      <AutofillMonitorDemo />
    </DemoCard>
    <DemoCard title="设置自动填充样式" title-en="Style autofilled fields" description="可直接组合 CDK 状态类与 :-webkit-autofill；使用 Sass 时可调用 text-field-autofill-color mixin。" description-en="Combine the CDK state class with :-webkit-autofill directly, or use the text-field-autofill-color mixin with Sass." :source="AutofillStyleDemoSource" filename="AutofillStyleDemo.vue" :extra-sources="[{filename: 'autofill.scss', code: sassExample}]">
      <AutofillStyleDemo />
    </DemoCard>
  </ModulePage>
</template>
