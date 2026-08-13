/**
 * 树节点组件与注册表，对应 Angular CDK tree 的 CdkTreeNode / CdkTreeNodeDef。
 * （https://github.com/angular/components，MIT License）
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 与 Angular 的差异（Vue 等价物）：
 * - 节点模板由 VTree 的 `#node` 作用域插槽承担（对应 *cdkTreeNodeDef），
 *   插槽上下文类型为 `VTreeNodeContext<T>`；
 * - 指令通过 DOM 注册表沿祖先查找所属节点（对应 Angular 的 DI 注入，
 *   复用仓库 drag-drop 中 vDragHandle 的既有模式）。
 */

import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue';
import {VCDK_TREE_CONTEXT, type VTreeContext} from './tree';

/** `#node` 作用域插槽的上下文，对应 Angular 的 CdkTreeNodeOutletContext。 */
export interface VTreeNodeContext<T> {
  /** 节点数据。 */
  node: T;
  /** 节点层级（0 起）。 */
  level: number;
  /** 节点在兄弟节点中的索引。 */
  index: number;
  /** 兄弟节点总数。 */
  count: number;
}

/**
 * 树节点的公共 API（VTreeNode / VNestedTreeNode 均暴露该接口）。
 * 同时作为 TreeKeyManagerItem 的实现载体，供键盘导航调用。
 */
export interface VTreeNodePublicApi<T = any, K = any> {
  /** 节点数据。 */
  readonly data: T;
  /** 所属树的上下文（供指令等内部使用）。 */
  readonly tree: VTreeContext<T, K>;
  /** 节点根元素。 */
  readonly element: HTMLElement;
  /** 是否禁用。 */
  readonly isDisabled: boolean;
  /** 是否可展开。 */
  readonly isExpandable: boolean;
  /** 当前是否展开。 */
  readonly isExpanded: boolean;
  /** 节点层级。 */
  readonly level: number;
  /** 获取无障碍标签（typeahead 使用）。 */
  getLabel(): string;
  /** 获取渲染父节点的节点实例；根节点返回 null。 */
  getParent(): VTreeNodePublicApi<T, K> | null;
  /** 获取已渲染的直接子节点实例。 */
  getChildren(): VTreeNodePublicApi<T, K>[];
  /** 激活节点（键盘 Enter/Space 触发）。 */
  activate(): void;
  /** 收起节点（不可展开时无操作）。 */
  collapse(): void;
  /** 展开节点（不可展开时无操作）。 */
  expand(): void;
  /** 聚焦节点。 */
  focus(): void;
  /** 取消聚焦状态。 */
  unfocus(): void;
  /** 使节点可聚焦但不抢占焦点（roving tabindex 初始项）。 */
  makeFocusable(): void;
  /** 处理点击：交由树的键盘管理器激活焦点。 */
  _setActiveItem(): void;
  /** 处理焦点事件：交由树的键盘管理器激活焦点（内部使用）。 */
  _focusItem(): void;
}

/** 节点根元素 → 节点实例注册表，供 padding/toggle 指令沿 DOM 查找。 */
const treeNodeElementRegistry = new WeakMap<HTMLElement, VTreeNodePublicApi<any, any>>();

/** 注册节点根元素（组件挂载时调用）。 */
export function registerTreeNodeElement(el: HTMLElement, node: VTreeNodePublicApi): void {
  treeNodeElementRegistry.set(el, node);
}

/** 注销节点根元素（组件卸载时调用）。 */
export function unregisterTreeNodeElement(el: HTMLElement): void {
  treeNodeElementRegistry.delete(el);
}

/** 沿 DOM 向上查找最近的节点实例；找不到返回 null。 */
export function findParentTreeNode(el: HTMLElement): VTreeNodePublicApi | null {
  let current: HTMLElement | null = el;
  while (current) {
    const node = treeNodeElementRegistry.get(current);
    if (node) {
      return node;
    }
    current = current.parentElement;
  }
  return null;
}

