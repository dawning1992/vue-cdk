/**
 * 不定尺寸虚拟滚动策略。
 *
 * API 分层参考 Angular CDK experimental autosize 策略；本实现额外以稳定 key 缓存逐项尺寸，
 * 支持顶部/底部追加和已渲染内容动态变高。未渲染项采用滚动期间持续修正的平均尺寸估值。
 */

import {provide} from 'vue';
import {Emitter} from '../emitter';
import type {ListRange} from '../collections';
import {
  VIRTUAL_SCROLL_STRATEGY,
  type VirtualScrollStrategy,
  type VirtualScrollViewportAdapter,
} from './virtual-scroll-strategy';

/** autosize 策略配置。 */
export interface AutoSizeVirtualScrollOptions {
  /** 视口边缘至少保留的缓冲像素，默认 100。 */
  minBufferPx?: number;
  /** 触发补渲染后恢复到的缓冲像素，默认 200。 */
  maxBufferPx?: number;
  /** 尚未测量任何条目时使用的估算尺寸，默认 50 像素。 */
  estimatedItemSize?: number;
}

/** 根据已见条目的实测值估算未知条目尺寸。 */
export class ItemSizeAverager {
  private _totalSize = 0;
  private _totalWeight = 0;
  private _averageItemSize: number;

  /** @param defaultItemSize 无样本时的默认尺寸，必须大于 0。 */
  constructor(private readonly _defaultItemSize = 50) {
    if (!Number.isFinite(_defaultItemSize) || _defaultItemSize <= 0) {
      throw new Error('Vue CDK virtual scroll: estimatedItemSize must be greater than 0');
    }
    this._averageItemSize = _defaultItemSize;
  }

  /** 返回当前平均条目尺寸。 */
  getAverageItemSize(): number {
    return this._averageItemSize;
  }

  /**
   * 用一批互不重复的逐项尺寸替换当前样本。
   * 策略按 key 保存最新尺寸，因此重算可避免 ResizeObserver 重复通知造成样本偏置。
   */
  setSamples(sizes: readonly number[]): void {
    const valid = sizes.filter(size => Number.isFinite(size) && size > 0);
    this._totalWeight = valid.length;
    this._totalSize = valid.reduce((sum, size) => sum + size, 0);
    this._averageItemSize = this._totalWeight
      ? this._totalSize / this._totalWeight
      : this._defaultItemSize;
  }

  /** 清空样本并恢复默认估值。 */
  reset(): void {
    this._totalSize = 0;
    this._totalWeight = 0;
    this._averageItemSize = this._defaultItemSize;
  }
}

/** 支持前缀和、单点更新和按偏移查找索引的 Fenwick Tree。 */
class SizeTree {
  private _values: number[] = [];
  private _tree: number[] = [0];

  rebuild(values: readonly number[]): void {
    this._values = [...values];
    this._tree = new Array(values.length + 1).fill(0);
    values.forEach((value, index) => this._add(index, value));
  }

  get length(): number {
    return this._values.length;
  }

  total(): number {
    return this.prefix(this.length);
  }

  prefix(end: number): number {
    let sum = 0;
    for (let cursor = Math.min(Math.max(0, end), this.length); cursor > 0; cursor -= cursor & -cursor) {
      sum += this._tree[cursor];
    }
    return sum;
  }

  /** 返回包含指定偏移的条目索引；超过末尾时返回最后一项。 */
  indexAt(offset: number): number {
    if (!this.length) return 0;
    const target = Math.max(0, Math.min(offset, Math.max(0, this.total() - Number.EPSILON)));
    let index = 0;
    let sum = 0;
    let bit = 1;
    while ((bit << 1) <= this.length) bit <<= 1;
    for (; bit; bit >>= 1) {
      const next = index + bit;
      if (next <= this.length && sum + this._tree[next] <= target) {
        index = next;
        sum += this._tree[next];
      }
    }
    return Math.min(index, this.length - 1);
  }

  private _add(index: number, delta: number): void {
    for (let cursor = index + 1; cursor < this._tree.length; cursor += cursor & -cursor) {
      this._tree[cursor] += delta;
    }
  }
}

/** 支持未知或运行时变化尺寸的虚拟滚动策略。首版仅支持纵向视口。 */
export class AutoSizeVirtualScrollStrategy implements VirtualScrollStrategy {
  readonly scrolledIndexChange = new Emitter<number>();

