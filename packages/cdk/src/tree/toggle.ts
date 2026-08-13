/**
 * 树节点展开/收起指令，对应 Angular CDK tree 的 cdkTreeNodeToggle
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 用法：`v-tree-node-toggle`（切换本节点）或 `v-tree-node-toggle="true"`（递归切换子树）。
 * 建议挂在按钮元素上；点击与 Enter/Space 键均可触发，事件会 stopPropagation。
 */

import type {Directive} from 'vue';
import {findParentTreeNode, type VTreeNodePublicApi} from './node';

interface ToggleState {
  /** 是否递归切换子树。 */
  recursive: boolean;
}

const TOGGLE_STATE = Symbol('vcdk-tree-node-toggle');

type ToggleElement = HTMLElement & {[TOGGLE_STATE]?: ToggleState};

/** 切换节点展开状态并让键盘管理器聚焦该节点（保证展开/收起后仍可见）。 */
function toggleNode(element: ToggleElement, recursive: boolean): void {
  const node = findParentTreeNode(element);
  if (!node) {
    return;
  }
  if (recursive) {
    node.tree.toggleDescendants(node.data);
  } else {
    node.tree.toggle(node.data);
  }
  node.tree.focusNode(node as VTreeNodePublicApi);
}

/** 点击处理器。 */
function onClick(this: ToggleElement, event: Event): void {
  event.stopPropagation();
  const state = this[TOGGLE_STATE];
  if (!state) {
    return;
  }
  toggleNode(this, state.recursive);
}

/** Enter/Space 键盘处理器。 */
function onKeydown(this: ToggleElement, event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }
  event.stopPropagation();
  event.preventDefault();
  const state = this[TOGGLE_STATE];
  if (!state) {
    return;
  }
  toggleNode(this, state.recursive);
}

/**
 * 树节点展开/收起指令。
 */
export const vTreeNodeToggle: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, binding) {
    const element = el as ToggleElement;
    element[TOGGLE_STATE] = {recursive: !!binding.value};
    element.addEventListener('click', onClick);
    element.addEventListener('keydown', onKeydown);
  },
  updated(el, binding) {
    const element = el as ToggleElement;
    const state = element[TOGGLE_STATE];
    if (state) {
      state.recursive = !!binding.value;
    }
  },
  unmounted(el) {
    const element = el as ToggleElement;
    delete element[TOGGLE_STATE];
    element.removeEventListener('click', onClick);
    element.removeEventListener('keydown', onKeydown);
  },
};
