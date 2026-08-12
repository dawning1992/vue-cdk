<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/dialog';
import ComponentDialog from '../demos/dialog/ComponentDialog.vue';
import ComponentDialogSource from '../demos/dialog/ComponentDialog.vue?raw';
import ConfirmContentSource from '../demos/dialog/ConfirmContent.vue?raw';
import RenderFnDialog from '../demos/dialog/RenderFnDialog.vue';
import RenderFnDialogSource from '../demos/dialog/RenderFnDialog.vue?raw';
</script>

<template>
  <ModulePage
    module-name="dialog"
    zh-name="对话框"
    intro="模态对话框：命令式 useDialog() 打开组件、渲染函数或 VNode 内容；DialogRef 携带关闭结果与事件流，焦点陷阱、autoFocus / restoreFocus、ARIA 与滚动锁定由内置容器完成。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="组件对话框（useDialog + useDialogData）"
      description="以 SFC 作为内容，数据经 useDialogData 注入、关闭经 useDialogRef，结果通过 closed 流回传打开方。"
      :source="ComponentDialogSource"
      filename="ComponentDialog.vue"
      :extra-sources="[{filename: 'ConfirmContent.vue', code: ConfirmContentSource}]"
    >
      <ComponentDialog />
    </DemoCard>

    <DemoCard
      title="渲染函数对话框"
      description="渲染函数等价 Angular 的 TemplateRef：上下文包含 $implicit（data）与 dialogRef，无需额外文件即可定义内容。"
      :source="RenderFnDialogSource"
      filename="RenderFnDialog.vue"
    >
      <RenderFnDialog />
    </DemoCard>
  </ModulePage>
</template>