  private _viewport: VirtualScrollViewportAdapter | null = null;
  private _keys: readonly unknown[] = [];
  private readonly _sizes = new Map<unknown, number>();
  private readonly _tree = new SizeTree();
  private _lastEmittedIndex: number | null = null;
  private _pendingScrollIndex: number | null = null;
  /** 数据更新后跨渲染周期保留的原可视锚点，防止实测前按估值重新选中相邻条目。 */
  private _pendingDataAnchor: {key: unknown; innerOffset: number} | null = null;
  /** 顶部追加前已位于底部时，下一渲染周期继续以列表末尾为锚点。 */
  private _pendingStickToBottom = false;
  /** 最近一次滚动事件是否到达模型底部；避免随后实测总高度变化丢失用户意图。 */
  private _isAtBottom = false;
  private _minBufferPx: number;
  private _maxBufferPx: number;

  /**
   * @param minBufferPx 最小缓冲像素。
   * @param maxBufferPx 补渲染目标缓冲像素。
   * @param averager 未测量条目的尺寸估算器。
   */
  constructor(
    minBufferPx = 100,
    maxBufferPx = 200,
    private readonly _averager = new ItemSizeAverager(),
  ) {
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
    this._validateBuffers();
  }

  attach(viewport: VirtualScrollViewportAdapter): void {
    this._viewport = viewport;
    this._replaceKeys(viewport.getDataKeys());
    this._updateRenderedRange();
  }

  detach(): void {
    this._viewport = null;
    this._keys = [];
    this._sizes.clear();
    this._tree.rebuild([]);
    this._averager.reset();
    this._pendingDataAnchor = null;
    this._pendingStickToBottom = false;
    this._isAtBottom = false;
    this.scrolledIndexChange.complete();
  }

  /** 更新缓冲参数并立即重算渲染区间。 */
  updateBufferSize(minBufferPx: number, maxBufferPx: number): void {
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
    this._validateBuffers();
    this._updateRenderedRange();
  }

  onContentScrolled(): void {
    if (this._viewport) {
      const remaining = this._tree.total()
        - (this._viewport.measureScrollOffset() + this._viewport.getViewportSize());
      this._isAtBottom = this._keys.length > 0 && remaining <= 2;
    }
    this._updateRenderedRange();
  }

  onDataLengthChanged(): void {
    if (!this._viewport) return;
    const oldKeys = this._keys;
    const oldOffset = this._viewport.measureScrollOffset();
    const oldTotal = this._tree.total();
    const viewportSize = this._viewport.getViewportSize();
    const wasAtBottom = this._isAtBottom
      || (oldKeys.length > 0 && oldTotal - (oldOffset + viewportSize) <= 2);
    const anchorIndex = oldKeys.length ? this._tree.indexAt(oldOffset) : 0;
    const anchorKey = oldKeys[anchorIndex];
    const anchorInnerOffset = oldOffset - this._tree.prefix(anchorIndex);
    const nextKeys = this._viewport.getDataKeys();

    this._assertUniqueKeys(nextKeys);
    const anchorNextIndex = anchorKey === undefined ? -1 : nextKeys.indexOf(anchorKey);
    const isPrepend = anchorNextIndex > anchorIndex;
    if (isPrepend && !this._viewport.hasExplicitTrackBy()) {
      throw new Error('Vue CDK autosize virtual scroll: prepending data requires an explicit trackBy');
    }

    this._replaceKeys(nextKeys);
    if (isPrepend && wasAtBottom) {
      this._pendingDataAnchor = null;
      this._pendingStickToBottom = true;
      this._isAtBottom = true;
      this._viewport.scrollToOffset(Math.max(0, this._tree.total() - viewportSize), 'auto');
    } else if (anchorNextIndex >= 0) {
      this._pendingStickToBottom = false;
      this._isAtBottom = false;
      this._pendingDataAnchor = {key: anchorKey, innerOffset: anchorInnerOffset};
      this._viewport.scrollToOffset(
        Math.max(0, this._tree.prefix(anchorNextIndex) + anchorInnerOffset),
        'auto',
      );
    }
    this._updateRenderedRange();
  }

  onContentRendered(): void {
    if (!this._viewport || !this._keys.length) return;
    const scrollOffset = this._viewport.measureScrollOffset();
    const measuredAnchorIndex = this._tree.indexAt(scrollOffset);
    const anchorKey = this._pendingDataAnchor?.key ?? this._keys[measuredAnchorIndex];
    const anchorInnerOffset = this._pendingDataAnchor?.innerOffset
      ?? scrollOffset - this._tree.prefix(measuredAnchorIndex);
    let changed = false;

    for (const measurement of this._viewport.measureRenderedItems()) {
      if (measurement.size > 0 && this._sizes.get(measurement.key) !== measurement.size) {
        this._sizes.set(measurement.key, measurement.size);
        changed = true;
      }
    }
    if (!changed) {
      if (this._pendingStickToBottom) {
        this._viewport.scrollToOffset(
          Math.max(0, this._tree.total() - this._viewport.getViewportSize()),
          'auto',
        );
      }
      this._pendingDataAnchor = null;
      this._pendingStickToBottom = false;
      return;
    }

    this._averager.setSamples([...this._sizes.values()]);
    this._rebuildTree();
    const nextAnchorIndex = this._keys.indexOf(anchorKey);
    if (this._pendingStickToBottom) {
      this._viewport.scrollToOffset(
        Math.max(0, this._tree.total() - this._viewport.getViewportSize()),
        'auto',
      );
    } else if (nextAnchorIndex >= 0) {
      const correctedOffset = this._tree.prefix(nextAnchorIndex) + anchorInnerOffset;
      if (Math.abs(correctedOffset - scrollOffset) > 0.5) {
        this._viewport.scrollToOffset(Math.max(0, correctedOffset), 'auto');
      }
    }
    this._pendingDataAnchor = null;
    this._pendingStickToBottom = false;
    this._updateRenderedRange();

    if (this._pendingScrollIndex != null && this._pendingScrollIndex < this._keys.length) {
      const pending = this._pendingScrollIndex;
      this._pendingScrollIndex = null;
      this._viewport.scrollToOffset(this._tree.prefix(pending), 'auto');
    }
  }

