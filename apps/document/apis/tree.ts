import type {ApiGroup} from '../api';

/** tree 模块 API 分组：组件、指令、树控制与类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '组件',
    rows: [
      {
        name: 'VTree',
        signature:
          'component VTree<T, K>：dataSource / treeControl? / levelAccessor? / childrenAccessor? / trackBy? / expansionKey? / tag?',
        description:
          '树根组件，role="tree"；dataSource 接受 DataSource、Emitter、Ref 或普通数组（普通数组只派发一次）；层级来源三选一：treeControl、levelAccessor（扁平）或 childrenAccessor（嵌套）。暴露 isExpanded / toggle / expand / collapse / toggleDescendants / expandDescendants / collapseDescendants / expandAll / collapseAll。',
      },
      {
        name: '#node 插槽',
        signature: 'VTreeNodeContext<T> = {node: T; level: number; index: number; count: number}',
        description:
          '节点模板作用域插槽（对应 Angular 的 *cdkTreeNodeDef）；插槽内编写 VTreeNode / VNestedTreeNode 与节点内容，条件模板用 v-if 实现（对应 Angular 的 when 谓词）。',
      },
      {
        name: 'VTreeNode',
        signature:
          'component VTreeNode<T>：node / isExpandable? / isExpanded? / isDisabled? / typeaheadLabel? / tag?；emits activation(node) / expandedChange(boolean)',
        description:
          '扁平树节点（对应 cdk-tree-node）：role="treeitem" 并自动设置 aria-level / aria-posinset / aria-setsize / aria-expanded 与 roving tabindex；使用 treeControl 时 isExpandable 自动推断，使用 accessors 时须显式传入。',
      },
      {
        name: 'VNestedTreeNode',
        signature: 'component VNestedTreeNode<T>：props / emits 同 VTreeNode',
        description:
          '嵌套树节点（对应 cdk-nested-tree-node）：节点内容后自动渲染展开的子节点（无需 Angular 的 cdkTreeNodeOutlet）；子节点仅在展开时渲染，继续复用 #node 插槽递归。',
      },
    ],
  },
  {
    title: '指令',
    rows: [
      {
        name: 'vTreeNodeToggle',
        signature: 'directive vTreeNodeToggle<boolean | undefined>',
        description:
          '展开/收起指令（对应 cdkTreeNodeToggle）：点击与 Enter/Space 触发并 stopPropagation；绑定值为 true 时递归切换子树；切换后自动聚焦节点。建议挂在按钮上。',
      },
      {
        name: 'vTreeNodePadding',
        signature:
          "directive vTreeNodePadding<number | string | {level?: number; indent?: number | string}>",
        description:
          '层级缩进指令（对应 cdkTreeNodePadding）：默认按节点层级 × 40px；数字简写覆盖层级，带单位字符串覆盖缩进（如 "1.5rem"，缺省 px）；RTL 布局自动改用 paddingRight。',
      },
      {
        name: 'TreeNodePaddingValue',
        signature: 'type TreeNodePaddingValue = number | string | {level?: number | null; indent?: number | string}',
        description:
          'vTreeNodePadding 的绑定值：数字覆盖层级、带单位字符串覆盖缩进（缺省 px）、对象可同时指定 level 与 indent。',
      },
    ],
  },
  {
    title: '树控制',
    rows: [
      {
        name: 'TreeControl',
        signature: 'interface TreeControl<T, K = T>',
        description:
          '树控制接口：dataNodes / expansionModel / isExpanded / getDescendants / toggle / expand / collapse / expandAll / collapseAll / toggleDescendants / expandDescendants / collapseDescendants / getLevel / isExpandable / getChildren。',
      },
      {
        name: 'BaseTreeControl',
        signature: 'abstract class BaseTreeControl<T, K = T> implements TreeControl<T, K>',
        description:
          '树控制基类：基于 SelectionModel 维护展开状态，提供单节点与子树的展开/收起操作；trackBy 提供稳定标识（对应 Angular 的 BaseTreeControl）。',
      },
      {
        name: 'FlatTreeControl',
        signature: 'class FlatTreeControl<T, K = T> extends BaseTreeControl<T, K>',
        description:
          '扁平树控制：构造参数 getLevel / isExpandable（可带 {trackBy} 选项）；getDescendants 按层级扫描扁平数组，expandAll 展开全部节点。使用前须为 dataNodes 赋值。',
      },
      {
        name: 'FlatTreeControlOptions',
        signature: 'interface FlatTreeControlOptions<T, K> { trackBy?: (dataNode: T) => K }',
        description: 'FlatTreeControl 可选配置：trackBy 为节点稳定标识函数，用于跨引用变化保持展开状态。',
      },
      {
        name: 'NestedTreeControl',
        signature: 'class NestedTreeControl<T, K = T> extends BaseTreeControl<T, K>',
        description:
          '嵌套树控制：构造参数 getChildren（返回数组或 Emitter 流，可带 {isExpandable, trackBy} 选项）；getDescendants 递归收集后代；异步子节点仅在派发后参与同步收集。',
      },
      {
        name: 'NestedTreeControlOptions',
        signature: 'interface NestedTreeControlOptions<T, K> { isExpandable?: (dataNode: T) => boolean; trackBy?: (dataNode: T) => K }',
        description:
          'NestedTreeControl 可选配置：isExpandable 判断节点是否可展开（不提供时按后代数量推断）；trackBy 为节点稳定标识函数。',
      },
    ],
  },
  {
    title: '无障碍与基础设施',
    rows: [
      {
        name: 'TreeKeyManager',
        signature: 'class TreeKeyManager<T extends TreeKeyManagerItem>（vue-cdk/a11y）',
        description:
          '树形键盘导航管理器：方向键、左右键展开/收起与聚焦子/父节点、Home/End、Enter/Space 激活、`*` 同级展开、typeahead、RTL 交换左右键；条目源支持数组或 Ref。',
      },
      {
        name: 'SelectionModel',
        signature: 'class SelectionModel<T>（vue-cdk/collections）',
        description:
          '选择模型：select / deselect / toggle / isSelected / clear / changed（Emitter）/ compareWith / bulk；内部 shallowRef 存储，读取 selected 可被响应式追踪。',
      },
      {
        name: 'VTreePublicApi',
        signature: 'interface VTreePublicApi<T>',
        description:
          'VTree 模板 ref 暴露的方法集合：isExpanded / toggle / expand / collapse / toggleDescendants / expandDescendants / collapseDescendants / expandAll / collapseAll / viewChange。',
      },
    ],
  },
  {
    title: '上下文、注入与工具',
    rows: [
      {
        name: 'VCDK_TREE_CONTEXT',
        signature: 'const VCDK_TREE_CONTEXT: InjectionKey<VTreeContext<any, any>>',
        description: '树上下文注入键，VTree 通过 provide 提供给后代节点组件与指令。',
      },
      {
        name: 'VTreeContext',
        signature: 'interface VTreeContext<T = any, K = any>',
        description:
          'VTree 提供给后代节点/指令的上下文，是节点组件与指令访问树能力的唯一通道：treeControl 树控制实例（使用 accessors 时为 null）；getExpansionKey/getLevel/getParentData/getSetSize/getPositionInSet/isExpanded/isLeafNode 读取节点信息；expand/collapse/toggle/toggleDescendants/expandDescendants/collapseDescendants 操作展开；getDirectChildren 获取直接子节点源；getNode/registerNode/unregisterNode 维护节点注册表；focusNode/keyManager 键盘导航；nodeSlot 为 #node 插槽渲染函数；viewChange 为视图区间流。',
      },
      {
        name: 'VTreeNodeContext',
        signature: 'interface VTreeNodeContext<T> { node: T; level: number; index: number; count: number }',
        description:
          '#node 作用域插槽的上下文（对应 Angular CdkTreeNodeOutletContext）：node 为节点数据、level 为节点层级（0 起）、index 为节点在兄弟节点中的索引、count 为兄弟节点总数。',
      },
      {
        name: 'VTreeNodePublicApi',
        signature: 'interface VTreeNodePublicApi<T = any, K = any>',
        description:
          '树节点的公共 API（VTreeNode/VNestedTreeNode 均暴露，同时作为 TreeKeyManagerItem 的实现载体）：data/tree/element/isDisabled/isExpandable/isExpanded/level 只读属性；getLabel/getParent/getChildren 查询；activate/collapse/expand/focus/unfocus/makeFocusable 操作；_setActiveItem/_focusItem 内部供键盘管理器调用。',
      },
      {
        name: 'useVTreeNode',
        signature:
          'useVTreeNode(props: {node; isExpandable; isExpanded?; isDisabled; typeaheadLabel?}, emit, type: "flat" | "nested"): { tree; api; rootEl; tabindex; level; isExpandable; isExpanded }',
        description:
          '树节点共享 setup：注入树上下文、维护焦点/展开状态并完成节点注册；自定义节点组件可复用该组合式函数获得与内置节点一致的键盘与 ARIA 行为。',
      },
      {
        name: 'findParentTreeNode',
        signature: 'findParentTreeNode(el: HTMLElement): VTreeNodePublicApi | null',
        description: '沿 DOM 向上查找最近的已注册树节点实例；找不到返回 null，供 padding/toggle 指令使用。',
      },
      {
        name: 'registerTreeNodeElement',
        signature: 'registerTreeNodeElement(el: HTMLElement, node: VTreeNodePublicApi): void',
        description: '注册节点根元素到节点实例注册表（组件挂载时调用）。',
      },
      {
        name: 'unregisterTreeNodeElement',
        signature: 'unregisterTreeNodeElement(el: HTMLElement): void',
        description: '注销节点根元素（组件卸载时调用）。',
      },
    ],
  },
  {
    title: '错误函数',
    rows: [
      {
        name: 'getTreeNoValidDataSourceError',
        signature: 'getTreeNoValidDataSourceError(): Error',
        description: '未提供合法数据源时抛出的错误工厂。',
      },
      {
        name: 'getTreeMultipleDefaultNodeDefsError',
        signature: 'getTreeMultipleDefaultNodeDefsError(): Error',
        description: '存在多个无谓词的默认节点模板时抛出的错误工厂。',
      },
      {
        name: 'getTreeMissingMatchingNodeDefError',
        signature: 'getTreeMissingMatchingNodeDefError(): Error',
        description: '找不到匹配的节点模板时抛出的错误工厂。',
      },
      {
        name: 'getTreeControlMissingError',
        signature: 'getTreeControlMissingError(): Error',
        description: '缺少 treeControl / levelAccessor / childrenAccessor 任一层级来源时抛出的错误工厂。',
      },
      {
        name: 'getMultipleTreeControlsError',
        signature: 'getMultipleTreeControlsError(): Error',
        description: '同时提供多个层级来源（treeControl / levelAccessor / childrenAccessor）时抛出的错误工厂。',
      },
    ],
  },
];
