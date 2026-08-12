import {BaseOverlayDispatcher} from './base-overlay-dispatcher';
import {isBrowser} from '../../platform';

/**
 * 键盘事件分发器：在 body 上监听 keydown，只派发给最上层的、
 * 有订阅者且通过事件谓词的 overlay（与 Angular 行为一致——
 * 事件可能来自触发器，因此按栈序而非事件目标分发）。
 */
export class OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
  private _cleanup: (() => void) | undefined;

  override add(overlayRef: import('../overlay-ref').OverlayRef): void {
    super.add(overlayRef);
    if (!this._isAttached && isBrowser()) {
      document.body.addEventListener('keydown', this._keydownListener);
      this._cleanup = () => document.body.removeEventListener('keydown', this._keydownListener);
      this._isAttached = true;
    }
  }

  protected detach(): void {
    if (this._isAttached) {
      this._cleanup?.();
      this._cleanup = undefined;
      this._isAttached = false;
    }
  }

  private _keydownListener = (event: KeyboardEvent): void => {
    const overlays = this._attachedOverlays;
    for (let i = overlays.length - 1; i > -1; i--) {
      const overlayRef = overlays[i];
      if (this.canReceiveEvent(overlayRef, event, overlayRef._keydownEvents)) {
        overlayRef._keydownEvents.next(event);
        break;
      }
    }
  };
}

/** 默认键盘分发器单例。 */
export const overlayKeyboardDispatcher = new OverlayKeyboardDispatcher();
