/**
 * 虚拟滚动树（VVirtualScrollTree）的公共类型定义。
 *
 * 数据契约：
 * - 全量模式：`data` 直接提供根节点数组（可含 children），组件按展开状态过滤渲染；
 * - 懒加载模式：`loadChildren(parent, page)` 按「父节点」分页取子节点，
 *   `parent === null` 表示根层级，保证每一层（含根层）都独立维护分页状态。
 */

/** 单页分页信息，`offset` 表示本次请求起始偏移（即已加载条数）。 */
export interface PageInfo {
  /** 页序号，从 0 开始。 */
  page: number;
  /** 每页条数（组件 `pageSize` prop 决定）。 */
  pageSize: number;
  /** 已加载子节点数量，等价于 `page * pageSize`。 */
  offset: number;
}

/**
 * 懒加载一页的结果。
 * `hasMore` 缺省为 false：不返回时组件认为该层已全部加载，后续不再发起请求。
 */
export interface LoadChildrenResult<T> {
  /** 本页子节点。 */
  children: T[];
  /** 是否还有下一页；缺省 false（单页加载）。 */
  hasMore?: boolean;
}

/**
 * 懒加载函数：按父节点分页获取子节点。
 * @param parent 父节点；`null` 表示根层级。
 * @param page 分页信息。
 */
export type LoadChildren<T> = (
  parent: T | null,
  page: PageInfo,
) => Promise<LoadChildrenResult<T>> | LoadChildrenResult<T>;

/** 节点接入函数集合；全部可选，未提供时使用默认约定（见各字段说明）。 */
export interface VirtualScrollTreeAccessors<T, K = T> {
  /**
   * 节点稳定标识；默认以节点自身为标识。
   * 懒加载（服务器数据）场景建议返回 `node.id` 等稳定值，避免对象引用变化导致缓存失效。
   */
  getKey?: (node: T) => K;
  /**
   * 节点是否可展开。
   * - 全量模式缺省按 `getChildren` 结果推断（非空即可展开）；
   * - 懒加载模式缺省先视为可展开，首次加载返回空且 `hasMore=false` 后自动修正为叶子。
   */
  isExpandable?: (node: T) => boolean;
  /** 获取节点的直接子节点（全量模式使用）；缺省读取 `node.children`。 */
  getChildren?: (node: T) => readonly T[] | null | undefined;
}

/**
 * `#node` 作用域插槽上下文：与 tree 模块的 `VTreeNodeContext` 字段保持一致，
 * 并扩展懒加载/展开相关的只读状态，供节点模板渲染加载态与展开控件。
 */
export interface VirtualScrollTreeSlotContext<T> {
  /** 节点数据。 */
  node: T;
  /** 节点层级（0 起）。 */
  level: number;
  /** 节点在扁平可见列表中的索引（虚拟滚动视角）。 */
  index: number;
  /** 扁平可见节点总数。 */
  count: number;
  /** 节点当前是否展开。 */
  isExpanded: boolean;
  /** 节点是否可展开（懒加载未加载时可能为 true，加载后自动修正）。 */
  isExpandable: boolean;
  /** 该节点的子级是否正在加载中（懒加载模式；全量模式恒 false）。 */
  isLoading: boolean;
  /** 该节点是否还有未加载的子级分页（懒加载模式）。 */
  hasMore: boolean;
  /** 该节点最近一次子级加载是否失败。 */
  isError: boolean;
}
