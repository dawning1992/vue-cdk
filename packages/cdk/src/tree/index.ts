/**
 * tree 模块入口，对齐 Angular CDK 的 `@angular/cdk/tree`。
 *
 * 覆盖能力：
 * - 组件：VTree / VTreeNode / VNestedTreeNode（#node 作用域插槽承担节点模板）；
 * - 指令：vTreeNodePadding / vTreeNodeToggle；
 * - 控制：TreeControl / BaseTreeControl / FlatTreeControl / NestedTreeControl；
 * - 类型：VTreeNodeContext / VTreeContext / VTreePublicApi 等。
 *
 * 与 Angular 的差异：节点模板使用作用域插槽替代结构指令，
 * 嵌套子节点自动渲染（无需 cdkTreeNodeOutlet），条件模板用插槽内 v-if 实现。
 */

export * from './control/base-tree-control';
export * from './control/flat-tree-control';
export * from './control/nested-tree-control';
export * from './control/tree-control';
export * from './node';
export * from './nested-node';
export * from './padding';
export * from './toggle';
export * from './tree';
export * from './tree-errors';
