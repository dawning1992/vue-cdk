/**
 * 声明式焦点监视指令，对应 Angular CDK 的 cdkMonitorElementFocus /
 * cdkMonitorSubtreeFocus 指令。
 *
 * 用法：
 * ```vue
 * <input v-focus-monitor />                          <!-- 自动添加焦点类 -->
 * <input v-focus-monitor="onFocusChange" />          <!-- 焦点变化回调 -->
 * <div v-focus-monitor.subtree="onFocusChange">...   <!-- 子元素聚焦也算 -->
 * ```
 *
 * 焦点类（vcdk-focused / vcdk-mouse-focused / ...）由 FocusMonitor
 * 自动维护；回调可选，适合在模板中直接观察来源变化。
 */

import type {Directive, DirectiveBinding} from 'vue';
import {focusMonitor, type FocusOrigin} from './focus-monitor';

const MONITOR_STATE = Symbol('vcdk-focus-monitor');

interface FocusMonitorDirectiveState {
  unsubscribe: () => void;
  handler: ((origin: FocusOrigin) => void) | undefined;
}

type FocusMonitorElement = HTMLElement & {[MONITOR_STATE]?: FocusMonitorDirectiveState};

/** 挂载元素并订阅来源变化，回调读取最新绑定值。 */
function mountMonitor(el: FocusMonitorElement, binding: DirectiveBinding<((origin: FocusOrigin) => void) | undefined>): void {
  const checkChildren = !!binding.modifiers.subtree;
  const state: FocusMonitorDirectiveState = {
    unsubscribe: () => undefined,
    handler: binding.value,
  };
  state.unsubscribe = focusMonitor.monitor(el, checkChildren).subscribe(origin => {
    state.handler?.(origin);
  });
  el[MONITOR_STATE] = state;
}

export const vFocusMonitor: Directive<HTMLElement, ((origin: FocusOrigin) => void) | undefined> = {
  mounted: mountMonitor,
  updated(el: FocusMonitorElement, binding) {
    const state = el[MONITOR_STATE];
    if (state) {
      state.handler = binding.value;
    }
  },
  unmounted(el: FocusMonitorElement) {
    const state = el[MONITOR_STATE];
    if (!state) {
      return;
    }
    state.unsubscribe();
    focusMonitor.stopMonitoring(el);
    delete el[MONITOR_STATE];
  },
};
