# 显式模板引用

`TemplateRef` 是不渲染内容的 Vue 组件，组件 ref 暴露 `TemplateRefHandle<C>`。它承担 Angular TemplateRef 的可复用模板来源角色，但不是 Angular 嵌入视图，也不支持 Vue 裸 `<template ref="tpl">`；无需编译器扩展。

```vue
<script setup lang="ts">
import {onBeforeUnmount, shallowRef, ref} from 'vue';
import {TemplateRef, TemplatePortal, type TemplateRefHandle} from 'vue-cdk/portal';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';

const tpl = shallowRef<TemplateRefHandle<{label: string}> | null>(null);
const count = ref(0);
const overlay = useOverlay();
let panel: OverlayRef | null = null;

/** 用户事件发生在挂载后；条件渲染时仍需检查引用是否就绪。 */
function open() {
  if (!tpl.value || panel?.hasAttached()) return;
  panel ??= overlay.create();
  panel.attach(new TemplatePortal<{label: string}>(tpl.value, {label: '计数'}));
}

/** 关闭后允许再次创建内容，内容组件的局部状态重新初始化。 */
function close() {
  panel?.detach();
}
onBeforeUnmount(() => panel?.dispose());
</script>
<template>
  <button @click="open">打开</button>
  <TemplateRef ref="tpl" v-slot="{label}">
    <button @click="count++">{{ label }}：{{ count }}</button>
    <button @click="close">关闭</button>
  </TemplateRef>
</template>
```

也可在 `onMounted` 使用引用；setup 阶段引用为空，非空断言不能替代就绪检查。作用域插槽缺省收到空对象，解构字段可能为 undefined；有必填字段时始终传入上下文。上下文可为 reactive 对象；普通对象的直接修改不触发更新。`portal.attach(outlet, context)` 覆盖当前上下文，`portal.detach()` 清空上下文；下一次挂载应重新传入需要的数据。直接调用出口 detach 保留既有出口语义，不保证清空 portal.context。

父级响应式状态、事件闭包与插槽中的组件继续工作。应用级 provide、全局组件及插件通过来源 appContext 继承；来源组件局部 provide/inject 不作保证。来源卸载会自动卸载使用该句柄的出口内容，之后再次挂载抛错。出口 detach/dispose 取消失效订阅并卸载内容；调用方仍负责 dispose 自己创建的 overlay/outlet，释放出口容器等资源。

需要直接获得 Portal 及 attach/detach 便捷方法时使用兼容的 VPortal；需要显式 `new TemplatePortal(tpl.value)` 时使用 TemplateRef；复用独立组件及其 props 时使用 ComponentPortal。原来的 `new TemplatePortal(render, context?, appContext?)` 渲染函数构造方式及 VNode 返回值继续支持。句柄接口与组件使用不同名称，避免组件定义类型与实例暴露类型混淆。

文档中的 RenderFnDialog、VNodeDialog 用来说明渲染函数和 VNode API，其 h() 应保留；动态组件及诊断内容生成也可以保留 h()。其他静态模板内容应优先采用 SFC 模板。

直接调用句柄 render 仅生成 VNode，不自动管理出口生命周期；例如桥接 dialog 渲染函数时，必须同时 subscribe 来源失效以关闭 dialog，并在 closed 时取消订阅。dialog.open 当前不直接接受句柄或 TemplatePortal。模板运行时异常遵循 Vue 的错误处理机制；未被应用错误处理器接管的首次挂载异常会向调用方抛出，出口会清理并可重试。应用错误处理器接管时遵循 Vue 自身的渲染恢复行为。
