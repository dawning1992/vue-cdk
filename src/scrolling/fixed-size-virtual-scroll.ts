/**
 * 固定尺寸虚拟滚动策略，算法与 Angular CDK 的 FixedSizeVirtualScrollStrategy 逐行对齐。
 * 移植自 Angular CDK scrolling（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 前提：所有条目尺寸相同（itemSize），因此无需测量渲染项即可推算
 * 总内容尺寸与应渲染区间，滚动期间只做纯计算，性能最佳。
 */

import {Emitter} from '../emitter';
import type {ListRange} from '../collections';
import type {
  VirtualScrollStrategy,
  VirtualScrollViewportAdapter,
} from './virtual-scroll-strategy';

/** 固定尺寸虚拟滚动策略。 */
export class FixedSizeVirtualScrollStrategy implements VirtualScrollStrategy {
  /** 首个可见项索引变化流（连续相同值去重）。 */
  readonly scrolledIndexChange = new Emitter<number>();

  private _viewport: VirtualScrollViewportAdapter | null = null;
  private _itemSize: number;
  private _minBufferPx: number;
  private _maxBufferPx: number;
  private _lastEmittedIndex: number | null = null;

  /**
   * @param itemSize 条目尺寸（像素）。
   * @param minBufferPx 视口外至少保留的缓冲（像素），低于该值触发补渲染。
   * @param maxBufferPx 补渲染时恢复到该缓冲量（像素）。
   */
  constructor(itemSize: number, minBufferPx: number, maxBufferPx: number) {
    this._itemSize = itemSize;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
  }

  /** 挂载到视口并完成首次总尺寸/渲染区间计算。 */
  attach(viewport: VirtualScrollViewportAdapter): void {
    this._viewport = viewport;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /** 卸载并结束 scrolledIndexChange 事件流。 */
  detach(): void {
    this.scrolledIndexChange.complete();
    this._viewport = null;
  }

  /**
   * 更新条目与缓冲参数（如 itemSize/minBufferPx/maxBufferPx 属性变化）。
   * @throws 当 maxBufferPx 小于 minBufferPx 时抛错（开发期校验）。
   */
  updateItemAndBufferSize(itemSize: number, minBufferPx: number, maxBufferPx: number): void {
    if (maxBufferPx < minBufferPx) {
      throw Error('Vue CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
    }
    this._itemSize = itemSize;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  onContentScrolled(): void {
    this._updateRenderedRange();
  }

  onDataLengthChanged(): void {
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  onContentRendered(): void {
    // 固定尺寸策略不需要测量渲染项，无需响应渲染完成。
  }

  onRenderedOffsetChanged(): void {
    // 固定尺寸策略通过 transform 偏移渲染内容，无需额外补偿。
  }

  /** 滚动到指定索引：偏移 = index * itemSize。 */
  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    if (this._viewport) {
      this._viewport.scrollToOffset(index * this._itemSize, behavior);
    }
  }

  /** 按数据长度与条目尺寸更新总内容尺寸。 */
  private _updateTotalContentSize(): void {
    if (!this._viewport) {
      return;
    }
    this._viewport.setTotalContentSize(this._viewport.getDataLength() * this._itemSize);
  }

  /**
   * 计算应渲染区间并应用到视口。
   *
   * 核心规则（与 Angular 一致）：
   * - 首可见项 = 滚动偏移 / itemSize；
   * - 数据变短时收缩区间并尽量保持可见位置；
   * - 视口起点方向缓冲不足 minBufferPx 时向前扩张到 maxBufferPx；
   * - 终点缓冲不足时向后扩张并回拉起点。
   */
  private _updateRenderedRange(): void {
    if (!this._viewport) {
      return;
    }

    const renderedRange = this._viewport.getRenderedRange();
    const newRange: ListRange = {start: renderedRange.start, end: renderedRange.end};
    const viewportSize = this._viewport.getViewportSize();
    const dataLength = this._viewport.getDataLength();
    let scrollOffset = this._viewport.measureScrollOffset();
    // itemSize 为 0 时避免除零产生 NaN。
    let firstVisibleIndex = this._itemSize > 0 ? scrollOffset / this._itemSize : 0;

    // 用户滚到底部后数据变短：按新数据量重算可见区间。
    if (newRange.end > dataLength) {
      const maxVisibleItems = Math.ceil(viewportSize / this._itemSize);
      const newVisibleIndex = Math.max(
        0,
        Math.min(firstVisibleIndex, dataLength - maxVisibleItems),
      );

      if (firstVisibleIndex !== newVisibleIndex) {
        firstVisibleIndex = newVisibleIndex;
        scrollOffset = newVisibleIndex * this._itemSize;
        newRange.start = Math.floor(firstVisibleIndex);
      }

      newRange.end = Math.max(0, Math.min(dataLength, newRange.start + maxVisibleItems));
    }

    const startBuffer = scrollOffset - newRange.start * this._itemSize;
    if (startBuffer < this._minBufferPx && newRange.start !== 0) {
      const expandStart = Math.ceil((this._maxBufferPx - startBuffer) / this._itemSize);
      newRange.start = Math.max(0, newRange.start - expandStart);
      newRange.end = Math.min(
        dataLength,
        Math.ceil(firstVisibleIndex + (viewportSize + this._minBufferPx) / this._itemSize),
      );
    } else {
      const endBuffer = newRange.end * this._itemSize - (scrollOffset + viewportSize);
      if (endBuffer < this._minBufferPx && newRange.end !== dataLength) {
        const expandEnd = Math.ceil((this._maxBufferPx - endBuffer) / this._itemSize);
        if (expandEnd > 0) {
          newRange.end = Math.min(dataLength, newRange.end + expandEnd);
          newRange.start = Math.max(
            0,
            Math.floor(firstVisibleIndex - this._minBufferPx / this._itemSize),
          );
        }
      }
    }

    this._viewport.setRenderedRange(newRange);
    this._viewport.setRenderedContentOffset(Math.round(this._itemSize * newRange.start));
    this._emitScrolledIndex(Math.floor(firstVisibleIndex));
  }

  /** 派发首可见项索引，连续相同值去重（对齐 Angular 的 distinctUntilChanged）。 */
  private _emitScrolledIndex(index: number): void {
    if (index !== this._lastEmittedIndex) {
      this._lastEmittedIndex = index;
      this.scrolledIndexChange.next(index);
    }
  }
}
