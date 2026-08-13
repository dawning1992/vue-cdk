import {
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  ref,
  useAttrs,
  watch,
  type Component,
  type PropType,
  type Ref,
} from 'vue';
import {
  ComponentPortal,
  DomPortal,
  Portal,
  TemplatePortal,
  type PortalOutlet,
} from './portal';
import {DomPortalOutlet} from './dom-portal-outlet';

/**
 * 声明式模板源组件（对应 Angular `CdkPortal` 指令）。
 *
 * 自身不渲染任何 DOM；把默认插槽捕获为 `TemplatePortal` 的渲染函数，
 * 通过模板 ref 暴露给父级。插槽 props 即模板上下文，等价 Angular 的
 * `$implicit`；插槽内的父级响应式状态会在内容挂载后继续驱动更新。
 *
 * 用法：
 * ```vue
 * <VPortal ref="source">
 *   <template #default="{data}">{{ data }}</template>
 * </VPortal>
 * ```
 * ```ts
 * source.value.attach(outlet, {data: 'hello'}); // 或 source.value.portal.attach(...)
 * ```
 */
export const VPortal = defineComponent({
  name: 'VcdkPortal',
  setup(_props, {expose}) {
    const instance = getCurrentInstance()!;

    // 门户实例在组件生命周期内保持稳定；渲染函数每次调用时读取最新插槽，
    // 因此插槽内容即使引用父级响应式状态，也能在挂载后持续更新。
    const portal = new TemplatePortal<unknown>(
      context => {
        const slot = instance.slots.default;
        // 未提供上下文时按空对象调用插槽，符合 Vue 作用域插槽 props 约定，
        // 避免 `v-slot="{data}"` 在 undefined 上解构报错。
        return slot ? slot(context ?? {}) : null;
      },
      undefined,
      instance.appContext,
    );

    expose({
      /** 捕获的模板 Portal。 */
      portal,
      /** 便捷方法：把门户挂载到出口。 */
      attach: (outlet: PortalOutlet) => portal.attach(outlet),
      /** 便捷方法：从出口卸载。 */
      detach: () => portal.detach(),
    });

    return () => null;
  },
});

/**
 * 声明式出口组件（对应 Angular `CdkPortalOutlet` 指令）。
 *
 * 渲染一个宿主元素（`tag` 可配置，默认 div），把 `portal` prop 指向的
 * 内容挂载到宿主内；`portal` 变化时先卸载旧内容再挂载新内容，
 * 组件卸载时自动销毁出口。挂载引用经 `attached` 事件与 exposed 的
 * `attachedRef` 暴露。
 *
 * 与 Angular 的差异：Angular 把指令放在 `<ng-template>` 上、出口本身不产生
 * DOM；Vue 的 `<template>` 无法承载自定义指令，因此改为组件渲染宿主元素。
 */
export const VPortalOutlet = defineComponent({
  name: 'VcdkPortalOutlet',
  props: {
    /** 要挂载的 portal；置空时卸载当前内容。 */
    portal: {type: Object as PropType<Portal<any> | null>, default: null},
    /** 宿主元素标签，默认 div。 */
    tag: {type: String, default: 'div'},
  },
  emits: {
    /** 内容挂载完成事件，载荷为挂载引用。 */
    attached: (_ref: unknown) => true,
  },
  setup(props, {emit, expose}) {
    const attrs = useAttrs();
    const instance = getCurrentInstance()!;
    const hostRef: Ref<HTMLElement | null> = ref(null);
    let outlet: DomPortalOutlet | null = null;
    let attachedRef: unknown = null;

    /** 卸载当前内容（幂等）。 */
    const detach = (): void => {
      if (outlet?.hasAttached()) {
        outlet.detach();
        attachedRef = null;
      }
    };

    /** 挂载 portal 到宿主元素，返回挂载引用并触发 attached 事件。 */
    const attach = (portal: Portal<any>): any => {
      if (!outlet) {
        if (!hostRef.value) {
          throw Error('VPortalOutlet: 宿主元素尚未就绪，无法挂载 portal。');
        }
        outlet = new DomPortalOutlet(hostRef.value, {appContext: instance.appContext});
      }
      const ref = outlet.attach(portal);
      attachedRef = ref;
      emit('attached', ref);
      return ref;
    };

    // immediate + post：初次挂载与后续变化统一处理；post 保证宿主元素已渲染。
    watch(
      () => props.portal,
      portal => {
        detach();
        if (portal) {
          attach(portal);
        }
      },
      {immediate: true, flush: 'post'},
    );

    onBeforeUnmount(() => {
      outlet?.dispose();
      outlet = null;
      attachedRef = null;
    });

    expose({
      /** 当前挂载引用（组件实例 / VNode / DOM 元素），未挂载为 null。 */
      get attachedRef() {
        return attachedRef;
      },
      /** 当前绑定的 portal。 */
      get portal() {
        return props.portal;
      },
      /** 当前是否已有内容。 */
      hasAttached: () => outlet?.hasAttached() ?? false,
      /** 挂载 portal（与 portal prop 独立，可编程使用）。 */
      attach,
      /** 卸载当前内容。 */
      detach,
      /** 永久销毁出口（幂等）。 */
      dispose: () => {
        outlet?.dispose();
        outlet = null;
        attachedRef = null;
      },
      /** 直接挂载组件 Portal。 */
      attachComponentPortal: <T extends Component>(portal: ComponentPortal<T>) => attach(portal),
      /** 直接挂载模板 Portal。 */
      attachTemplatePortal: <C>(portal: TemplatePortal<C>) => attach(portal),
      /** 直接挂载 DOM Portal。 */
      attachDomPortal: (portal: DomPortal) => attach(portal),
    });

    return () => h(props.tag, {...attrs, ref: hostRef});
  },
});
