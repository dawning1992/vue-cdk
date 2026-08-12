/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：NgZone.runOutsideAngular 移除；overlay 豁免选择器改为 .vcdk-overlay-pane。
 */

/**
 * 轻量级惰性策略，对应 Angular CDK 的 EventListenerFocusTrapInertStrategy。
 *
 * 在 document 上挂载 focus 捕获监听，把聚焦到陷阱外的元素
 * 重定向回陷阱内。Angular 用 InjectionToken 注入策略，这里改为
 * 工厂/组合式的 options 参数。
 */

import type {ConfigurableFocusTrap} from './configurable-focus-trap';
import type {FocusTrapInertStrategy} from './focus-trap-inert-strategy';

export class EventListenerFocusTrapInertStrategy implements FocusTrapInertStrategy {
  /** focus 事件处理器；同一策略实例只保留一个监听。 */
  private _listener: ((event: FocusEvent) => void) | null = null;

  /** 添加 document 级 focus 监听，阻止焦点逃出陷阱。 */
  preventFocus(focusTrap: ConfigurableFocusTrap): void {
    // 确保每个 document 只有一个监听。
    if (this._listener) {
      focusTrap._document.removeEventListener('focus', this._listener, true);
    }

    this._listener = (event: FocusEvent) => this._trapFocus(focusTrap, event);
    focusTrap._document.addEventListener('focus', this._listener, true);
  }

  /** 移除 preventFocus 添加的监听。 */
  allowFocus(focusTrap: ConfigurableFocusTrap): void {
    if (!this._listener) {
      return;
    }
    focusTrap._document.removeEventListener('focus', this._listener, true);
    this._listener = null;
  }

  /**
   * 焦点事件目标在陷阱外时，延迟一帧检查并把焦点拉回陷阱内。
   * 延迟是为了兼容"销毁陷阱前先聚焦页面元素"的旧用法，
   * 同时避免 overlay 等与陷阱内元素关联的浮层被强制拉回。
   */
  private _trapFocus(focusTrap: ConfigurableFocusTrap, event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    const focusTrapRoot = focusTrap._element;

    if (target && !focusTrapRoot.contains(target) && !target.closest?.('.vcdk-overlay-pane')) {
      setTimeout(() => {
        if (focusTrap.enabled && !focusTrapRoot.contains(focusTrap._document.activeElement)) {
          focusTrap.focusFirstTabbableElement();
        }
      });
    }
  }
}
