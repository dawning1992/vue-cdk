/**
 * 树控制接口，移植自 Angular CDK tree 的 TreeControl
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 与 Angular 的差异：子节点流使用仓库自研 Emitter 替代 RxJS Observable。
 */

import type {Emitter} from '../../emitter';
import type {SelectionModel} from '../../collections';

/**
 * 树控制接口：用户可实现该接口来展开/收起树中的数据节点。
 * `VTree` 会使用该控制处理节点的展开状态，用户也可在树外直接操作它。
 */
export interface TreeControl<T, K = T> {
  /** 树根节点数据（`expandAll` 依赖）。 */
  dataNodes: T[];

  /** 展开状态选择模型。 */
  expansionModel: SelectionModel<K>;

  /** 节点是否展开。 */
  isExpanded(dataNode: T): boolean;

  /** 获取节点的全部后代节点。 */
  getDescendants(dataNode: T): T[];

  /** 切换节点展开/收起。 */
  toggle(dataNode: T): void;

  /** 展开节点。 */
  expand(dataNode: T): void;

  /** 收起节点。 */
  collapse(dataNode: T): void;

  /** 展开全部节点。 */
  expandAll(): void;

  /** 收起全部节点。 */
  collapseAll(): void;

  /** 切换节点及其全部后代的展开状态。 */
  toggleDescendants(dataNode: T): void;

  /** 展开节点及其全部后代。 */
  expandDescendants(dataNode: T): void;

  /** 收起节点及其全部后代。 */
  collapseDescendants(dataNode: T): void;

  /** 返回节点的层级深度（扁平树使用）。 */
  readonly getLevel: (dataNode: T) => number;

  /** 节点是否可展开（扁平树使用）。 */
  readonly isExpandable: (dataNode: T) => boolean;

  /** 获取节点的直接子节点（嵌套树使用）。 */
  readonly getChildren: (dataNode: T) => T[] | Emitter<T[]> | undefined | null;
}
