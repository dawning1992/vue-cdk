/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/**
 * 高亮条目的键盘管理，对应 Angular CDK 的 ActiveDescendantKeyManager。
 *
 * 在 ListKeyManager 基础上，活动项变化时调用新旧条目的
 * `setActiveStyles` / `setInactiveStyles`，配合 `aria-activedescendant` 使用。
 */

import {ListKeyManager, type ListKeyManagerOption} from './list-key-manager';

/** 可高亮条目：必须实现激活/取消激活的样式切换方法。 */
export interface Highlightable extends ListKeyManagerOption {
  /** 应用活动态样式。 */
  setActiveStyles(): void;

  /** 取消活动态样式。 */
  setInactiveStyles(): void;
}

export class ActiveDescendantKeyManager<T> extends ListKeyManager<Highlightable & T> {
  override setActiveItem(index: number): void;
  override setActiveItem(item: T): void;
  override setActiveItem(item: T | number): void;

  override setActiveItem(item: any): void {
    // 先取消旧条目样式，再更新活动项并应用新样式。
    if (this.activeItem) {
      this.activeItem.setInactiveStyles();
    }

    super.setActiveItem(item);

    if (this.activeItem) {
      this.activeItem.setActiveStyles();
    }
  }
}
