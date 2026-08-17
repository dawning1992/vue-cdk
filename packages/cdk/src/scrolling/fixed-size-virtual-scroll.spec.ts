import {describe, expect, it, vi} from 'vitest';
import type {ListRange} from '../collections';
import {FixedSizeVirtualScrollStrategy} from './fixed-size-virtual-scroll';
import type {VirtualScrollViewportAdapter} from './virtual-scroll-strategy';

/** 记录策略调用的假视口。 */
class FakeViewport implements VirtualScrollViewportAdapter {
  dataLength = 100;
  viewportSize = 300;
  renderedRange: ListRange = {start: 0, end: 0};
  scrollOffset = 0;
  totalContentSize = 0;
  renderedOffset = 0;
  renderedOffsetTo: 'to-start' | 'to-end' = 'to-start';
  scrollToOffsets: {offset: number; behavior: ScrollBehavior}[] = [];
  renderedRanges: ListRange[] = [];
  getDataKeys(): readonly unknown[] {
    return Array.from({length: this.dataLength}, (_, index) => index);
  }
  hasExplicitTrackBy(): boolean {
    return true;
  }
  measureRenderedItems() {
    return [];
  }

  getDataLength(): number {
    return this.dataLength;
  }
  getViewportSize(): number {
    return this.viewportSize;
  }
  getRenderedRange(): ListRange {
    return {...this.renderedRange};
  }
  measureScrollOffset(): number {
    return this.scrollOffset;
  }
  setTotalContentSize(size: number): void {
    this.totalContentSize = size;
  }
  setRenderedRange(range: ListRange): void {
    this.renderedRange = {...range};
    this.renderedRanges.push({...range});
  }
  setRenderedContentOffset(offset: number, to: 'to-start' | 'to-end' = 'to-start'): void {
    this.renderedOffset = offset;
    this.renderedOffsetTo = to;
  }
  scrollToOffset(offset: number, behavior: ScrollBehavior = 'auto'): void {
    this.scrollToOffsets.push({offset, behavior});
  }
}

function createStrategy(itemSize = 50, minBufferPx = 100, maxBufferPx = 200) {
  return new FixedSizeVirtualScrollStrategy(itemSize, minBufferPx, maxBufferPx);
}

describe('FixedSizeVirtualScrollStrategy', () => {
  it('attach 后按数据长度设置总内容尺寸', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50);
    strategy.attach(viewport);
    expect(viewport.totalContentSize).toBe(5000);
  });

  it('初始渲染区间覆盖视口并带最小缓冲', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50, 100, 200);
    strategy.attach(viewport);

    // 视口 300px + 最小缓冲 100px 共需 8 个条目，扩张后至少渲染到缓冲上限。
    expect(viewport.renderedRange.start).toBe(0);
    expect(viewport.renderedRange.end).toBeGreaterThanOrEqual(8);
    expect(viewport.renderedRange.end).toBeLessThanOrEqual(100);
    expect(viewport.renderedOffset).toBe(0);
  });

  it('滚动后首可见项索引变化并重算区间', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50, 100, 200);
    strategy.attach(viewport);

    const indices: number[] = [];
    const unsubscribe = strategy.scrolledIndexChange.subscribe(index => indices.push(index));

    viewport.scrollOffset = 1500;
    strategy.onContentScrolled();

    expect(indices).toEqual([30]);
    expect(viewport.renderedRange.start).toBeGreaterThan(0);
    expect(viewport.renderedRange.start).toBeLessThanOrEqual(30);
    expect(viewport.renderedRange.end).toBeGreaterThan(30);
    expect(viewport.renderedOffset).toBe(50 * viewport.renderedRange.start);
    unsubscribe();
  });

  it('scrolledIndexChange 连续相同值去重', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(viewport);
    const indices: number[] = [];
    const unsubscribe = strategy.scrolledIndexChange.subscribe(index => indices.push(index));

    viewport.scrollOffset = 1000;
    strategy.onContentScrolled();
    strategy.onContentScrolled();
    expect(indices).toEqual([20]);
    unsubscribe();
  });

  it('数据变短且位于底部时收缩区间并保持可见位置', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50, 100, 200);
    strategy.attach(viewport);

    viewport.scrollOffset = 4700; // 模拟滚到接近底部
    strategy.onContentScrolled();
    expect(viewport.renderedRange.end).toBe(100);

    viewport.dataLength = 10;
    strategy.onDataLengthChanged();
    expect(viewport.totalContentSize).toBe(500);
    expect(viewport.renderedRange.end).toBeLessThanOrEqual(10);
    expect(viewport.renderedRange.start).toBeLessThanOrEqual(viewport.renderedRange.end);
  });

  it('onDataLengthChanged 更新总尺寸并重算区间', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50);
    strategy.attach(viewport);
    viewport.dataLength = 20;
    strategy.onDataLengthChanged();
    expect(viewport.totalContentSize).toBe(1000);
    expect(viewport.renderedRange.end).toBeGreaterThanOrEqual(8);
  });

  it('scrollToIndex 换算为 itemSize * index 偏移', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50);
    strategy.attach(viewport);
    strategy.scrollToIndex(7, 'smooth');
    expect(viewport.scrollToOffsets).toEqual([{offset: 350, behavior: 'smooth'}]);
  });

  it('updateItemAndBufferSize 后立即重算', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50);
    strategy.attach(viewport);
    strategy.updateItemAndBufferSize(100, 100, 200);
    expect(viewport.totalContentSize).toBe(10000);
  });

  it('maxBufferPx 小于 minBufferPx 时抛错', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50, 200, 100);
    strategy.attach(viewport);
    expect(() => strategy.updateItemAndBufferSize(50, 200, 100)).toThrow(/maxBufferPx/);
  });

  it('detach 后停止响应且事件流结束', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(viewport);
    const spy = vi.fn();
    const unsubscribe = strategy.scrolledIndexChange.subscribe(spy);

    strategy.detach();
    viewport.scrollOffset = 500;
    strategy.onContentScrolled();
    expect(spy).not.toHaveBeenCalled();

    // 事件流已 complete，后续订阅为空操作。
    strategy.scrolledIndexChange.subscribe(spy);
    expect(spy).not.toHaveBeenCalled();
    unsubscribe();
  });
});
