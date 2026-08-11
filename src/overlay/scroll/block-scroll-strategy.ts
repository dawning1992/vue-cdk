import type {ScrollStrategy} from './scroll-strategy';
import {viewportRuler} from '../../scrolling';
import {coerceCssPixelValue} from '../../coercion';
import {isBrowser} from '../../platform';

/**
 * 阻止页面滚动的策略：将 html 根元素固定到当前滚动位置。
 *
 * 兼容性说明：通过全局类 `vcdk-overlay-global-scrollblock` 保证多个 overlay
 * 同时开启时只锁定一次；禁用时先临时关闭 smooth scroll 再恢复滚动位置，
 * 避免平滑滚动导致定位漂移。
 */
export class BlockScrollStrategy implements ScrollStrategy {
  private _previousHTMLStyles = {top: '', left: ''};
  private _previousScrollPosition: {top: number; left: number} | undefined;
  private _isEnabled = false;
  private _document: Document | null;

  constructor(documentRef?: Document | null) {
    this._document = documentRef ?? (isBrowser() ? window.document : null);
  }

  attach(): void {}

  enable(): void {
    if (!this._canBeEnabled()) {
      return;
    }
    const root = this._document!.documentElement;
    this._previousScrollPosition = viewportRuler.getViewportScrollPosition();

    // 缓存用户已有的内联样式，退出时原样恢复。
    this._previousHTMLStyles.left = root.style.left || '';
    this._previousHTMLStyles.top = root.style.top || '';

    root.style.left = coerceCssPixelValue(-this._previousScrollPosition.left);
    root.style.top = coerceCssPixelValue(-this._previousScrollPosition.top);
    root.classList.add('vcdk-overlay-global-scrollblock');
    this._isEnabled = true;
  }

  disable(): void {
    if (!this._isEnabled) {
      return;
    }
    const html = this._document!.documentElement;
    const body = this._document!.body;
    const previousHtmlScrollBehavior = html.style.scrollBehavior || '';
    const previousBodyScrollBehavior = body.style.scrollBehavior || '';

    this._isEnabled = false;
    html.style.left = this._previousHTMLStyles.left;
    html.style.top = this._previousHTMLStyles.top;
    html.classList.remove('vcdk-overlay-global-scrollblock');

    // 恢复滚动位置期间临时禁用平滑滚动，避免与用户配置冲突。
    if ('scrollBehavior' in html.style) {
      html.style.scrollBehavior = 'auto';
      body.style.scrollBehavior = 'auto';
    }
    window.scroll(this._previousScrollPosition!.left, this._previousScrollPosition!.top);
    if ('scrollBehavior' in html.style) {
      html.style.scrollBehavior = previousHtmlScrollBehavior;
      body.style.scrollBehavior = previousBodyScrollBehavior;
    }
  }

  detach(): void {}

  /**
   * 页面本身不可滚动时无需锁定；若已有其他 overlay 正在锁定，
   * 也不重复锁定（由全局类保证）。
   */
  private _canBeEnabled(): boolean {
    const root = this._document?.documentElement;
    if (!root) {
      return false;
    }
    if (root.classList.contains('vcdk-overlay-global-scrollblock') || this._isEnabled) {
      return false;
    }
    const viewport = viewportRuler.getViewportSize();
    return root.scrollHeight > viewport.height || root.scrollWidth > viewport.width;
  }
}

/** 创建阻止页面滚动的策略。 */
export function createBlockScrollStrategy(documentRef?: Document | null): BlockScrollStrategy {
  return new BlockScrollStrategy(documentRef);
}
