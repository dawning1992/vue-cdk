import {defineComponent, getCurrentInstance, onBeforeUnmount, type AppContext} from 'vue';
import type {TemplateRenderFn} from './portal';

/**
 * TemplateRef 暴露的模板句柄；请在 onMounted 或模板 ref 非空后使用。
 * 插槽缺省上下文为空对象；只继承应用上下文，不保证来源组件局部 provide。
 * 来源卸载时通知所有使用方卸载内容，之后调用 render 或 subscribe 均抛错。
 */
export interface TemplateRefHandle<C = unknown> {
  /** 每次调用生成独立内容，保留插槽闭包中的响应式状态和事件。 */
  readonly render: TemplateRenderFn<C>;
  /** 来源应用上下文。 */
  readonly appContext: AppContext;
  /**
   * 注册来源失效回调；来源 onBeforeUnmount 时同步调用，回调应幂等且不抛错。
   * 返回幂等的取消订阅函数，使用方卸载时必须调用，避免保留出口引用。
   * 来源已卸载时抛错；TemplatePortal 与 DomPortalOutlet 自动管理此订阅。
   */
  subscribe(dispose: () => void): () => void;
}

/** @internal 在来源 setup 内捕获插槽；来源卸载后句柄永久失效。 */
export function captureTemplate(): TemplateRefHandle {
  const instance = getCurrentInstance()!;
  let active = true;
  const listeners = new Set<() => void>();
  /** 防止已卸载来源的闭包再次创建组件。 */
  const assertActive = () => {
    if (!active) throw Error('TemplateRef 来源已卸载，不能再次挂载。');
  };
  onBeforeUnmount(() => {
    active = false;
    for (const dispose of listeners) dispose();
    listeners.clear();
  });
  return {
    appContext: instance.appContext,
    render: context => {
      assertActive();
      return instance.slots.default?.(context ?? {}) ?? null;
    },
    subscribe: dispose => {
      assertActive();
      listeners.add(dispose);
      return () => { listeners.delete(dispose); };
    },
  };
}

/**
 * 显式可复用模板源，自身不渲染内容；通过 ref 暴露 TemplateRefHandle。
 * 对应 Angular 模板引用的用途，Vue 裸 template ref 不支持此契约。
 * 默认插槽接收上下文对象；字段类型由调用方 TemplateRefHandle<C> 契约声明。
 * 推荐 shallowRef<TemplateRefHandle<C> | null>(null)，检查非空后传给 TemplatePortal。
 * 来源卸载自动卸载所有使用中的内容；调用方仍需 dispose 自建出口或 overlay。
 */
export const TemplateRef = defineComponent({
  name: 'VcdkTemplateRef',
  setup(_props, {expose}) {
    expose(captureTemplate());
    return () => null;
  },
});
