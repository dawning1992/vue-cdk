# 显式模板引用

`TemplateRef` 是一个不渲染内容的 Vue 组件。通过组件 `ref` 获取 `TemplateRefHandle<C>`，再将句柄交给 `TemplatePortal`，即可显式复用一段 SFC 插槽模板。

## 示例

下面示例把模板挂载到 overlay。点击“打开”时检查组件引用是否已就绪，关闭后可以重新打开；每次重新挂载都会创建新的模板内容实例。

```vue
<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {TemplateRef, TemplatePortal, type TemplateRefHandle} from 'vue-cdk/portal';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';

const tpl = shallowRef<TemplateRefHandle<{label: string}> | null>(null);
const count = ref(0);
const overlay = useOverlay();
let panel: OverlayRef | null = null;

/** 挂载已就绪的模板；重复调用不会重复挂载内容。 */
function open(): void {
  if (!tpl.value || panel?.hasAttached()) return;
  panel ??= overlay.create();
  panel.attach(new TemplatePortal(tpl.value, {label: '计数'}));
}

/** 卸载当前模板内容，保留 overlay 以便再次打开。 */
function close(): void {
  panel?.detach();
}

onBeforeUnmount(() => panel?.dispose());
</script>

<template>
  <button type="button" @click="open">打开</button>
  <TemplateRef ref="tpl" v-slot="{label}">
    <button type="button" @click="count++">{{ label }}：{{ count }}</button>
    <button type="button" @click="close">关闭</button>
  </TemplateRef>
</template>
```

## 行为与约定

- `TemplateRef` 本身不渲染内容。Vue 裸写 `<template ref="tpl">` 不会产生模板句柄，也不需要编译器扩展。
- 组件引用在 `setup` 阶段为空；应在 `onMounted` 或挂载后的事件中检查句柄就绪。不要用非空断言替代就绪检查。
- 作用域插槽接收 `TemplatePortal` 提供的上下文，并保留父级响应式状态和事件闭包。无上下文时插槽收到空对象；上下文有必填字段时应传入完整对象。
- 上下文可以是响应式对象。普通对象属性的直接修改不会触发视图更新；`portal.attach(outlet, context)` 会覆盖当前上下文，`portal.detach()` 会清空它，因此再次挂载时应重新传入所需数据。直接调用出口的 `detach()` 沿用出口自身语义，不保证清空 `portal.context`。
- 来源组件卸载时，使用其句柄的出口内容会自动卸载，句柄随后失效；再次挂载会抛错。调用方仍需 `dispose()` 自己创建的 overlay/outlet，以释放容器等资源。
- 来源应用级 `provide/inject`、全局组件和插件会通过 `appContext` 继承；来源组件局部 `provide/inject` 不作保证。
- 原有 `new TemplatePortal(render, context?, appContext?)` 渲染函数构造方式仍然支持，也支持返回 VNode。需要直接获得 `Portal` 和 `attach`/`detach` 便捷方法时使用 `VPortal`；需要复用独立组件及其 props 时使用 `ComponentPortal`。

`TemplateRef` 是 Vue 组件，`TemplateRefHandle<C>` 是组件引用暴露的句柄接口；两者使用不同名称以避免混淆。直接调用句柄的 `render` 只生成 VNode，不负责出口生命周期。`dialog.open()` 当前不直接接受句柄或 `TemplatePortal`；若通过渲染函数桥接 dialog，需在来源失效时关闭 dialog，并在 dialog 关闭时取消订阅。

模板运行时异常遵循 Vue 错误处理机制：未被应用错误处理器接管的首次挂载异常会向调用方抛出，出口会清理并可重试；由应用错误处理器接管时，恢复行为由 Vue 决定。
