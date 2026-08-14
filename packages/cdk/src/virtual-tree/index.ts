/**
 * virtual-tree 模块入口：虚拟滚动树。
 *
 * 能力：
 * - 组件：VVirtualScrollTree（全量/懒加载两种数据模式，固定行高虚拟滚动）；
 * - 懒加载按父节点（含根层级）独立分页，滚动接近边界时自动加载下一页，
 *   内存缓存 + hasMore 标记保证不重复请求；
 * - #node 插槽复用 tree 模块的 VTreeNode / vTreeNodePadding / vTreeNodeToggle，
 *   键盘导航基于扁平索引并支持跨虚拟窗口滚动入视。
 */

export {
  VVirtualScrollTree,
  type VVirtualScrollTreePublicApi,
} from './virtual-scroll-tree';
export type {
  LoadChildren,
  LoadChildrenResult,
  PageInfo,
  VirtualScrollTreeAccessors,
  VirtualScrollTreeSlotContext,
} from './types';
