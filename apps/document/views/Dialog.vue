<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/dialog';
import ComponentDialog from '../demos/dialog/ComponentDialog.vue';
import ComponentDialogSource from '../demos/dialog/ComponentDialog.vue?raw';
import ClosedPromiseDialog from '../demos/dialog/ClosedPromiseDialog.vue';
import ClosedPromiseDialogSource from '../demos/dialog/ClosedPromiseDialog.vue?raw';
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
    intro="模态对话框：命令式 useDialog() 打开组件、渲染函数或 VNode 内容；DialogRef 携带关闭结果与事件流，焦点陷阱、autoFocus / restoreFocus、ARIA 与滚动锁定由内置容器完成；多个对话框共享唯一遮罩，由服务统一管理 z-index 栈（后开对话框的遮罩遮住下层窗口，关闭顶层后下一层浮出）。"
    intro-en="Modal dialogs opened imperatively with useDialog() can render components, render functions, or VNodes. DialogRef provides close results and event streams; the built-in container handles focus trapping, autoFocus / restoreFocus, ARIA, and scroll locking. Dialogs share one backdrop and a managed z-index stack."
    :api-groups="apiGroups"
  >
    <DemoCard
      title="组件对话框（useDialog + useDialogData）"
      title-en="Component dialog (useDialog + useDialogData)"
      description="以 SFC 作为内容，数据经 useDialogData 注入、关闭经 useDialogRef，结果通过 closed 流回传打开方。"
      description-en="Uses an SFC as content, injects data with useDialogData, closes through useDialogRef, and returns the result through the closed stream."
      :source="ComponentDialogSource"
      filename="ComponentDialog.vue"
      :extra-sources="[{filename: 'ConfirmContent.vue', code: ConfirmContentSource}]"
    >
      <ComponentDialog />
    </DemoCard>

    <DemoCard
      title="使用 closedPromise 等待关闭结果"
      title-en="Awaiting close results with closedPromise"
      description="open() 仍立即返回 DialogRef，可先读取 id 或调用实例方法；await dialogRef.closedPromise 会在成功关闭后取得 close(result) 传回的结果。"
      description-en="open() still returns DialogRef immediately, so its id and methods are available at once; await dialogRef.closedPromise to receive the result passed to close(result)."
      :source="ClosedPromiseDialogSource"
      filename="ClosedPromiseDialog.vue"
      :extra-sources="[{filename: 'ConfirmContent.vue', code: ConfirmContentSource}]"
    >
      <ClosedPromiseDialog />
    </DemoCard>

    <DemoCard
      title="渲染函数对话框"
      title-en="Render-function dialog"
      description="渲染函数等价 Angular 的 TemplateRef：上下文包含 $implicit（data）与 dialogRef，无需额外文件即可定义内容。"
      description-en="A render function acts like Angular TemplateRef: its context includes $implicit (data) and dialogRef, so content needs no extra file."
      :source="RenderFnDialogSource"
      filename="RenderFnDialog.vue"
    >
      <RenderFnDialog />
    </DemoCard>

    <DemoCard
      title="VNode 对话框与数据通道"
      title-en="VNode dialog and data channels"
      description="VNode 内容经 h() 创建；data 通过 DIALOG_DATA / useDialogData 注入，contentProps 提供 Vue 特有 props 通道，templateContext 合并进渲染函数上下文。"
      description-en="Creates VNode content with h(); data is injected through DIALOG_DATA/useDialogData, contentProps provides Vue-specific props, and templateContext extends the render-function context."
      :source="VNodeDialogSource"
      filename="VNodeDialog.vue"
    >
      <VNodeDialog />
    </DemoCard>

    <DemoCard
      title="对话框配置项面板"
      title-en="Dialog configuration panel"
      description="勾选与输入驱动 DialogConfig：disableClose、closePredicate（阻止取消并重捕获焦点）、autoFocus / restoreFocus、role、ariaModal、宽高与 panelClass。"
      description-en="Controls DialogConfig with form inputs: disableClose, closePredicate (blocks cancellation and recaptures focus), autoFocus/restoreFocus, role, ariaModal, dimensions, and panelClass."
      :source="DialogConfigDemoSource"
      filename="DialogConfigDemo.vue"
      :extra-sources="[{filename: 'ConfigContent.vue', code: ConfigContentSource}]"
    >
      <DialogConfigDemo />
    </DemoCard>

    <DemoCard
      title="多对话框：共享遮罩与 z-index 窗口管理"
      title-en="Multiple dialogs: shared backdrop and z-index management"
      description="从对话框 A 内继续打开 B、从 B 内打开无遮罩的 C，三层对话框按阶梯错开排布、互不遮挡，逐层观察 LIFO 关闭顺序与唯一共享遮罩：后开对话框的遮罩插在两层窗口之间并遮住下层，关闭顶层后遮罩 z-index 回落、下一层浮出；每层对话框内都有实时层级读条，并演示 openDialogs、getDialogById、closeAll 与 afterOpened / afterAllClosed 事件流。"
      description-en="Open B from dialog A and backdrop-free C from B. The three dialogs are offset for visibility; observe LIFO closing and the single shared backdrop inserted between windows, plus live z-index readouts and openDialogs, getDialogById, closeAll, afterOpened, and afterAllClosed."
      :source="DialogStackDemoSource"
      filename="DialogStackDemo.vue"
    >
      <DialogStackDemo />
    </DemoCard>

    <DemoCard
      title="自定义容器（useDialogContainerCore）"
      title-en="Custom container (useDialogContainerCore)"
      description="通过 config.container 传入自定义容器组件，复用 useDialogContainerCore 获得焦点陷阱、ARIA 状态、数据注入与焦点恢复；内容与关闭结果通道不变。"
      description-en="Pass a custom container component through config.container and reuse useDialogContainerCore for focus trapping, ARIA state, data injection, and focus restoration while keeping content and close-result channels unchanged."
      :source="CustomContainerDialogSource"
      filename="CustomContainerDialog.vue"
      :extra-sources="[{filename: 'CustomContainer.vue', code: CustomContainerSource}]"
    >
      <CustomContainerDialog />
    </DemoCard>
  </ModulePage>
</template>
