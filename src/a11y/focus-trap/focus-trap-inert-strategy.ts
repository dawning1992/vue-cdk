/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/**
 * 焦点陷阱的"惰性"策略接口，对应 Angular CDK 的 FocusTrapInertStrategy。
 *
 * 策略决定如何阻止陷阱外的元素被聚焦（preventFocus），
 * 以及如何恢复被改动的元素（allowFocus）。
 */

import type {FocusTrap} from './focus-trap';

/** 惰性策略接口：由 ConfigurableFocusTrap 在启用/停用时调用。 */
export interface FocusTrapInertStrategy {
  /** 使陷阱外所有元素不可聚焦。 */
  preventFocus(focusTrap: FocusTrap): void;

  /** 恢复 preventFocus 所做的改动。 */
  allowFocus(focusTrap: FocusTrap): void;
}
