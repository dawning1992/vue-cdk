import {
  getCurrentScope,
  getCurrentInstance,
  onScopeDispose,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';
import {
  contentObserver,
  useContentObserver,
  type ContentObserver,
  type ContentObserverSubscription,
} from './content-observer';

/** useObserveContent 的响应式配置。 */
export interface UseObserveContentOptions {
  /** 是否暂停观察；支持 Ref、computed 或 getter，默认 false。 */
  disabled?: MaybeRefOrGetter<boolean>;
  /** 通知防抖毫秒数；非有限值与负数按 0 处理。 */
  debounce?: MaybeRefOrGetter<number | undefined>;
  /** 自定义服务实例；缺省使用模块级 contentObserver。 */
  observer?: ContentObserver;
}

/** useObserveContent 返回的命令式控制句柄。 */
export interface ObserveContentRef {
  /** 立即停止观察并清除待派发的防抖回调；可重复调用。 */
  stop(): void;
}

/**
 * 以 Composition API 观察响应式元素引用的内容变化。
 *
 * target、disabled 和 debounce 变化时会自动重建订阅；当前 effect scope 销毁时自动清理。
 * 必须在 effect scope（通常为组件 setup）内调用，否则调用方必须自行调用返回值的 stop()。
 */
export function useObserveContent(
  target: MaybeRefOrGetter<Element | null | undefined>,
  callback: (records: MutationRecord[]) => void,
  options: UseObserveContentOptions = {},
): ObserveContentRef {
  // inject 仅能在组件 setup 中使用；独立 effectScope 或普通函数调用回退到模块单例。
  const service = options.observer ?? (getCurrentInstance() ? useContentObserver() : contentObserver);
  let subscription: ContentObserverSubscription | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const clear = () => {
    subscription?.unsubscribe();
    subscription = null;
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const stopWatch = watch(
    [() => toValue(target), () => Boolean(toValue(options.disabled ?? false)), () => toValue(options.debounce)],
    ([element, disabled, debounce]) => {
      clear();
      if (!element || disabled || stopped) return;
      subscription = service.observe(element).subscribe(records => {
        const delay = Number.isFinite(Number(debounce)) ? Math.max(0, Number(debounce)) : 0;
        if (!delay) {
          callback(records);
          return;
        }
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          callback(records);
        }, delay);
      });
    },
    {immediate: true},
  );

  const stop = () => {
    if (stopped) return;
    stopped = true;
    stopWatch();
    clear();
  };

  if (getCurrentScope()) onScopeDispose(stop);
  return {stop};
}
