/**
 * 焦点陷阱的组合式 API（Vue 3 Composition API 使用方式）。
 *
 * 负责创建、同步与销毁 FocusTrap / ConfigurableFocusTrap：
 * - 目标元素可为元素、ref 或 getter，元素进入 DOM 后自动创建陷阱；
 * - `enabled` 为可写 ref，与陷阱实例的 enabled 双向同步；
 * - 组件卸载或显式调用 `destroy()` 时自动清理并（autoCapture 开启时）恢复焦点。
 */

import {
  onBeforeUnmount,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
  type WatchStopHandle,
} from 'vue';
import {getFocusedElementPierceShadowDom} from '../../platform';
import {configurableFocusTrapFactory} from './configurable-focus-trap-factory';
import type {ConfigurableFocusTrap} from './configurable-focus-trap';
import {FocusTrap, focusTrapFactory} from './focus-trap';
import type {FocusTrapInertStrategy} from './focus-trap-inert-strategy';

/** useFocusTrap 配置项。 */
export interface UseFocusTrapOptions {
  /** 创建后自动捕获焦点，销毁时恢复到之前的聚焦元素。 */
  autoCapture?: boolean;
  /** 使用 ConfigurableFocusTrap（接入栈管理，支持嵌套模态框）。 */
  configurable?: boolean;
  /** 延迟锚点创建；元素已挂载到 DOM 时通常无需设置。 */
  defer?: boolean;
  /** 自定义惰性策略（仅 configurable 时生效）。 */
  inertStrategy?: FocusTrapInertStrategy;
}

/** useFocusTrap 返回值。 */
export interface UseFocusTrapResult {
  /** 当前陷阱实例；元素未就绪或已销毁时为 null。 */
  trap: ShallowRef<FocusTrap | ConfigurableFocusTrap | null>;
  /** 陷阱启用状态，可写，与实例双向同步。 */
  enabled: Ref<boolean>;
  /** 聚焦标记元素或第一个可 Tab 元素，返回是否成功。 */
  focusInitial(options?: FocusOptions): boolean;
  /** 聚焦区域内第一个可 Tab 元素，返回是否成功。 */
  focusFirst(options?: FocusOptions): boolean;
  /** 聚焦区域内最后一个可 Tab 元素，返回是否成功。 */
  focusLast(options?: FocusOptions): boolean;
  /** 销毁陷阱并停止后续自动重建（幂等）。 */
  destroy(): void;
}

export function useFocusTrap(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseFocusTrapOptions = {},
): UseFocusTrapResult {
  const trap = shallowRef<FocusTrap | ConfigurableFocusTrap | null>(null);
  const enabled = ref(true);
  let previouslyFocusedElement: HTMLElement | null = null;
  let destroyed = false;
  let stopWatching: WatchStopHandle | undefined;

  /** 按当前配置在目标元素上创建陷阱；元素未就绪时跳过。 */
  function createTrap(): void {
    if (destroyed) {
      return;
    }

    const element = toValue(target);
    if (!element) {
      return;
    }

    const defer = options.defer ?? false;
    const instance = options.configurable
      ? configurableFocusTrapFactory.create(element, {
          defer,
          ...(options.inertStrategy ? {inertStrategy: options.inertStrategy} : {}),
        })
      : focusTrapFactory.create(element, defer);

    trap.value = instance;

    // 仅当初始为关闭时才需要主动同步，避免重复触发可配置陷阱的栈操作。
    if (!enabled.value) {
      instance.enabled = false;
    }

    if (options.autoCapture) {
      previouslyFocusedElement = getFocusedElementPierceShadowDom();
      void instance.focusInitialElementWhenReady();
    }
  }

  /** 销毁当前陷阱；autoCapture 开启时恢复之前的聚焦元素。 */
  function destroyTrap(): void {
    const instance = trap.value;
    if (!instance) {
      return;
    }

    trap.value = null;
    instance.destroy();

    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  stopWatching = watch(() => toValue(target), createTrap, {immediate: true, flush: 'post'});

  watch(enabled, value => {
    if (trap.value) {
      trap.value.enabled = value;
    }
  });

  onBeforeUnmount(() => {
    destroyed = true;
    stopWatching?.();
    destroyTrap();
  });

  return {
    trap,
    enabled,
    focusInitial: (options?: FocusOptions) =>
      trap.value ? trap.value.focusInitialElement(options) : false,
    focusFirst: (options?: FocusOptions) =>
      trap.value ? trap.value.focusFirstTabbableElement(options) : false,
    focusLast: (options?: FocusOptions) =>
      trap.value ? trap.value.focusLastTabbableElement(options) : false,
    destroy: () => {
      destroyed = true;
      stopWatching?.();
      destroyTrap();
    },
  };
}