  onRenderedOffsetChanged(): void {
    // 内容偏移已由 SizeTree 的前缀和决定，无需额外状态同步。
  }

  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    if (!this._viewport || !this._keys.length) return;
    const target = Math.min(Math.max(0, Math.floor(index)), this._keys.length - 1);
    this._pendingScrollIndex = target;
    this._viewport.scrollToOffset(this._tree.prefix(target), behavior);
    this._updateRenderedRange();
  }

  private _replaceKeys(keys: readonly unknown[]): void {
    this._assertUniqueKeys(keys);
    const activeKeys = new Set(keys);
    for (const key of this._sizes.keys()) {
      if (!activeKeys.has(key)) this._sizes.delete(key);
    }
    this._keys = [...keys];
    this._averager.setSamples([...this._sizes.values()]);
    this._rebuildTree();
  }

  private _rebuildTree(): void {
    const estimate = this._averager.getAverageItemSize();
    this._tree.rebuild(this._keys.map(key => this._sizes.get(key) ?? estimate));
    this._viewport?.setTotalContentSize(this._tree.total());
  }

  private _updateRenderedRange(): void {
    if (!this._viewport) return;
    const dataLength = this._keys.length;
    if (!dataLength) {
      this._viewport.setTotalContentSize(0);
      this._viewport.setRenderedRange({start: 0, end: 0});
      this._viewport.setRenderedContentOffset(0);
      this._emitIndex(0);
      return;
    }

    const scrollOffset = Math.max(0, this._viewport.measureScrollOffset());
    const viewportEnd = scrollOffset + this._viewport.getViewportSize();
    const start = this._tree.indexAt(Math.max(0, scrollOffset - this._maxBufferPx));
    const end = Math.min(
      dataLength,
      this._tree.indexAt(Math.min(this._tree.total(), viewportEnd + this._maxBufferPx)) + 1,
    );
    const visibleIndex = this._tree.indexAt(scrollOffset);
    const range: ListRange = {start, end: Math.max(start + 1, end)};
    this._viewport.setTotalContentSize(this._tree.total());
    this._viewport.setRenderedRange(range);
    this._viewport.setRenderedContentOffset(this._tree.prefix(range.start));
    this._emitIndex(visibleIndex);
  }

  private _emitIndex(index: number): void {
    if (index !== this._lastEmittedIndex) {
      this._lastEmittedIndex = index;
      this.scrolledIndexChange.next(index);
    }
  }

  private _assertUniqueKeys(keys: readonly unknown[]): void {
    if (new Set(keys).size !== keys.length) {
      throw new Error('Vue CDK autosize virtual scroll: trackBy must return a unique key for every item');
    }
  }

  private _validateBuffers(): void {
    if (!Number.isFinite(this._minBufferPx) || this._minBufferPx < 0) {
      throw new Error('Vue CDK virtual scroll: minBufferPx must be a non-negative number');
    }
    if (!Number.isFinite(this._maxBufferPx) || this._maxBufferPx < this._minBufferPx) {
      throw new Error('Vue CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
    }
  }
}

/**
 * 在当前 Vue 组件作用域提供 autosize 策略，供未声明 itemSize/autosize 的后代视口使用。
 * 返回实例便于调用方更新配置或测试；实例由视口在卸载时 detach。
 */
export function provideAutoSizeVirtualScrollStrategy(
  options: AutoSizeVirtualScrollOptions = {},
): AutoSizeVirtualScrollStrategy {
  const strategy = new AutoSizeVirtualScrollStrategy(
    options.minBufferPx ?? 100,
    options.maxBufferPx ?? 200,
    new ItemSizeAverager(options.estimatedItemSize ?? 50),
  );
  provide(VIRTUAL_SCROLL_STRATEGY, strategy);
  return strategy;
}
