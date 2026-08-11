import type {OverlayRef} from '../overlay-ref';
import type {ScrollStrategy} from './scroll-strategy';
import {getScrollStrategyAlreadyAttachedError} from './scroll-strategy';
import {scrollDispatcher, type ScrollEventSource} from '../../scrolling';
import {viewportRuler} from '../../scrolling';

/** Close 滚动策略的配置。 */
export interface CloseScrollStrategyConfig {
  /** 用户滚动多少像素后关闭 overlay；未配置则任何滚动都立即关闭。 */
  threshold?: number;
}

/**
 * 用户开始滚动时关闭 overlay。
 * 配置 threshold 后，仅当滚动距离超过阈值才关闭，未超过时仅重新定位。
 */
export class CloseScrollStrategy implements ScrollStrategy {
  private _unsubscribe: (() => void) | undefined;
  private _overlayRef: OverlayRef | null = null;
  private _initialScrollPosition = 0;

  constructor(private _config?: CloseScrollStrategyConfig) {}

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

    const threshold = this._config?.threshold;
    if (threshold && threshold > 1) {
      this._initialScrollPosition = viewportRuler.getViewportScrollPosition().top;
      this._unsubscribe = scrollDispatcher.scrolled(0, source => {
        if (!this._canHandle(source)) {
          return;
        }
        const current = viewportRuler.getViewportScrollPosition().top;
        if (Math.abs(current - this._initialScrollPosition) > threshold) {
          this._detachOverlay();
        } else {
          this._overlayRef?.updatePosition();
        }
      });
    } else {
      this._unsubscribe = scrollDispatcher.scrolled(0, source => {
        if (this._canHandle(source)) {
          this._detachOverlay();
        }
      });
    }
  }

  disable(): void {
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }

  detach(): void {
    this.disable();
    this._overlayRef = null;
  }

  /** 忽略发生在 overlay 面板内部的滚动，避免内容自身滚动导致误关闭。 */
  private _canHandle(source: ScrollEventSource): boolean {
    const overlayElement = this._overlayRef?.overlayElement;
    if (!overlayElement || !(source.element instanceof HTMLElement)) {
      return true;
    }
    return !overlayElement.contains(source.element);
  }

  private _detachOverlay(): void {
    this.disable();
    if (this._overlayRef?.hasAttached()) {
      this._overlayRef.detach();
    }
  }
}

/** 创建 Close 滚动策略。 */
export function createCloseScrollStrategy(config?: CloseScrollStrategyConfig): CloseScrollStrategy {
  return new CloseScrollStrategy(config);
}
