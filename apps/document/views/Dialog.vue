<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/dialog';
import ComponentDialog from '../demos/dialog/ComponentDialog.vue';
import ComponentDialogSource from '../demos/dialog/ComponentDialog.vue?raw';
import ClosedPromiseDialog from '../demos/dialog/ClosedPromiseDialog.vue';
import ClosedPromiseDialogSource from '../demos/dialog/ClosedPromiseDialog.vue?raw';
import ConfirmContentSource from '../demos/dialog/ConfirmContent.vue?raw';
import TemplateRefDialog from '../demos/dialog/TemplateRefDialog.vue';
import TemplateRefDialogSource from '../demos/dialog/TemplateRefDialog.vue?raw';
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
import AppDialogDemo from '../demos/dialog/app-dialog/AppDialogDemo.vue';
import AppDialogDemoSource from '../demos/dialog/app-dialog/AppDialogDemo.vue?raw';
import UseAppDialogSource from '../demos/dialog/app-dialog/useAppDialog.ts?raw';
import ConfirmDialogSource from '../demos/dialog/app-dialog/ConfirmDialog.vue?raw';
import AppDialogTitleSource from '../demos/dialog/app-dialog/AppDialogTitle.vue?raw';
import AppDialogContentSource from '../demos/dialog/app-dialog/AppDialogContent.vue?raw';
import AppDialogActionsSource from '../demos/dialog/app-dialog/AppDialogActions.vue?raw';
import BuiltinDialogAnimationDemo from '../demos/dialog/BuiltinDialogAnimationDemo.vue';
import BuiltinDialogAnimationDemoSource from '../demos/dialog/BuiltinDialogAnimationDemo.vue?raw';
import DrawerDialogDemo from '../demos/dialog/DrawerDialogDemo.vue';
import DrawerDialogDemoSource from '../demos/dialog/DrawerDialogDemo.vue?raw';
import DrawerDialogContentSource from '../demos/dialog/DrawerDialogContent.vue?raw';
import DialogAnimationDemo from '../demos/dialog/DialogAnimationDemo.vue';
import DialogAnimationDemoSource from '../demos/dialog/DialogAnimationDemo.vue?raw';
import AnimatedConfirmDialogSource from '../demos/dialog/AnimatedConfirmDialog.vue?raw';
import AnimatedAppDialogSource from '../demos/dialog/useAnimatedAppDialog.ts?raw';
import CreateOriginAnimationSource from '../demos/dialog/createOriginAnimation.ts?raw';
</script>

