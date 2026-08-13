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
  vi.unstubAllGlobals();
  dragDropRegistry.dispose();
  document.body.innerHTML = '';
});

/** 模拟换行网格布局：getBoundingClientRect 随容器子节点顺序动态变化。 */
function mockGridLayout(
  container: HTMLElement,
  cellWidth = 100,
  cellHeight = 50,
  perRow = 3,
): void {
  for (const child of Array.from(container.children)) {
    vi.spyOn(child, 'getBoundingClientRect').mockImplementation(() => {
      const index = Array.from(container.children).indexOf(child);
      const left = (index % perRow) * cellWidth;
      const top = Math.floor(index / perRow) * cellHeight;
      return {
        left,
        top,
        right: left + cellWidth,
        bottom: top + cellHeight,
        width: cellWidth,
        height: cellHeight,
        x: left,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    });
  }
}

/** 捕获下一次 requestAnimationFrame 回调，测试中手动触发以模拟帧边界。 */
function stubRaf(): () => FrameRequestCallback | null {
  let callback: FrameRequestCallback | null = null;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    callback = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  return () => callback;
}

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

  it('排序移动占位符后对被挤动条目施加反向位移并在下一帧清除', () => {
    const {a, b, c, d, container} = setup();
    mockGridLayout(container);
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);
    const nextFrame = stubRaf();

    mockElementFromPoint((c as unknown as {getRootElement(): HTMLElement}).getRootElement());
    strategy.sort(a, 250, 50, {x: 1, y: 0});

    expect(Array.from(container.children).map(el => el.classList[0])).toEqual([
      'item-b',
      'item-c',
      'item-a',
      'item-d',
    ]);
    const bEl = (b as unknown as {getRootElement(): HTMLElement}).getRootElement();
    const cEl = (c as unknown as {getRootElement(): HTMLElement}).getRootElement();
    const aEl = (a as unknown as {getRootElement(): HTMLElement}).getRootElement();
    // b、c 向左让位，施加反向位移；被拖拽的占位符本身不参与动画。
    expect(bEl.style.transform).toBe('translate3d(100px, 0px, 0)');
    expect(cEl.style.transform).toBe('translate3d(100px, 0px, 0)');
    expect(bEl.style.transition).toBe('none');
    expect(aEl.style.transform).toBe('');

    // 下一帧清除反向位移，触发 transition 滑回最终位置。
    nextFrame()!(0);
    expect(bEl.style.transform).toBe('');
    expect(cEl.style.transform).toBe('');
    expect(bEl.style.transition).toBe('');
  });

  it('连续交换时先清除上一轮的位移动画残留', () => {
    const {a, b, c, d, container} = setup();
    mockGridLayout(container);
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);
    stubRaf();

    mockElementFromPoint((c as unknown as {getRootElement(): HTMLElement}).getRootElement());
    strategy.sort(a, 250, 50, {x: 1, y: 0});
    const bEl = (b as unknown as {getRootElement(): HTMLElement}).getRootElement();
    const cEl = (c as unknown as {getRootElement(): HTMLElement}).getRootElement();
    expect(bEl.style.transform).toBe('translate3d(100px, 0px, 0)');

    // 第二次交换：a 移到 d 之后，b、c 保持原位应清除动画残留，d 被挤动。
    mockElementFromPoint((d as unknown as {getRootElement(): HTMLElement}).getRootElement());
    strategy.sort(a, 350, 50, {x: 1, y: 0});

    expect(Array.from(container.children).map(el => el.classList[0])).toEqual([
      'item-b',
      'item-c',
      'item-d',
      'item-a',
    ]);
    expect(bEl.style.transform).toBe('');
    expect(cEl.style.transform).toBe('');
    const dEl = (d as unknown as {getRootElement(): HTMLElement}).getRootElement();
    expect(dEl.style.transform).toBe('translate3d(-200px, 50px, 0)');
  });

  it('条目进入容器时对被挤动条目施加位移动画', () => {
    const {a, b, c, d, container} = setup();
    mockGridLayout(container);
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);
    const nextFrame = stubRaf();

    mockElementFromPoint((c as unknown as {getRootElement(): HTMLElement}).getRootElement());
    const newItem = createStubDrag({}, 'new');
    strategy.enter(newItem, 250, 50);

    expect(Array.from(container.children).map(el => el.classList[0])).toEqual([
      'item-a',
      'item-b',
      'item-new',
      'item-c',
      'item-d',
    ]);
    const cEl = (c as unknown as {getRootElement(): HTMLElement}).getRootElement();
    const dEl = (d as unknown as {getRootElement(): HTMLElement}).getRootElement();
    expect(cEl.style.transform).toBe('translate3d(200px, -50px, 0)');
    expect(dEl.style.transform).toBe('translate3d(-100px, 0px, 0)');

    nextFrame()!(0);
    expect(cEl.style.transform).toBe('');
  });

  it('reset 恢复条目 transform 并清除待播放的位移动画', () => {
    const {a, b, c, d, container} = setup();
    mockGridLayout(container);
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);
    stubRaf();

    mockElementFromPoint((c as unknown as {getRootElement(): HTMLElement}).getRootElement());
    strategy.sort(a, 250, 50, {x: 1, y: 0});
    const bEl = (b as unknown as {getRootElement(): HTMLElement}).getRootElement();
    expect(bEl.style.transform).not.toBe('');

    strategy.reset();
    expect(bEl.style.transform).toBe('');
    expect(bEl.style.transition).toBe('');
    expect(Array.from(container.children).map(el => el.classList[0])).toEqual([
      'item-a',
      'item-b',
      'item-c',
      'item-d',
    ]);
  });

  it('保留条目已有 transform 并在动画结束后还原', () => {
    const {a, b, c, d, container} = setup();
    const bEl = (b as unknown as {getRootElement(): HTMLElement}).getRootElement();
    bEl.style.transform = 'translate(10px, 20px)';
    mockGridLayout(container);
    const strategy = new MixedSortStrategy(document, dragDropRegistry);
    strategy.withElementContainer(container);
    strategy.withSortPredicate(() => true);
    strategy.start([a, b, c, d]);
    const nextFrame = stubRaf();

    mockElementFromPoint((c as unknown as {getRootElement(): HTMLElement}).getRootElement());
    strategy.sort(a, 250, 50, {x: 1, y: 0});

    expect(bEl.style.transform).toBe('translate3d(100px, 0px, 0) translate(10px, 20px)');

    nextFrame()!(0);
    expect(bEl.style.transform).toBe('translate(10px, 20px)');
  });
});
