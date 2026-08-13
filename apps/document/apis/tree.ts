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
        name: 'NestedTreeControl',
        signature: 'class NestedTreeControl<T, K = T> extends BaseTreeControl<T, K>',
        description:
          '嵌套树控制：构造参数 getChildren（返回数组或 Emitter 流，可带 {isExpandable, trackBy} 选项）；getDescendants 递归收集后代；异步子节点仅在派发后参与同步收集。',
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
];
