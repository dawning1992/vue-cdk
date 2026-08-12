import {afterEach, describe, expect, it, vi} from 'vitest';
import {mockRect} from '../../../tests/helpers';
import {dragDropRegistry} from '../drag-drop-registry';
import type {DragRef} from '../drag-ref';
import {SingleAxisSortStrategy} from './single-axis-sort-strategy';

function rect(partial: Partial<DOMRect>): DOMRect {
  const full: Record<string, number | (() => object)> = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
  Object.assign(full, partial);
  if (partial.right == null && partial.left != null && partial.width != null) {
    full.right = partial.left + partial.width;
  }
  if (partial.bottom == null && partial.top != null && partial.height != null) {
    full.bottom = partial.top + partial.height;
  }
  if (partial.x == null && partial.left != null) {
    full.x = partial.left;
  }
  if (partial.y == null && partial.top != null) {
    full.y = partial.top;
  }
  return full as unknown as DOMRect;
}

function createStubDrag(rectValue: Partial<DOMRect>, name: string) {
  const root = document.createElement('div');
  root.classList.add(`item-${name}`);
  mockRect(root, rect(rectValue));
  return {
    name,
    getRootElement: () => root,
    getVisibleElement: () => root,
    getPlaceholderElement: () => root,
    scale: 1,
    _sortFromLastPointerPosition: vi.fn(),
  } as unknown as DragRef & {name: string; _sortFromLastPointerPosition: ReturnType<typeof vi.fn>};
}

function createVerticalItems() {
  const a = createStubDrag({top: 0, left: 0, width: 100, height: 100}, 'a');
  const b = createStubDrag({top: 100, left: 0, width: 100, height: 100}, 'b');
  const c = createStubDrag({top: 200, left: 0, width: 100, height: 100}, 'c');
  return [a, b, c];
}

afterEach(() => {
  vi.restoreAllMocks();
  dragDropRegistry.dispose();
  document.body.innerHTML = '';
});

describe('SingleAxisSortStrategy 纵向排序', () => {
  it('把条目向下交换并应用 transform 位移', () => {
    const [a, b, c] = createVerticalItems();
    const strategy = new SingleAxisSortStrategy(dragDropRegistry);
    strategy.withElementContainer(document.body);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c]);

    const result = strategy.sort(a, 50, 150, {x: 0, y: 1});

    expect(result).toEqual({previousIndex: 0, currentIndex: 1});
    expect((a as unknown as {getPlaceholderElement(): HTMLElement}).getPlaceholderElement().style.transform).toBe(
      'translate3d(0, 100px, 0)',
    );
    expect((b as unknown as {getRootElement(): HTMLElement}).getRootElement().style.transform).toBe(
      'translate3d(0, -100px, 0)',
    );
    expect((c as unknown as {getRootElement(): HTMLElement}).getRootElement().style.transform).toBe('');
    expect(strategy.getItemIndex(a)).toBe(1);
    expect(strategy.getItemAtIndex(0)).toBe(b);
  });

  it('sortPredicate 拒绝的目标索引不排序', () => {
    const [a, b, c] = createVerticalItems();
    const strategy = new SingleAxisSortStrategy(dragDropRegistry);
    strategy.withElementContainer(document.body);
    strategy.withSortPredicate(index => index === 1);
    strategy.start([a, b, c]);

    const result = strategy.sort(a, 50, 250, {x: 0, y: 1});
    expect(result).toBeNull();
    expect(strategy.getItemIndex(a)).toBe(0);
  });
});

describe('SingleAxisSortStrategy 横向与 RTL', () => {
  it('横向排序按 left 计算偏移', () => {
    const a = createStubDrag({top: 0, left: 0, width: 100, height: 100}, 'a');
    const b = createStubDrag({top: 0, left: 100, width: 100, height: 100}, 'b');
    const c = createStubDrag({top: 0, left: 200, width: 100, height: 100}, 'c');
    const strategy = new SingleAxisSortStrategy(dragDropRegistry);
    strategy.withElementContainer(document.body);
    strategy.orientation = 'horizontal';
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c]);

    const result = strategy.sort(a, 150, 50, {x: 1, y: 0});
    expect(result).toEqual({previousIndex: 0, currentIndex: 1});
    expect((a as unknown as {getPlaceholderElement(): HTMLElement}).getPlaceholderElement().style.transform).toBe(
      'translate3d(100px, 0, 0)',
    );
    expect((b as unknown as {getRootElement(): HTMLElement}).getRootElement().style.transform).toBe(
      'translate3d(-100px, 0, 0)',
    );
  });

  it('RTL 下 getItemIndex 按视觉顺序反转', () => {
    const a = createStubDrag({top: 0, left: 200, width: 100, height: 100}, 'a');
    const b = createStubDrag({top: 0, left: 100, width: 100, height: 100}, 'b');
    const c = createStubDrag({top: 0, left: 0, width: 100, height: 100}, 'c');
    const strategy = new SingleAxisSortStrategy(dragDropRegistry);
    strategy.withElementContainer(document.body);
    strategy.orientation = 'horizontal';
    strategy.direction = 'rtl';
    strategy.start([a, b, c]);

    expect(strategy.getItemIndex(a)).toBe(0);
    expect(strategy.getItemIndex(b)).toBe(1);
    expect(strategy.getItemIndex(c)).toBe(2);
    expect(strategy.getItemAtIndex(0)).toBe(a);
  });
});

describe('SingleAxisSortStrategy enter / reset / updateOnScroll', () => {
  it('enter 把新条目插入指定索引并更新活动列表', () => {
    const [a, b, c] = createVerticalItems();
    const container = document.createElement('div');
    container.append(
      (a as unknown as {getRootElement(): HTMLElement}).getRootElement(),
      (b as unknown as {getRootElement(): HTMLElement}).getRootElement(),
      (c as unknown as {getRootElement(): HTMLElement}).getRootElement(),
    );
    document.body.appendChild(container);

    const d = createStubDrag({top: 300, left: 0, width: 100, height: 100}, 'd');
    const strategy = new SingleAxisSortStrategy(dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.start([a, b, c]);

    strategy.enter(d, 50, 50, 0);
    expect(strategy.getActiveItemsSnapshot()).toEqual([d, a, b, c]);
    expect(container.firstElementChild).toBe(
      (d as unknown as {getRootElement(): HTMLElement}).getRootElement(),
    );
  });

  it('reset 清除条目 transform', () => {
    const [a, b, c] = createVerticalItems();
    const strategy = new SingleAxisSortStrategy(dragDropRegistry);
    strategy.withElementContainer(document.body);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c]);
    strategy.sort(a, 50, 150, {x: 0, y: 1});

    strategy.reset();
    expect((a as unknown as {getRootElement(): HTMLElement}).getRootElement().style.transform).toBe('');
    expect((b as unknown as {getRootElement(): HTMLElement}).getRootElement().style.transform).toBe('');
    expect(strategy.getActiveItemsSnapshot()).toEqual([]);
  });

  it('updateOnScroll 平移缓存并让拖拽中的条目重新排序', () => {
    const [a, b, c] = createVerticalItems();
    const strategy = new SingleAxisSortStrategy(dragDropRegistry);
    strategy.withElementContainer(document.body);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c]);

    dragDropRegistry.startDragging(a, new MouseEvent('mousedown'));
    strategy.updateOnScroll(30, 0);
    expect((a as unknown as {_sortFromLastPointerPosition: ReturnType<typeof vi.fn>})._sortFromLastPointerPosition).toHaveBeenCalled();
    dragDropRegistry.stopDragging(a);
  });
});
