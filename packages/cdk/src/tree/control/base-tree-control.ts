/**
 * 树控制基类，移植自 Angular CDK tree 的 BaseTreeControl
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 与 Angular 的差异：子节点流使用仓库自研 Emitter 替代 RxJS Observable。
 */

import {SelectionModel} from '../../collections';
import type {Emitter} from '../../emitter';
import type {TreeControl} from './tree-control';

/**
 * 树控制基类：提供单个数据节点的展开/收起/切换等基础操作，
 * 以及子树级别的展开/收起（需要子类实现 `getDescendants`）。
 */
export abstract class BaseTreeControl<T, K = T> implements TreeControl<T, K> {
  /** 递归获取以给定节点为根的子树全部后代节点。 */
  abstract getDescendants(dataNode: T): T[];

  /** 展开全部数据节点。 */
  abstract expandAll(): void;

  /** 树数据节点（由调用方在操作前赋值）。 */
  dataNodes!: T[];

  /** 多选选择模型，用于跟踪展开状态。 */
  expansionModel: SelectionModel<K> = new SelectionModel<K>(true);

  /**
   * 返回数据节点的稳定标识，用于在节点引用变化时保持展开状态。
   * 语义类似 Vue 的 `v-for` `key` / Angular 的 `ngFor` `trackBy`。
   */
  trackBy?: (dataNode: T) => K;

  /** 获取节点层级（扁平树）。 */
  getLevel!: (dataNode: T) => number;

  /** 节点是否可展开（扁平树）。 */
  isExpandable!: (dataNode: T) => boolean;

  /** 获取节点的直接子节点（嵌套树）。 */
  getChildren!: (dataNode: T) => T[] | Emitter<T[]> | undefined | null;

  /** 切换单个节点的展开/收起状态。 */
  toggle(dataNode: T): void {
    this.expansionModel.toggle(this._trackByValue(dataNode));
  }

  /** 展开单个节点。 */
  expand(dataNode: T): void {
    this.expansionModel.select(this._trackByValue(dataNode));
  }

  /** 收起单个节点。 */
  collapse(dataNode: T): void {
    this.expansionModel.deselect(this._trackByValue(dataNode));
  }

  /** 节点当前是否展开。 */
  isExpanded(dataNode: T): boolean {
    return this.expansionModel.isSelected(this._trackByValue(dataNode));
  }

  /** 递归切换以给定节点为根的子树展开状态。 */
  toggleDescendants(dataNode: T): void {
    this.expansionModel.isSelected(this._trackByValue(dataNode))
      ? this.collapseDescendants(dataNode)
      : this.expandDescendants(dataNode);
  }

  /** 收起树中全部节点。 */
  collapseAll(): void {
    this.expansionModel.clear();
  }

  /** 展开以给定节点为根的子树。 */
  expandDescendants(dataNode: T): void {
    const toBeProcessed = [dataNode, ...this.getDescendants(dataNode)];
    this.expansionModel.select(...toBeProcessed.map(value => this._trackByValue(value)));
  }

  /** 收起以给定节点为根的子树。 */
  collapseDescendants(dataNode: T): void {
    const toBeProcessed = [dataNode, ...this.getDescendants(dataNode)];
    this.expansionModel.deselect(...toBeProcessed.map(value => this._trackByValue(value)));
  }

  /** 将数据节点转换为选择模型使用的标识。 */
  protected _trackByValue(value: T | K): K {
    return this.trackBy ? this.trackBy(value as T) : (value as K);
  }
}
