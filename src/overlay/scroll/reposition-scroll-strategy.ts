import type {OverlayRef} from '../overlay-ref';
import type {ScrollStrategy} from './scroll-strategy';
import {getScrollStrategyAlreadyAttachedError} from './scroll-strategy';
import {scrollDispatcher} from '../../scrolling';
import {viewportRuler} from '../../scrolling';
import {isBrowser} from '../../platform';

/** Reposition 滚动策略的配置。 */
export interface RepositionScrollStrategyConfig {
  /** 滚动事件节流间隔（毫秒）。 */
  scrollThrottle?: number;
  /** 滚动到 overlay 完全移出视口后自动关闭。 */
  autoClose?: boolean;
}

/**
 * 滚动时重新计算 overlay 位置；可选 autoClose：
 * 当 overlay 的矩形完全移出视口时自动关闭。
 */
export class RepositionScrollStrategy implements ScrollStrategy {
  private _unsubscribe: (() => void) | undefined;
  private _overlayRef: OverlayRef | null = null;

  constructor(private _config?: RepositionScrollStrategyConfig) {}

  attach(overlayRef: OverlayRef): void {
    if (this._overlayRef) {
      throw getScrollStrategyAlreadyAttachedError();
    }
    this._overlayRef = overlayRef;
  }

  enable(): void {
    if (this._unsubscribe) {
      return;
    }
    const throttle = this._config?.scrollThrottle ?? 0;
    this._unsubscribe = scrollDispatcher.scrolled(throttle).subscribe(() => {
      this._overlayRef?.updatePosition();
      if (this._config?.autoClose && isBrowser()) {
        const overlayRect = this._overlayRef!.overlayElement.getBoundingClientRect();
        const {width, height} = viewportRuler.getViewportSize();
        if (
          overlayRect.bottom < 0 ||
          overlayRect.right < 0 ||
          overlayRect.top > height ||
          overlayRect.left > width
        ) {
          this.disable();
          if (this._overlayRef?.hasAttached()) {
            this._overlayRef.detach();
          }
        }
      }
    });
  }

  disable(): void {
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }

  detach(): void {
    this.disable();
    this._overlayRef = null;
  }
}

/** 创建随滚动重新定位的策略。 */
export function createRepositionScrollStrategy(
  config?: RepositionScrollStrategyConfig,
): RepositionScrollStrategy {
  return new RepositionScrollStrategy(config);
}
