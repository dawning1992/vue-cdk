/**
 * 拖拽 handle 指令，对应 Angular CDK 的 cdkDragHandle。
 * 用法：`v-drag-handle="{disabled: boolean}"`。
 * 通过注册表沿 DOM 向上查找所属 VDrag 并注册 handle。
 */

import {nextTick, type Directive} from 'vue';
import {dragDropRegistry} from './drag-drop-registry';
import type {DragHandleRef, VDragPublicApi} from './v-drag';

const HANDLE_STATE = Symbol('vcdk-drag-handle');

interface HandleDirectiveState extends DragHandleRef {
  drag: VDragPublicApi;
}

type HandleElement = HTMLElement & {[HANDLE_STATE]?: HandleDirectiveState};

/** 解析绑定值中的 disabled 状态（支持对象与布尔两种写法）。 */
function readDisabled(value: {disabled?: boolean} | boolean | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return !!value?.disabled;
}

/** 沿 DOM 向上查找最近的拖拽条目组件实例。 */
function findParentDrag(element: HTMLElement): VDragPublicApi | null {
  let node: HTMLElement | null = element.parentElement;
  while (node) {
    const drag = dragDropRegistry.getDragDirectiveForNode(node);
    if (drag) {
      return drag as VDragPublicApi;
    }
    node = node.parentElement;
  }
  return null;
}

/** 同步 handle 禁用状态到底层 DragRef。 */
function syncDisabled(state: HandleDirectiveState) {
  const ref = state.drag.dragRef;
  if (state.disabled) {
    ref.disableHandle(state.element);
  } else {
    ref.enableHandle(state.element);
  }
}

/**
 * handle 指令：只有 handle 可以启动拖拽；禁用后 handle 会拦截拖拽。
 * 挂载时延迟到下一 tick 注册，确保所属 VDrag 已完成挂载。
 */
export const vDragHandle: Directive<HTMLElement, {disabled?: boolean} | boolean | undefined> = {
  mounted(el, binding) {
    const element = el as HandleElement;
    void nextTick(() => {
      if (element[HANDLE_STATE]) {
        return;
      }
      const drag = findParentDrag(element);
      if (!drag) {
        return;
      }
      const state: HandleDirectiveState = {
        element,
        drag,
        disabled: readDisabled(binding.value),
      };
      element[HANDLE_STATE] = state;
      drag._addHandle(state);
      syncDisabled(state);
    });
  },
  updated(el, binding) {
    const element = el as HandleElement;
    const state = element[HANDLE_STATE];
    if (state) {
      state.disabled = readDisabled(binding.value);
      syncDisabled(state);
    }
  },
  unmounted(el) {
    const element = el as HandleElement;
    const state = element[HANDLE_STATE];
    if (state) {
      state.drag._removeHandle(state);
      delete element[HANDLE_STATE];
    }
  },
};
