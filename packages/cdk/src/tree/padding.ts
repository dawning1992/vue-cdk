/**
 * 树节点缩进指令，对应 Angular CDK tree 的 cdkTreeNodePadding
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 用法：
 * - `v-tree-node-padding`：按节点层级缩进，默认每层 40px；
 * - `v-tree-node-padding="2"`：数字简写，覆盖层级为 2；
 * - `v-tree-node-padding="'1.5rem'"`：字符串简写，覆盖缩进值（无单位时按 px）；
 * - `v-tree-node-padding="{level: 2, indent: '1.5rem'}"`：对象写法。
 *
 * 方向差异：RTL 布局时缩进改为右侧 padding（用 getDirection 就近读取，
 * 与仓库 directionality 一致，无运行时方向变更通知）。
 */

import {nextTick, type Directive} from 'vue';
import {coerceNumberProperty} from '../coercion';
import {getDirection} from '../scrolling/directionality';
import {findParentTreeNode} from './node';

/** 指令绑定值：数字（层级覆盖）、带单位字符串（缩进覆盖）或对象。 */
export type TreeNodePaddingValue =
  | number
  | string
  | {level?: number | null; indent?: number | string};

/** 用于拆分数值与 CSS 单位的正则。 */
const cssUnitPattern = /([A-Za-z%]+)$/;

/** 解析缩进值：返回数值与单位（缺省 px）。 */
function parseIndent(indent: number | string): {value: number; units: string} {
  let units = 'px';
  let value: number | string = indent;
  if (typeof indent === 'string') {
    const parts = indent.split(cssUnitPattern);
    value = parts[0];
    units = parts[1] || units;
  }
  return {value: coerceNumberProperty(value), units};
}

/** 按节点层级与缩进配置设置内联 padding。 */
function setNodePadding(el: HTMLElement, value?: TreeNodePaddingValue): void {
  const node = findParentTreeNode(el);
  if (!node) {
    return;
  }

  let level: number | null = null;
  let indent: number | string = 40;
  if (typeof value === 'number') {
    level = value;
  } else if (typeof value === 'string') {
    indent = value;
  } else if (value && typeof value === 'object') {
    if (value.level != null) {
      level = value.level;
    }
    if (value.indent != null) {
      indent = value.indent;
    }
  }

  const nodeLevel = level ?? node.level;
  const parsed = parseIndent(indent);
  const paddingProp = getDirection(el) === 'rtl' ? 'paddingRight' : 'paddingLeft';
  const resetProp = paddingProp === 'paddingLeft' ? 'paddingRight' : 'paddingLeft';
  el.style[paddingProp] = `${nodeLevel * parsed.value}${parsed.units}`;
  el.style[resetProp] = '';
}

/**
 * 树节点缩进指令：在节点元素上设置 `level * indent` 的 padding。
 */
export const vTreeNodePadding: Directive<HTMLElement, TreeNodePaddingValue | undefined> = {
  mounted: (el, binding) => {
    // 延迟到下一 tick：节点组件在 onMounted 中注册根元素，
    // 指令挂载早于组件挂载，立即查找会拿不到所属节点。
    void nextTick(() => setNodePadding(el, binding.value));
  },
  updated: (el, binding) => setNodePadding(el, binding.value),
};
