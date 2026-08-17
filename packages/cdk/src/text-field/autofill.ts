import {
  inject,
  onScopeDispose,
  provide,
  readonly,
  ref,
  shallowRef,
  watch,
  type InjectionKey,
  type Ref,
} from 'vue';
import {injectTextFieldStyles} from './style-inject';

/** input/textarea 的浏览器自动填充状态变化事件。 */
export interface AutofillEvent {
  /** 状态发生变化的元素。 */
  target: Element;
  /** true 表示浏览器已自动填充，false 表示自动填充状态结束。 */
  isAutofilled: boolean;
}

/** 自动填充事件观察者，与 Angular Observable 的 next/complete 调用形态兼容。 */
export interface AutofillObserver {
  next?(event: AutofillEvent): void;
  complete?(): void;
}

/** 自动填充事件订阅句柄；unsubscribe 可重复调用。 */
export interface AutofillSubscription {
  readonly closed: boolean;
  unsubscribe(): void;
}

/** AutofillMonitor.monitor 返回的轻量事件流。 */
export interface AutofillStream {
  subscribe(observer: ((event: AutofillEvent) => void) | AutofillObserver): AutofillSubscription;
}

interface MonitoredElementInfo {
  listeners: Set<(event: AutofillEvent) => void>;
  completions: Set<() => void>;
  unlisten: () => void;
}

const AUTOFILLED_CLASS = 'cdk-text-field-autofilled';
const MONITORED_CLASS = 'cdk-text-field-autofill-monitored';
const PASSIVE_LISTENER: AddEventListenerOptions = {passive: true};

/**
 * 自动填充监控服务，对应 Angular CDK AutofillMonitor。
 *
 * 实现依赖 `:-webkit-autofill` 触发的 CSS animationstart，因此主要支持 Chromium/WebKit；
 * Firefox 等不触发该探针的浏览器不会产生事件。一个实例会为同一元素共享原生监听器。
 */
export class AutofillMonitor {
  private readonly _elements = new Map<Element, MonitoredElementInfo>();
  private _destroyed = false;

  /** 开始监控元素并返回可订阅事件流；SSR 或已销毁实例返回立即完成的空流。 */
  monitor(element: Element): AutofillStream {
    if (this._destroyed || typeof document === 'undefined') return completedStream();
    injectTextFieldStyles();
    let info = this._elements.get(element);
    if (!info) {
      const listeners = new Set<(event: AutofillEvent) => void>();
      const completions = new Set<() => void>();
      const handler = (nativeEvent: Event): void => {
        const animationEvent = nativeEvent as AnimationEvent;
        const starts = animationEvent.animationName === 'cdk-text-field-autofill-start';
        const ends = animationEvent.animationName === 'cdk-text-field-autofill-end';
        if ((starts && element.classList.contains(AUTOFILLED_CLASS)) ||
            (ends && !element.classList.contains(AUTOFILLED_CLASS))) return;
        if (!starts && !ends) return;
        element.classList.toggle(AUTOFILLED_CLASS, starts);
        const event = {target: animationEvent.target as Element ?? element, isAutofilled: starts};
        for (const listener of [...listeners]) listener(event);
      };
      element.classList.add(MONITORED_CLASS);
      element.addEventListener('animationstart', handler, PASSIVE_LISTENER);
      info = {
        listeners,
        completions,
        unlisten: () => element.removeEventListener('animationstart', handler, PASSIVE_LISTENER),
      };
      this._elements.set(element, info);
    }
    return {subscribe: observer => this._subscribe(info!, observer)};
  }

  /** 停止监控、完成该元素的全部订阅并移除状态类；未监控元素不会报错。 */
  stopMonitoring(element: Element): void {
    const info = this._elements.get(element);
    if (!info) return;
    info.unlisten();
    for (const complete of [...info.completions]) complete();
    info.listeners.clear();
    info.completions.clear();
    element.classList.remove(MONITORED_CLASS, AUTOFILLED_CLASS);
    this._elements.delete(element);
  }

