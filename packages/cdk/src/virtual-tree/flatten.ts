/**
 * 虚拟滚动树扁平化：把「已加载且展开」的节点按 DFS 展开为可见列表，
 * 同时维护层级、父节点、兄弟组（aria）与各父节点的「最后一个已加载子节点索引」，
 * 后者是滚动边界触发加载的依据。
 */

import {ROOT_KEY, type LevelState} from './level-state';

/** 扁平化所需的依赖回调集合（由组件注入，便于纯函数单测）。 */
export interface FlattenDeps<T, K> {
  /** 当前根节点（已加载部分）。 */
  roots: readonly T[];
  /** 节点稳定标识。 */
  getKey(node: T): K;
  /** 节点是否展开。 */
  isExpanded(node: T): boolean;
  /** 节点是否可展开。 */
  isExpandable(node: T): boolean;
  /** 获取节点已加载的直接子节点（全量模式即全部子节点）。 */
  getLoadedChildren(node: T): readonly T[];
}

/** 扁平化结果：可见列表与各索引/分组映射。 */
export interface FlattenResult<T, K> {
  /** 扁平可见节点列表（虚拟滚动的数据源）。 */
  flat: readonly T[];
  /** 节点 key → 层级（0 起）。 */
  levels: Map<K, number>;
  /** 节点 key → 父节点 key；根节点为 ROOT_KEY。 */
  parents: Map<K, K | typeof ROOT_KEY>;
  /** 节点 key → 同级（已加载）数量，供 aria-setsize。 */
  setSizes: Map<K, number>;
  /** 节点 key → 同级中的位置（1 起），供 aria-posinset。 */
  posInSets: Map<K, number>;
  /**
   * 父节点 key（含 ROOT_KEY）→ 该父节点最后一个已加载子节点的扁平索引。
   * 渲染区间接近该索引时触发该父节点的下一页加载。
   */
  boundaryLastChild: Map<K | typeof ROOT_KEY, number>;
  /** 节点 key → 节点数据（仅当前可见节点）。 */
  nodesByKey: Map<K, T>;
}

/**
 * 按展开状态 DFS 扁平化可见节点，并填充上述映射。
 * 子节点仅在父节点「展开且可展开」时进入列表；边界索引只记录直接子节点的最后位置。
 */
export function flattenTree<T, K>(deps: FlattenDeps<T, K>): FlattenResult<T, K> {
  const flat: T[] = [];
  const levels = new Map<K, number>();
  const parents = new Map<K, K | typeof ROOT_KEY>();
  const setSizes = new Map<K, number>();
  const posInSets = new Map<K, number>();
  const boundaryLastChild = new Map<K | typeof ROOT_KEY, number>();
  const nodesByKey = new Map<K, T>();

  /** 记录一组兄弟节点的分组信息（含把它们登记进 nodesByKey/parents）。 */
  function setGroup(nodes: readonly T[], parentKey: K | typeof ROOT_KEY): void {
    nodes.forEach((node, index) => {
      const key = deps.getKey(node);
      setSizes.set(key, nodes.length);
      posInSets.set(key, index + 1);
      nodesByKey.set(key, node);
      parents.set(key, parentKey);
    });
  }

  setGroup(deps.roots, ROOT_KEY);

  /** 遍历一层节点并递归下钻展开的子节点；返回该层最后一个直接子节点的扁平索引。 */
  function walk(nodes: readonly T[], depth: number): number {
    let lastDirectIndex = -1;
    for (const node of nodes) {
      const key = deps.getKey(node);
      const index = flat.length;
      flat.push(node);
      lastDirectIndex = index;
      levels.set(key, depth);

      if (deps.isExpanded(node) && deps.isExpandable(node)) {
        const children = deps.getLoadedChildren(node);
        if (children.length) {
          setGroup(children, key);
          boundaryLastChild.set(key, walk(children, depth + 1));
        }
      }
    }
    return lastDirectIndex;
  }

  boundaryLastChild.set(ROOT_KEY, walk(deps.roots, 0));
  return {flat, levels, parents, setSizes, posInSets, boundaryLastChild, nodesByKey};
}

export type {LevelState};
