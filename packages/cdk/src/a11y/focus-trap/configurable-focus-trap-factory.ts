/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：FOCUS_TRAP_INERT_STRATEGY InjectionToken → 工厂/组合式 options 参数。
 */

/**
 * 可配置焦点陷阱的工厂，对应 Angular CDK 的 ConfigurableFocusTrapFactory。
 */

import {focusTrapManager} from './focus-trap-manager';
import {ConfigurableFocusTrap} from './configurable-focus-trap';
import type {ConfigurableFocusTrapConfig} from './configurable-focus-trap-config';
import {EventListenerFocusTrapInertStrategy} from './event-listener-inert-strategy';
import type {FocusTrapInertStrategy} from './focus-trap-inert-strategy';
import {InteractivityChecker} from './interactivity-checker';

/** 创建配置：在 ConfigurableFocusTrapConfig 基础上允许覆盖惰性策略。 */
export interface ConfigurableFocusTrapFactoryOptions extends ConfigurableFocusTrapConfig {
  /** 惰性策略；缺省使用 EventListenerFocusTrapInertStrategy。 */
  inertStrategy?: FocusTrapInertStrategy;
}

export class ConfigurableFocusTrapFactory {
  private _checker = new InteractivityChecker();
  private _focusTrapManager = focusTrapManager;
  private _inertStrategy: FocusTrapInertStrategy;

  constructor(options?: {inertStrategy?: FocusTrapInertStrategy}) {
    this._inertStrategy = options?.inertStrategy ?? new EventListenerFocusTrapInertStrategy();
  }

  /** 创建可配置焦点陷阱。 */
  create(
    element: HTMLElement,
    config: ConfigurableFocusTrapFactoryOptions = {defer: false},
  ): ConfigurableFocusTrap {
    return new ConfigurableFocusTrap(
      element,
      this._checker,
      document,
      this._focusTrapManager,
      config.inertStrategy ?? this._inertStrategy,
      config,
    );
  }
}

/** 全局单例工厂。 */
export const configurableFocusTrapFactory = new ConfigurableFocusTrapFactory();
