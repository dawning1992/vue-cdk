import {describe, expect, it, vi} from 'vitest';
import type {ListRange} from '../collections';
import {AutoSizeVirtualScrollStrategy, ItemSizeAverager} from './auto-size-virtual-scroll';
import type {
  VirtualScrollItemMeasurement,
  VirtualScrollViewportAdapter,
} from './virtual-scroll-strategy';

/** autosize 策略测试视口，显式记录所有布局写入与滚动补偿。 */
class FakeViewport implements VirtualScrollViewportAdapter {
  keys: unknown[] = Array.from({length: 10}, (_, index) => index);
  explicitTrackBy = true;
  viewportSize = 100;
  scrollOffset = 0;
  renderedRange: ListRange = {start: 0, end: 0};
  renderedOffset = 0;
  totalContentSize = 0;
  measurements: VirtualScrollItemMeasurement[] = [];
  scrollCalls: {offset: number; behavior: ScrollBehavior}[] = [];

  getDataLength(): number { return this.keys.length; }
  getViewportSize(): number { return this.viewportSize; }
  getRenderedRange(): ListRange { return {...this.renderedRange}; }
  getDataKeys(): readonly unknown[] { return this.keys; }
  hasExplicitTrackBy(): boolean { return this.explicitTrackBy; }
  measureRenderedItems(): readonly VirtualScrollItemMeasurement[] { return this.measurements; }
  measureScrollOffset(): number { return this.scrollOffset; }
  setTotalContentSize(size: number): void { this.totalContentSize = size; }
  setRenderedRange(range: ListRange): void { this.renderedRange = {...range}; }
  setRenderedContentOffset(offset: number): void { this.renderedOffset = offset; }
  scrollToOffset(offset: number, behavior: ScrollBehavior = 'auto'): void {
    this.scrollOffset = offset;
    this.scrollCalls.push({offset, behavior});
  }
}

function createStrategy(estimate = 50): AutoSizeVirtualScrollStrategy {
  return new AutoSizeVirtualScrollStrategy(100, 200, new ItemSizeAverager(estimate));
}

function lastScroll(viewport: FakeViewport) {
  return viewport.scrollCalls[viewport.scrollCalls.length - 1];
}

describe('ItemSizeAverager', () => {
  it('无样本使用默认值，并按最新逐项样本计算平均值', () => {
    const averager = new ItemSizeAverager(40);
    expect(averager.getAverageItemSize()).toBe(40);
    averager.setSamples([20, 40, 60]);
    expect(averager.getAverageItemSize()).toBe(40);
    averager.setSamples([10, 20]);
    expect(averager.getAverageItemSize()).toBe(15);
  });

  it('拒绝非正估算尺寸', () => {
    expect(() => new ItemSizeAverager(0)).toThrow(/estimatedItemSize/);
  });
});

describe('AutoSizeVirtualScrollStrategy', () => {
  it('初始按估算尺寸设置总高度和渲染区间', () => {
    const viewport = new FakeViewport();
    createStrategy().attach(viewport);
    expect(viewport.totalContentSize).toBe(500);
    expect(viewport.renderedRange).toEqual({start: 0, end: 7});
    expect(viewport.renderedOffset).toBe(0);
  });

  it('滚动时用前缀尺寸查找首可见项并去重派发', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(viewport);
    const indices: number[] = [];
    strategy.scrolledIndexChange.subscribe(index => indices.push(index));
    viewport.scrollOffset = 120;
    strategy.onContentScrolled();
    strategy.onContentScrolled();
    expect(indices).toEqual([2]);
  });

  it('测量后更新平均估值、总高度并修正锚点', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy(50);
    strategy.attach(viewport);
    viewport.scrollOffset = 120;
    viewport.measurements = [
      {index: 0, key: 0, size: 20},
      {index: 1, key: 1, size: 40},
    ];
    strategy.onContentRendered();
    // 两个实测项 + 八个 30px 估算项。
    expect(viewport.totalContentSize).toBe(300);
    expect(lastScroll(viewport)?.offset).toBe(80);
  });

  it('顶部追加后按稳定 key 保持首可见条目和条目内偏移', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(viewport);
    viewport.scrollOffset = 120;
    viewport.keys = [-2, -1, ...viewport.keys];
    strategy.onDataLengthChanged();
    expect(lastScroll(viewport)).toEqual({offset: 220, behavior: 'auto'});
  });

  it('位于最底部时向顶部追加后继续吸底', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(viewport);
    viewport.scrollOffset = 400;
    viewport.keys = [-2, -1, ...viewport.keys];
    strategy.onDataLengthChanged();
    expect(lastScroll(viewport)).toEqual({offset: 500, behavior: 'auto'});
  });

  it('顶部追加缺少显式 trackBy 时抛出错误', () => {
    const viewport = new FakeViewport();
    viewport.explicitTrackBy = false;
    const strategy = createStrategy();
    strategy.attach(viewport);
    viewport.scrollOffset = 120;
    viewport.keys = [-1, ...viewport.keys];
    expect(() => strategy.onDataLengthChanged()).toThrow(/trackBy/);
  });

  it('位于底部附近时向底部追加仍保持当前可视锚点', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(viewport);
    viewport.scrollOffset = 400;
    viewport.keys = [...viewport.keys, 10, 11];
    strategy.onDataLengthChanged();
    expect(lastScroll(viewport)).toEqual({offset: 400, behavior: 'auto'});
  });

  it('scrollToIndex 使用估算偏移并在测量后校正', () => {
    const viewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(viewport);
    strategy.scrollToIndex(5, 'smooth');
    expect(lastScroll(viewport)).toEqual({offset: 250, behavior: 'smooth'});
    viewport.measurements = [{index: 5, key: 5, size: 100}];
    strategy.onContentRendered();
    expect(lastScroll(viewport)?.behavior).toBe('auto');
  });

  it('重复 key、错误缓冲参数和 detach 生命周期得到校验', () => {
    expect(() => new AutoSizeVirtualScrollStrategy(200, 100)).toThrow(/maxBufferPx/);
    const viewport = new FakeViewport();
    viewport.keys = [1, 1];
    expect(() => createStrategy().attach(viewport)).toThrow(/unique key/);

    const validViewport = new FakeViewport();
    const strategy = createStrategy();
    strategy.attach(validViewport);
    const listener = vi.fn();
    strategy.scrolledIndexChange.subscribe(listener);
    strategy.detach();
    strategy.scrolledIndexChange.subscribe(listener);
    strategy.onContentScrolled();
    expect(listener).not.toHaveBeenCalled();
  });
});
