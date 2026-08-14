/**
 * 虚拟滚动树每「父节点」独立的分页加载状态与内存缓存。
 *
 * 状态与节点数据分离：用户数据（T）不携带加载元信息，
 * 组件在实例内以 `Map<key, LevelState>` 维护缓存，随组件销毁释放（不持久化）。
 */

/** 根层级的父标识：`loadChildren(null, page)` 对应的内部缓存键。 */
export const ROOT_KEY: unique symbol = Symbol('vcdk-virtual-tree-root');

/** 单个父节点子级的分页加载状态。 */
export interface LevelState<T> {
  /** 已加载的直接子节点（按页追加）。 */
  children: T[];
  /** 是否还有下一页；为 false 后不再发起请求。 */
  hasMore: boolean;
  /** 请求进行中标志，用于防重入。 */
  loading: boolean;
  /** 已成功加载的页数。 */
  page: number;
  /** 每页条数。 */
  pageSize: number;
  /** 最近一次请求错误；非 null 时自动触发被抑制，需 `retry`/`clearCache` 恢复。 */
  error: Error | null;
  /** 是否至少成功加载过一页（用于懒加载模式下区分「未加载」与「已加载空层」）。 */
  loaded: boolean;
}

/**
 * 创建初始分页状态。
 * `hasMore` 初始为 true 表示「需要加载」，首次加载后由 `LoadChildrenResult.hasMore` 决定。
 */
export function createLevelState<T>(pageSize: number): LevelState<T> {
  return {
    children: [],
    hasMore: true,
    loading: false,
    page: 0,
    pageSize,
    error: null,
    loaded: false,
  };
}
