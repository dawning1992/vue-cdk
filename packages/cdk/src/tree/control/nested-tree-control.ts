/**
 * 嵌套树控制，移植自 Angular CDK tree 的 NestedTreeControl
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 与 Angular 的差异：子节点流使用仓库自研 Emitter 替代 RxJS Observable；
 * Emitter 无重放能力，异步子节点仅在派发后参与后代收集。
 */

import {BaseTreeControl} from './base-tree-control';
import {Emitter} from '../../emitter';

/** NestedTreeControl 可选的配置项。 */
export interface NestedTreeControlOptions<T, K> {
  /** 判断节点是否可展开；不提供时按后代数量推断。 */
  isExpandable?: (dataNode: T) => boolean;
  /** 节点稳定标识函数。 */
  trackBy?: (dataNode: T) => K;
}

/**
 * 嵌套树控制：基于 `getChildren` 函数递归工作。
 *
 * 使用前提：`dataNodes` 为树的根节点数组。
 */
export class NestedTreeControl<T, K = T> extends BaseTreeControl<T, K> {
  /**
   * @param getChildren 返回节点的直接子节点（数组或 Emitter 流）。
   * @param options 可选配置（isExpandable、trackBy）。
   */
  constructor(
    public override getChildren: (dataNode: T) => T[] | Emitter<T[]> | undefined | null,
    public options?: NestedTreeControlOptions<T, K>,
  ) {
    super();

    if (this.options) {
      this.trackBy = this.options.trackBy;
    }
    if (this.options?.isExpandable) {
      this.isExpandable = this.options.isExpandable;
    }
  }

  /**
   * 展开全部节点。
   *
   * 使用前提：`dataNodes` 为树根节点数组。
   */
  expandAll(): void {
    this.expansionModel.clear();
    const allNodes = this.dataNodes.reduce(
      (accumulator: T[], dataNode) => [...accumulator, ...this.getDescendants(dataNode), dataNode],
      [],
    );
    this.expansionModel.select(...allNodes.map(node => this._trackByValue(node)));
  }

  /** 递归获取以给定节点为根的子树全部后代节点。 */
  getDescendants(dataNode: T): T[] {
    const descendants: T[] = [];

    this._getDescendants(descendants, dataNode);
    // 去掉节点自身。
    return descendants.splice(1);
  }

  /** 递归收集后代；Emitter 子节点流取首帧后即退订。 */
  protected _getDescendants(descendants: T[], dataNode: T): void {
    descendants.push(dataNode);
    const childrenNodes = this.getChildren(dataNode);
    if (Array.isArray(childrenNodes)) {
      childrenNodes.forEach((child: T) => this._getDescendants(descendants, child));
    } else if (childrenNodes instanceof Emitter) {
      let unsub: () => void = () => undefined;
      unsub = childrenNodes.subscribe(children => {
        unsub();
        for (const child of children) {
          this._getDescendants(descendants, child);
        }
      });
    }
  }
}
