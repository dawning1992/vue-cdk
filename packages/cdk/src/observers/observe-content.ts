import type {ComponentPublicInstance, Directive, DirectiveBinding} from 'vue';
import {
  CDK_CONTENT_OBSERVER,
  contentObserver,
  type ContentObserver,
  type ContentObserverSubscription,
} from './content-observer';

/** v-cdk-observe-content 的完整对象绑定。 */
export interface CdkObserveContentOptions {
  /** 每批有效 DOM 变更的回调。 */
  callback(records: MutationRecord[]): void;
  /** 是否断开底层观察器，默认 false。 */
  disabled?: boolean;
  /** 回调防抖毫秒数，默认 0；非有限值与负数按 0 处理。 */
  debounce?: number;
  /** 自定义 ContentObserver；缺省使用模块级单例。 */
  observer?: ContentObserver;
}

/** 指令绑定值：回调简写或包含 disabled/debounce 的完整配置。 */
export type CdkObserveContentValue =
  | ((records: MutationRecord[]) => void)
  | CdkObserveContentOptions;

interface DirectiveState {
  value: CdkObserveContentOptions;
  subscription: ContentObserverSubscription | null;
  timer: ReturnType<typeof setTimeout> | null;
  observer: ContentObserver;
}

const states = new WeakMap<Element, DirectiveState>();

function normalize(value: CdkObserveContentValue): CdkObserveContentOptions {
  return typeof value === 'function' ? {callback: value} : value;
}

function unsubscribe(state: DirectiveState): void {
  state.subscription?.unsubscribe();
  state.subscription = null;
  if (state.timer !== null) clearTimeout(state.timer);
  state.timer = null;
}

function resolveObserver(binding: DirectiveBinding<CdkObserveContentValue>): ContentObserver {
  const value = normalize(binding.value);
  if (value.observer) return value.observer;
  // 指令钩子不能调用 inject；从宿主组件实例读取其继承后的 provides，语义等同 setup 内注入。
  const instance = binding.instance as ComponentPublicInstance | null;
  const internal = instance?.$ as unknown as {
    provides?: Record<PropertyKey, unknown>;
    appContext?: {provides: Record<PropertyKey, unknown>};
  } | undefined;
  return (internal?.provides?.[CDK_CONTENT_OBSERVER as symbol]
    ?? internal?.appContext?.provides[CDK_CONTENT_OBSERVER as symbol]
    ?? contentObserver) as ContentObserver;
}

function subscribe(element: Element, state: DirectiveState): void {
  unsubscribe(state);
  if (state.value.disabled) return;
  state.subscription = state.observer.observe(element).subscribe(records => {
    const delay = Number.isFinite(Number(state.value.debounce))
      ? Math.max(0, Number(state.value.debounce))
      : 0;
    if (!delay) {
      state.value.callback(records);
      return;
    }
    if (state.timer !== null) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.timer = null;
      state.value.callback(records);
    }, delay);
  });
}

/**
 * 内容变化指令，对应 Angular cdkObserveContent。
 *
 * 模板中使用 `v-cdk-observe-content="callback"`，或传入包含 callback、disabled、debounce
 * 的对象。宿主卸载、禁用或配置切换时会清理订阅及待执行定时器。
 */
export const vCdkObserveContent: Directive<Element, CdkObserveContentValue> = {
  mounted(element, binding) {
    const state: DirectiveState = {
      value: normalize(binding.value),
      subscription: null,
      timer: null,
      observer: resolveObserver(binding),
    };
    states.set(element, state);
    subscribe(element, state);
  },
  updated(element, binding: DirectiveBinding<CdkObserveContentValue>) {
    const state = states.get(element);
    if (!state) return;
    const previous = state.value;
    state.value = normalize(binding.value);
    const nextObserver = resolveObserver(binding);
    if (
      previous.disabled !== state.value.disabled ||
      previous.debounce !== state.value.debounce ||
      state.observer !== nextObserver
    ) {
      state.observer = nextObserver;
      subscribe(element, state);
    }
  },
  beforeUnmount(element) {
    const state = states.get(element);
    if (!state) return;
    unsubscribe(state);
    states.delete(element);
  },
};

/** 与 Angular 导出名一致的别名；Vue 模板仍以 v-cdk-observe-content 使用。 */
export const cdkObserveContent = vCdkObserveContent;