<template>
  <ModulePage
    module-name="dialog"
    zh-name="对话框"
    intro="模态对话框：命令式 useDialog() 打开组件、TemplateRef、渲染函数或 VNode 内容；DialogRef 携带关闭结果与事件流，焦点陷阱、autoFocus / restoreFocus、ARIA 与滚动锁定由内置容器完成；多个对话框共享唯一遮罩，由服务统一管理 z-index 栈（后开对话框的遮罩遮住下层窗口，关闭顶层后下一层浮出）。"
    intro-en="Modal dialogs opened imperatively with useDialog() can render components, TemplateRef handles, render functions, or VNodes. DialogRef provides close results and event streams; the built-in container handles focus trapping, autoFocus / restoreFocus, ARIA, and scroll locking. Dialogs share one backdrop and a managed z-index stack."
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
      title="内置弹窗动画"
      title-en="Built-in dialog animations"
      description="animation 可选 fade、scale、slide-up、slide-down，并可分别配置进退场时长与缓动。默认不启用窗口动画；animation: false 可覆盖全局默认值。disableAnimations 或系统减少动态效果设置会跳过窗口与遮罩动画。"
      description-en="Choose fade, scale, slide-up, or slide-down and configure enter/leave duration and easing. Window animation is opt-in; animation: false overrides global defaults. disableAnimations and reduced-motion preferences skip both window and backdrop animations."
      :source="BuiltinDialogAnimationDemoSource"
      filename="BuiltinDialogAnimationDemo.vue"
    >
      <BuiltinDialogAnimationDemo />
    </DemoCard>

    <DemoCard
      title="侧滑抽屉窗口"
      title-en="Sliding drawer dialog"
      description="通过 positionStrategy 将全高抽屉固定在左右侧边，使用自定义 animation 钩子滑入与滑出；正文独立滚动，支持遮罩、ESC 关闭与焦点恢复，并遵循系统减少动态效果设置。"
      description-en="Pin a full-height drawer to either side with positionStrategy and slide it in and out with custom animation hooks. Content scrolls independently; backdrop dismissal, Escape, focus restoration, and reduced-motion preferences are supported."
      :source="DrawerDialogDemoSource"
      filename="DrawerDialogDemo.vue"
      :extra-sources="[{filename: 'DrawerDialogContent.vue', code: DrawerDialogContentSource}]"
    >
      <DrawerDialogDemo />
    </DemoCard>

    <DemoCard
      title="TemplateRef 模板对话框"
      title-en="TemplateRef dialog"
      description="把 portal 的 TemplateRef 句柄直接传入 open；插槽接收 $implicit（data）、dialogRef 与 templateContext，保留响应式状态。来源卸载时立即销毁对话框，跳过关闭谓词和动画；继承来源应用上下文，不保证来源局部 provide。"
      description-en="Pass a portal TemplateRef handle directly to open. The slot receives $implicit (data), dialogRef, and templateContext and retains reactive state. Source unmount immediately destroys the dialog, bypassing close predicates and animations. Source app context is inherited; local provides are not guaranteed."
      :source="TemplateRefDialogSource"
      filename="TemplateRefDialog.vue"
    >
      <TemplateRefDialog />
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

    <DemoCard
      title="项目最佳实践：封装 AppDialog"
      title-en="Project best practice: wrap AppDialog"
      description="用 useAppDialog() 统一面板样式和尺寸默认值，调用方仍可覆盖配置；确认内容保持为独立 SFC，并用标题、正文、操作区组件组织布局。"
      description-en="Use useAppDialog() to centralize panel styling and default dimensions while allowing per-call overrides. Keep confirmation content in an SFC and compose it from title, content, and actions components."
      :source="AppDialogDemoSource"
      filename="AppDialogDemo.vue"
      :extra-sources="[
        {filename: 'useAppDialog.ts', code: UseAppDialogSource, lang: 'ts'},
        {filename: 'ConfirmDialog.vue', code: ConfirmDialogSource},
        {filename: 'AppDialogTitle.vue', code: AppDialogTitleSource},
        {filename: 'AppDialogContent.vue', code: AppDialogContentSource},
        {filename: 'AppDialogActions.vue', code: AppDialogActionsSource},
      ]"
    >
      <AppDialogDemo />
    </DemoCard>

    <DemoCard
      title="项目最佳实践：自定义弹窗动画"
      title-en="Project best practice: custom dialog animation"
      description="通过可复用工厂 createOriginAnimation(x, y) 创建动画配置，直接赋给 animation；项目级封装同样复用该工厂，支持传入点击事件或视口坐标。弹窗从起点淡入放大至屏幕中央，关闭时淡出缩小回到起点；通过 animation.enter/leave 返回 Animation，由库等待 finished；也可返回由真实动画结束事件结算的 Promise，不能用定时器模拟完成。ESC、遮罩、内容按钮及 closeAll 复用同一生命周期；最后一个窗口与遮罩同步退场，closedPromise 在窗口动画完成后回传结果。"
      description-en="Use createOriginAnimation(x, y) as the animation config. The project wrapper reuses this factory and accepts a click event or viewport point; the dialog expands from that origin and shrinks back when closed, through animation.enter/leave hooks returning an Animation or a Promise settled by real animation events, never a timer. ESC, backdrop, buttons and closeAll share this lifecycle. The last window and backdrop leave together; closedPromise resolves after the window animation finishes."
      :source="DialogAnimationDemoSource"
      filename="DialogAnimationDemo.vue"
      :extra-sources="[
        {filename: 'createOriginAnimation.ts', code: CreateOriginAnimationSource, lang: 'ts'},
        {filename: 'useAnimatedAppDialog.ts', code: AnimatedAppDialogSource, lang: 'ts'},
        {filename: 'AnimatedConfirmDialog.vue', code: AnimatedConfirmDialogSource},
      ]"
    >
      <DialogAnimationDemo />
    </DemoCard>
  </ModulePage>
</template>
