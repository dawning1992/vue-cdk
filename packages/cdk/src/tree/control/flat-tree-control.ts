/**
 * 扁平树控制，移植自 Angular CDK tree 的 FlatTreeControl
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

import {BaseTreeControl} from './base-tree-control';

/** FlatTreeControl 可选的配置项。 */
export interface FlatTreeControlOptions<T, K> {
  /** 节点稳定标识函数，用于跨引用变化保持展开状态。 */
  trackBy?: (dataNode: T) => K;
}

/**
 * 扁平树控制：基于 `getLevel` 与 `isExpandable` 两个函数工作。
 *
 * 使用前提：`dataNodes` 必须为带正确层级信息的扁平节点数组。
 */
export class FlatTreeControl<T, K = T> extends BaseTreeControl<T, K> {
  /**
   * @param getLevel 返回节点层级。
   * @param isExpandable 判断节点是否可展开。
   * @param options 可选配置（trackBy）。
   */
  constructor(
    public override getLevel: (dataNode: T) => number,
    public override isExpandable: (dataNode: T) => boolean,
    public options?: FlatTreeControlOptions<T, K>,
  ) {
    super();

    if (this.options) {
      this.trackBy = this.options.trackBy;
    }
  }

  /**
   * 获取节点子树中的全部后代节点。
   *
   * 算法基于扁平数组：从节点后一个位置开始扫描，
   * 层级不大于当前节点的位置即代表同级或祖先同级，扫描停止。
   */
  getDescendants(dataNode: T): T[] {
    const startIndex = this.dataNodes.indexOf(dataNode);
    const results: T[] = [];

    for (
      let i = startIndex + 1;
      i < this.dataNodes.length && this.getLevel(dataNode) < this.getLevel(this.dataNodes[i]);
      i++
    ) {
      results.push(this.dataNodes[i]);
    }
    return results;
  }

  /**
   * 展开全部节点。
   *
   * 使用前提：`dataNodes` 已包含树中全部扁平节点。
   */
  expandAll(): void {
    this.expansionModel.select(...this.dataNodes.map(node => this._trackByValue(node)));
  }
}
