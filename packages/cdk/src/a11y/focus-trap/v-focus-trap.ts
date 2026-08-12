/**
 * 声明式焦点陷阱指令，对应 Angular CDK 的 cdkTrapFocus 指令。
 *
 * 用法：
 * ```vue
 * <div v-focus-trap> ... </div>            <!-- 默认启用 -->
 * <div v-focus-trap="false"> ... </div>    <!-- 关闭 -->
 * <div v-focus-trap.autoCapture> ... </div> <!-- 挂载时自动捕获焦点，卸载时恢复 -->
 * ```
 */

import type {Directive, DirectiveBinding} from 'vue';
import {getFocusedElementPierceShadowDom} from '../../platform';
import {FocusTrap, focusTrapFactory} from './focus-trap';

const TRAP_STATE = Symbol('vcdk-focus-trap');

interface FocusTrapDirectiveState {
  trap: FocusTrap;
  previouslyFocused: HTMLElement | null;
}

type FocusTrapElement = HTMLElement & {[TRAP_STATE]?: FocusTrapDirectiveState};

/** 在元素上创建陷阱状态并套用当前绑定。 */
function applyBinding(el: FocusTrapElement, binding: DirectiveBinding<boolean | undefined>): void {
  const enabled = binding.value !== false;
  const autoCapture = !!binding.modifiers.autoCapture;

  let state = el[TRAP_STATE];
  if (!state) {
    // 延迟创建锚点：mounted 时元素已在 DOM 中，立即挂载。
    state = {trap: focusTrapFactory.create(el, true), previouslyFocused: null};
    el[TRAP_STATE] = state;
  }

  state.trap.enabled = enabled;
  if (!state.trap.hasAttached()) {
    state.trap.attachAnchors();
  }

  if (autoCapture && !state.previouslyFocused) {
    state.previouslyFocused = getFocusedElementPierceShadowDom();
    void state.trap.focusInitialElementWhenReady();
  }
}

export const vFocusTrap: Directive<HTMLElement, boolean | undefined> = {
  mounted: applyBinding,
  updated: applyBinding,
  unmounted(el: FocusTrapElement) {
    const state = el[TRAP_STATE];
    if (!state) {
      return;
    }

    state.trap.destroy();
    if (state.previouslyFocused) {
      state.previouslyFocused.focus();
      state.previouslyFocused = null;
    }
    delete el[TRAP_STATE];
  },
};
