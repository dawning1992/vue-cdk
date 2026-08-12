import {afterEach, describe, expect, it, vi} from 'vitest';
import {mockRect} from '../../../tests/helpers';
import {dragDropRegistry} from '../drag-drop-registry';
import type {DragRef} from '../drag-ref';
import {MixedSortStrategy} from './mixed-sort-strategy';

function createStubDrag(rectValue: Partial<DOMRect>, name: string) {
  const root = document.createElement('div');
  root.classList.add(`item-${name}`);
  mockRect(root, {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    ...rectValue,
  });
  return {
    name,
    getRootElement: () => root,
    getVisibleElement: () => root,
    getPlaceholderElement: () => root,
    scale: 1,
    _sortFromLastPointerPosition: vi.fn(),
  } as unknown as DragRef & {name: string; _sortFromLastPointerPosition: ReturnType<typeof vi.fn>};
}

function setup() {
  const a = createStubDrag({}, 'a');
  const b = createStubDrag({}, 'b');
  const c = createStubDrag({}, 'c');
  const d = createStubDrag({}, 'd');
  const container = document.createElement('div');
  for (const item of [a, b, c, d]) {
    container.appendChild((item as unknown as {getRootElement(): HTMLElement}).getRootElement());
  }
  document.body.appendChild(container);
  return {a, b, c, d, container};
}

/** jsdom 未实现 elementFromPoint，测试中按需注入。 */
function mockElementFromPoint(element: HTMLElement | null): void {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => element,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  dragDropRegistry.dispose();
  document.body.innerHTML = '';
});

describe('MixedSortStrategy', () => {
  it('排序时把占位符移动到目标元素之后并更新索引', () => {
    const {a, b, c, d, container} = setup();
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);

    mockElementFromPoint((c as unknown as {getRootElement(): HTMLElement}).getRootElement());
    const result = strategy.sort(a, 250, 50, {x: 1, y: 0});

    expect(result).toEqual({previousIndex: 0, currentIndex: 2});
    expect(strategy.getItemIndex(a)).toBe(2);
    expect(
      Array.from(container.children).map(el => el.classList[0]),
    ).toEqual(['item-b', 'item-c', 'item-a', 'item-d']);
  });

  it('指针保持悬停且方向不变时不重复交换', () => {
    const {a, b, c, d, container} = setup();
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);

    mockElementFromPoint((c as unknown as {getRootElement(): HTMLElement}).getRootElement());
    strategy.sort(a, 250, 50, {x: 1, y: 0});
    const second = strategy.sort(a, 250, 50, {x: 1, y: 0});
    expect(second).toBeNull();
    expect(strategy.getItemIndex(a)).toBe(2);
  });

  it('elementFromPoint 无命中时按最近元素插入', () => {
    const {a, b, c, d, container} = setup();
    mockElementFromPoint(null);
    (a as unknown as {getRootElement(): HTMLElement}).getRootElement().style.cssText = '';
    mockRect((a as unknown as {getRootElement(): HTMLElement}).getRootElement(), {
      left: 0,
      top: 0,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    mockRect((b as unknown as {getRootElement(): HTMLElement}).getRootElement(), {
      left: 100,
      top: 0,
      x: 100,
      y: 0,
      width: 10,
      height: 10,
    });
    mockRect((c as unknown as {getRootElement(): HTMLElement}).getRootElement(), {
      left: 200,
      top: 0,
      x: 200,
      y: 0,
      width: 10,
      height: 10,
    });
    mockRect((d as unknown as {getRootElement(): HTMLElement}).getRootElement(), {
      left: 300,
      top: 0,
      x: 300,
      y: 0,
      width: 10,
      height: 10,
    });

    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);

    const newItem = createStubDrag({}, 'new');
    strategy.enter(newItem, 250, 0);
    expect(strategy.getItemIndex(newItem)).toBe(2);
    expect(
      Array.from(container.children).map(el => el.classList[0]),
    ).toEqual(['item-a', 'item-b', 'item-new', 'item-c', 'item-d']);
  });

  it('reset 恢复容器 DOM 原始顺序', () => {
    const {a, b, c, d, container} = setup();
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);

    mockElementFromPoint((d as unknown as {getRootElement(): HTMLElement}).getRootElement());
    strategy.sort(a, 350, 50, {x: 1, y: 0});
    expect(strategy.getItemIndex(a)).toBe(3);

    strategy.reset();
    expect(
      Array.from(container.children).map(el => el.classList[0]),
    ).toEqual(['item-a', 'item-b', 'item-c', 'item-d']);
  });

  it('updateOnScroll 触发拖拽中的条目重新排序', () => {
    const {a, b, c, d, container} = setup();
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.start([a, b, c, d]);

    dragDropRegistry.startDragging(a, new MouseEvent('mousedown'));
    strategy.updateOnScroll();
    expect((a as unknown as {_sortFromLastPointerPosition: ReturnType<typeof vi.fn>})._sortFromLastPointerPosition).toHaveBeenCalled();
    dragDropRegistry.stopDragging(a);
  });
});