/** 树节点共享 setup：注入树上下文、维护焦点/展开状态并完成注册。 */
export function useVTreeNode(
  props: {
    node: unknown;
    isExpandable: boolean;
    isExpanded?: boolean;
    isDisabled: boolean;
    typeaheadLabel?: string | null;
  },
  emit: (event: any, ...args: any[]) => void,
  type: 'flat' | 'nested',
): {
  tree: VTreeContext;
  api: VTreeNodePublicApi;
  rootEl: Ref<HTMLElement | null>;
  tabindex: Ref<number>;
  level: ComputedRef<number>;
  isExpandable: ComputedRef<boolean>;
  isExpanded: ComputedRef<boolean>;
} {
  const treeContext = inject(VCDK_TREE_CONTEXT, null);
  if (!treeContext) {
    throw new Error('VTreeNode / VNestedTreeNode must be used inside a VTree.');
  }
  // 显式赋予非空类型，避免窄化在闭包中丢失导致的空值误报。
  const tree: VTreeContext = treeContext;

  const rootEl = ref<HTMLElement | null>(null);
  const tabindex = ref(-1);
  // 点击节点时不强制调用 focus()：点击本身会让元素获得焦点，
  // 避免干扰其他希望抢焦点的组件（与 Angular 的 _shouldFocus 语义一致）。
  let shouldFocus = true;

  const level = computed(() => tree.getLevel(props.node) ?? 0);
  const isLeafNode = computed(() => tree.isLeafNode(props.node));
  const isExpandable = computed(() =>
    tree.treeControl ? !isLeafNode.value : props.isExpandable,
  );
  const isExpanded = computed(() => tree.isExpanded(props.node));

  // `isExpanded` 输入：外部受控时调用展开/收起（对应 Angular 的 setter）。
  watch(
    () => props.isExpanded,
    value => {
      if (value === undefined || !isExpandable.value) {
        return;
      }
      value ? tree.expand(props.node) : tree.collapse(props.node);
    },
    {immediate: true},
  );

  // 展开状态变化时派发 expandedChange（与 Angular 的 _emitExpansionState 等价）。
  watch(isExpanded, (value, oldValue) => {
    if (value !== oldValue) {
      emit('expandedChange', value);
    }
  });

  /** 激活节点并派发 activation 事件。 */
  function activate(): void {
    if (props.isDisabled) {
      return;
    }
    emit('activation', props.node);
  }

  /** 收起节点；不可展开时无操作。 */
  function collapse(): void {
    if (isExpandable.value) {
      tree.collapse(props.node);
    }
  }

  /** 展开节点；不可展开时无操作。 */
  function expand(): void {
    if (isExpandable.value) {
      tree.expand(props.node);
    }
  }

  /** 聚焦节点（roving tabindex）。 */
  function focus(): void {
    tabindex.value = 0;
    if (shouldFocus) {
      rootEl.value?.focus();
    }
  }

  /** 取消聚焦状态。 */
  function unfocus(): void {
    tabindex.value = -1;
  }

  /** 使节点可聚焦但不抢占焦点。 */
  function makeFocusable(): void {
    tabindex.value = 0;
  }

  /** 获取 typeahead 标签：优先 typeaheadLabel，否则取元素文本。 */
  function getLabel(): string {
    return props.typeaheadLabel || rootEl.value?.textContent?.trim() || '';
  }

  /** 获取渲染父节点实例。 */
  function getParent(): VTreeNodePublicApi | null {
    const parentData = tree.getParentData(props.node);
    if (parentData == null) {
      return null;
    }
    return tree.getNode(parentData) ?? null;
  }

  /** 获取已渲染的直接子节点实例。 */
  function getChildren(): VTreeNodePublicApi[] {
    const children = tree.getDirectChildren(props.node)?.value ?? [];
    return children
      .map(child => tree.getNode(child))
      .filter((child): child is VTreeNodePublicApi => !!child);
  }

  /** 节点获得焦点时交由键盘管理器处理。 */
  function _focusItem(): void {
    if (props.isDisabled) {
      return;
    }
    tree.focusNode(api);
  }

  /** 节点被点击时交由键盘管理器处理。 */
  function _setActiveItem(): void {
    if (props.isDisabled) {
      return;
    }
    shouldFocus = false;
    tree.focusNode(api);
    shouldFocus = true;
  }

  const api: VTreeNodePublicApi = {
    get data() {
      return props.node;
    },
    get tree() {
      return tree;
    },
    get element() {
      return rootEl.value!;
    },
    get isDisabled() {
      return props.isDisabled;
    },
    get isExpandable() {
      return isExpandable.value;
    },
    get isExpanded() {
      return isExpanded.value;
    },
    get level() {
      return level.value;
    },
    getLabel,
    getParent,
    getChildren,
    activate,
    collapse,
    expand,
    focus,
    unfocus,
    makeFocusable,
    _focusItem,
    _setActiveItem,
  };

  onMounted(() => {
    tree.setNodeTypeIfUnset(type);
    tree.registerNode(api);
    if (rootEl.value) {
      registerTreeNodeElement(rootEl.value, api);
    }
  });

  onBeforeUnmount(() => {
    tree.unregisterNode(api);
    if (rootEl.value) {
      unregisterTreeNodeElement(rootEl.value);
    }
  });

  return {tree, api, rootEl, tabindex, level, isExpandable, isExpanded};
}

/**
 * 扁平树节点组件，对应 Angular 的 cdk-tree-node。
 * 需配合 VTree 的 `#node` 插槽使用：插槽内编写节点内容与指令。
 */
export const VTreeNode = defineComponent({
  name: 'VTreeNode',
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
    /** 是否禁用（影响键盘导航与激活）。 */
    isDisabled: {type: Boolean, default: false},
    /** typeahead 标签；缺省取节点元素文本。 */
    typeaheadLabel: {type: String, default: null},
    /** 根元素标签。 */
    tag: {type: String, default: 'div'},
  },
  emits: {
    /** 节点被键盘激活（Enter/Space）或程序化激活时触发，载荷为节点数据。 */
    activation: (_node: any) => true,
    /** 展开状态变化时触发。 */
    expandedChange: (_expanded: any) => true,
  },
  setup(props, {slots, emit, expose}) {
    const state = useVTreeNode(props, emit, 'flat');
    expose(state.api);

    return () => {
      const expandable = state.isExpandable.value;
      const expanded = state.isExpanded.value;
      return h(
        props.tag,
        {
          ref: state.rootEl,
          class: 'vcdk-tree-node',
          role: 'treeitem',
          'aria-expanded': expandable ? String(expanded) : null,
          'aria-level': state.level.value + 1,
          'aria-posinset': state.tree.getPositionInSet(props.node),
          'aria-setsize': state.tree.getSetSize(props.node),
          tabindex: state.tabindex.value,
          onClick: () => state.api._setActiveItem(),
          onFocus: () => state.api._focusItem(),
        },
        slots.default?.(),
      );
    };
  },
});
