<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/dialog';
import ComponentDialog from '../demos/dialog/ComponentDialog.vue';
import ComponentDialogSource from '../demos/dialog/ComponentDialog.vue?raw';
import ConfirmContentSource from '../demos/dialog/ConfirmContent.vue?raw';
import RenderFnDialog from '../demos/dialog/RenderFnDialog.vue';
import RenderFnDialogSource from '../demos/dialog/RenderFnDialog.vue?raw';
import VNodeDialog from '../demos/dialog/VNodeDialog.vue';
import VNodeDialogSource from '../demos/dialog/VNodeDialog.vue?raw';
import ConfigContentSource from '../demos/dialog/ConfigContent.vue?raw';
import DialogConfigDemo from '../demos/dialog/DialogConfigDemo.vue';
import DialogConfigDemoSource from '../demos/dialog/DialogConfigDemo.vue?raw';
import DialogStackDemo from '../demos/dialog/DialogStackDemo.vue';
import DialogStackDemoSource from '../demos/dialog/DialogStackDemo.vue?raw';
import CustomContainerDialog from '../demos/dialog/CustomContainerDialog.vue';
import CustomContainerDialogSource from '../demos/dialog/CustomContainerDialog.vue?raw';
import CustomContainerSource from '../demos/dialog/CustomContainer.vue?raw';
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

    <DemoCard
      title="VNode 对话框与数据通道"
      description="VNode 内容经 h() 创建；data 通过 DIALOG_DATA / useDialogData 注入，contentProps 提供 Vue 特有 props 通道，templateContext 合并进渲染函数上下文。"
      :source="VNodeDialogSource"
      filename="VNodeDialog.vue"
    >
      <VNodeDialog />
    </DemoCard>

    <DemoCard
      title="对话框配置项面板"
      description="勾选与输入驱动 DialogConfig：disableClose、closePredicate（阻止取消并重捕获焦点）、autoFocus / restoreFocus、role、ariaModal、宽高与 panelClass。"
      :source="DialogConfigDemoSource"
      filename="DialogConfigDemo.vue"
      :extra-sources="[{filename: 'ConfigContent.vue', code: ConfigContentSource}]"
    >
      <DialogConfigDemo />
    </DemoCard>

    <DemoCard
      title="多对话框与服务级 API"
      description="连续打开两个对话框观察 LIFO 关闭顺序；演示 openDialogs、getDialogById、closeAll 与 afterOpened / afterAllClosed 事件流。"
      :source="DialogStackDemoSource"
      filename="DialogStackDemo.vue"
    >
      <DialogStackDemo />
    </DemoCard>

    <DemoCard
      title="自定义容器（useDialogContainerCore）"
      description="通过 config.container 传入自定义容器组件，复用 useDialogContainerCore 获得焦点陷阱、ARIA 状态、数据注入与焦点恢复；内容与关闭结果通道不变。"
      :source="CustomContainerDialogSource"
      filename="CustomContainerDialog.vue"
      :extra-sources="[{filename: 'CustomContainer.vue', code: CustomContainerSource}]"
    >
      <CustomContainerDialog />
    </DemoCard>
  </ModulePage>
</template>
