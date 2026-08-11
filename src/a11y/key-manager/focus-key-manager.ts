/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/**
 * 可聚焦条目的键盘管理，对应 Angular CDK 的 FocusKeyManager。
 *
 * 在 ListKeyManager 基础上，活动项变化时会调用条目的 `focus(origin)`
 * 方法，origin 由 `setFocusOrigin` 指定，默认 'program'。
 */

import type {FocusOrigin} from '../focus-monitor/focus-monitor';
import {ListKeyManager, type ListKeyManagerOption} from './list-key-manager';

/** 可聚焦条目：除 ListKeyManagerOption 外必须实现 focus 方法。 */
export interface FocusableOption extends ListKeyManagerOption {
  /** 聚焦自身，origin 用于告知聚焦来源。 */
  focus(origin?: FocusOrigin): void;
}

export class FocusKeyManager<T> extends ListKeyManager<FocusableOption & T> {
  private _origin: FocusOrigin = 'program';

  /** 设置后续 focus 调用传入的聚焦来源。 */
  setFocusOrigin(origin: FocusOrigin): this {
    this._origin = origin;
    return this;
  }

  override setActiveItem(index: number): void;
  override setActiveItem(item: T): void;
  override setActiveItem(item: T | number): void;

  override setActiveItem(item: any): void {
    super.setActiveItem(item);

    if (this.activeItem) {
      this.activeItem.focus(this._origin);
    }
  }
}