  /** 停止全部元素并使实例失效；重复调用安全。 */
  destroy(): void {
    if (this._destroyed) return;
    for (const element of [...this._elements.keys()]) this.stopMonitoring(element);
    this._destroyed = true;
  }

  /** Angular 生命周期命名兼容入口。 */
  ngOnDestroy(): void {
    this.destroy();
  }

  private _subscribe(
    info: MonitoredElementInfo,
    observer: ((event: AutofillEvent) => void) | AutofillObserver,
  ): AutofillSubscription {
    let closed = false;
    const next = typeof observer === 'function' ? observer : observer.next?.bind(observer);
    const completion = typeof observer === 'function' ? undefined : observer.complete?.bind(observer);
    const complete = (): void => {
      if (closed) return;
      closed = true;
      completion?.();
    };
    if (next) info.listeners.add(next);
    info.completions.add(complete);
    return {
      get closed() { return closed; },
      unsubscribe: () => {
        if (closed) return;
        closed = true;
        if (next) info.listeners.delete(next);
        info.completions.delete(complete);
      },
    };
  }
}

function completedStream(): AutofillStream {
  return {
    subscribe(observer) {
      if (typeof observer !== 'function') observer.complete?.();
      return {closed: true, unsubscribe: () => undefined};
    },
  };
}

/** Vue 自动填充服务注入键；可通过 app.provide 覆盖默认单例。 */
export const CDK_AUTOFILL_MONITOR: InjectionKey<AutofillMonitor> = Symbol('CDK_AUTOFILL_MONITOR');
export const autofillMonitor = new AutofillMonitor();

/** 在当前 setup 作用域提供 AutofillMonitor；未传实例时创建并随作用域销毁。 */
export function provideAutofillMonitor(instance?: AutofillMonitor): AutofillMonitor {
  const provided = instance ?? new AutofillMonitor();
  provide(CDK_AUTOFILL_MONITOR, provided);
  if (!instance) onScopeDispose(() => provided.destroy());
  return provided;
}

/** 获取当前注入作用域的 AutofillMonitor，未提供时返回模块级单例。 */
export function useAutofillMonitor(): AutofillMonitor {
  return inject(CDK_AUTOFILL_MONITOR, autofillMonitor);
}

/** useAutofill 的可选配置。 */
export interface UseAutofillOptions {
  monitor?: AutofillMonitor;
  onAutofill?: (event: AutofillEvent) => void;
}

/** useAutofill 返回的只读状态和显式停止方法。 */
export interface UseAutofillReturn {
  readonly isAutofilled: {readonly value: boolean};
  readonly event: {readonly value: AutofillEvent | null};
  stop(): void;
}

/** 监控响应式元素引用；目标变化及 effect scope 销毁时自动解除旧订阅。 */
export function useAutofill(
  target: Ref<Element | null | undefined>,
  options: UseAutofillOptions = {},
): UseAutofillReturn {
  const monitor = options.monitor ?? useAutofillMonitor();
  const isAutofilled = ref(false);
  const event = shallowRef<AutofillEvent | null>(null);
  let stopCurrent = (): void => undefined;
  const stopWatch = watch(target, (element, _previous, onCleanup) => {
    stopCurrent();
    isAutofilled.value = false;
    event.value = null;
    if (!element) return;
    const subscription = monitor.monitor(element).subscribe(next => {
      isAutofilled.value = next.isAutofilled;
      event.value = next;
      options.onAutofill?.(next);
    });
    stopCurrent = () => {
      subscription.unsubscribe();
      monitor.stopMonitoring(element);
    };
    onCleanup(stopCurrent);
  }, {immediate: true, flush: 'post'});
  const stop = (): void => {
    stopWatch();
    stopCurrent();
  };
  onScopeDispose(stop, true);
  return {isAutofilled: readonly(isAutofilled), event, stop};
}
