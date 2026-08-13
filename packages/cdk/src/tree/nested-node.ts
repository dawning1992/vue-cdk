/**
 * 嵌套树节点组件，对应 Angular CDK tree 的 CdkNestedTreeNode
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 与 Angular 的差异：子节点由本组件自动渲染在节点内部的
 * `.vcdk-tree-node-children` 容器中，无需显式放置 cdkTreeNodeOutlet；
 * 子节点仅在节点展开时渲染（Angular 的 childrenAccessor 场景需要
 * 使用者在模板中自行用 `@if (tree.isExpanded(node))` 包裹 outlet）。
 */

import {defineComponent, Fragment, h} from 'vue';
import {useVTreeNode, type VTreeNodeContext} from './node';

/**
 * 嵌套树节点组件：节点内容（默认插槽）后自动渲染展开的子节点。
 * 需配合 VTree 的 `#node` 插槽使用，子节点继续复用同一插槽递归渲染。
 */
export const VNestedTreeNode = defineComponent({
  name: 'VNestedTreeNode',
  props: {
    /** 节点数据（由 #node 插槽上下文传入）。 */
    node: {type: null, required: true},
    /**
     * 是否可展开。
     * 使用 treeControl 时自动推断；使用 accessors 时须显式提供（影响 aria-expanded）。
     */
    isExpandable: {type: Boolean, default: false},
    /** 受控展开状态；变化时触发展开/收起。 */
    isExpanded: {type: Boolean, default: undefined},
    /** 是否禁用。 */
    isDisabled: {type: Boolean, default: false},
    /** typeahead 标签；缺省取节点元素文本。 */
    typeaheadLabel: {type: String, default: null},
    /** 根元素标签。 */
    tag: {type: String, default: 'div'},
  },
  emits: {
    /** 节点被键盘激活时触发，载荷为节点数据。 */
    activation: (_node: any) => true,
    /** 展开状态变化时触发。 */
    expandedChange: (_expanded: any) => true,
  },
  setup(props, {slots, emit, expose}) {
    const state = useVTreeNode(props, emit, 'nested');
    expose(state.api);

    return () => {
      const expandable = state.isExpandable.value;
      const expanded = state.isExpanded.value;
      const childrenRef = state.tree.getDirectChildren(props.node);
      const children = childrenRef?.value ?? [];
      const nodeSlot = state.tree.nodeSlot;

      return h(
        props.tag,
        {
          ref: state.rootEl,
          class: 'vcdk-nested-tree-node',
          role: 'treeitem',
          'aria-expanded': expandable ? String(expanded) : null,
          'aria-level': state.level.value + 1,
          'aria-posinset': state.tree.getPositionInSet(props.node),
          'aria-setsize': state.tree.getSetSize(props.node),
          tabindex: state.tabindex.value,
          onClick: () => state.api._setActiveItem(),
          onFocus: () => state.api._focusItem(),
        },
        [
          slots.default?.(),
          expanded && children.length && nodeSlot
            ? h(
                'div',
                {class: 'vcdk-tree-node-children'},
                children.map((child, index) => {
                  const context: VTreeNodeContext<unknown> = {
                    node: child,
                    level: state.tree.getLevel(child) ?? state.level.value + 1,
                    index,
                    count: children.length,
                  };
                  const vnodes = nodeSlot(context);
                  return h(
                    Fragment,
                    {key: state.tree.vueKey(child, index)},
                    Array.isArray(vnodes) ? vnodes : [vnodes],
                  );
                }),
              )
            : null,
        ],
      );
    };
  },
});
