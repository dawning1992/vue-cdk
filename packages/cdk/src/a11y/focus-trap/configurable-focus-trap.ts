/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/**
 * 可配置的焦点陷阱，对应 Angular CDK 的 ConfigurableFocusTrap。
 *
 * 在 FocusTrap 基础上接入 FocusTrapManager 栈管理，并通过
 * FocusTrapInertStrategy 决定"如何让区域外元素不可聚焦"。
 */

import type {InteractivityChecker} from './interactivity-checker';
import type {ConfigurableFocusTrapConfig} from './configurable-focus-trap-config';
import {FocusTrap} from './focus-trap';
import type {FocusTrapInertStrategy} from './focus-trap-inert-strategy';
import type {FocusTrapManager, ManagedFocusTrap} from './focus-trap-manager';

export class ConfigurableFocusTrap extends FocusTrap implements ManagedFocusTrap {
  override get enabled(): boolean {
    return this._enabled;
  }
  override set enabled(value: boolean) {
    this._enabled = value;

    // 启用时进入管理器栈（停用其他陷阱），停用时退出栈。
    if (this._enabled) {
      this._focusTrapManager.register(this);
    } else {
      this._focusTrapManager.deregister(this);
    }
  }

  constructor(
    _element: HTMLElement,
    _checker: InteractivityChecker,
    _document: Document,
    private _focusTrapManager: FocusTrapManager,
    private _inertStrategy: FocusTrapInertStrategy,
    config: ConfigurableFocusTrapConfig,
  ) {
    super(_element, _checker, _document, config.defer);
    this._focusTrapManager.register(this);
  }

  /** 销毁前从管理器栈中移除。 */
  override destroy(): void {
    this._focusTrapManager.deregister(this);
    super.destroy();
  }

  /** @internal ManagedFocusTrap 实现：应用惰性策略并开启锚点拦截。 */
  _enable(): void {
    this._inertStrategy.preventFocus(this);
    this.toggleAnchors(true);
  }

  /** @internal ManagedFocusTrap 实现：撤销惰性策略并关闭锚点拦截。 */
  _disable(): void {
    this._inertStrategy.allowFocus(this);
    this.toggleAnchors(false);
  }
}
