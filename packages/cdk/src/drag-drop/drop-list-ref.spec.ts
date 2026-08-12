import {afterEach, describe, expect, it, vi} from 'vitest';
import {mockRect, mockScrollMetrics} from '../../tests/helpers';
import {dragDropRegistry} from './drag-drop-registry';
import type {DragRef} from './drag-ref';
import {createDropListRef} from './drop-list-ref';

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

function createStubDrag(name: string, rectValue: Partial<DOMRect> = {}) {
  const root = document.createElement('div');
  root.classList.add(`item-${name}`);
  const placeholder = document.createElement('div');
  placeholder.classList.add(`placeholder-${name}`);
  if (Object.keys(rectValue).length) {
    mockRect(root, rect(rectValue));
  }
  return {
    getRootElement: () => root,
    getVisibleElement: () => root,
    getPlaceholderElement: () => placeholder,
    scale: 1,
    isDragging: () => false,
    _withDropContainer: vi.fn(),
    _sortFromLastPointerPosition: vi.fn(),
  } as unknown as DragRef;
}

function setupList(containerRect: Partial<DOMRect> = {top: 0, left: 0, width: 200, height: 200}) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  mockRect(element, rect(containerRect));
  const dropListRef = createDropListRef(element);
  return {element, dropListRef};
}

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

describe('DropListRef 条目管理', () => {
  it('withItems 同步条目与容器归属', () => {
    const {dropListRef} = setupList();
    const a = createStubDrag('a');
    const b = createStubDrag('b');

    dropListRef.withItems([a, b]);

    expect((a as unknown as {_withDropContainer: ReturnType<typeof vi.fn>})._withDropContainer).toHaveBeenCalledWith(dropListRef);
    expect(dropListRef.getItemIndex(a)).toBe(0);
    expect(dropListRef.getItemIndex(b)).toBe(1);
    expect(dropListRef.getItemAtIndex(1)).toBe(b);
  });

  it('enter 插入条目、更新活动列表并派发 entered', () => {
    const {element, dropListRef} = setupList();
    const a = createStubDrag('a');
    const b = createStubDrag('b');
    const d = createStubDrag('d');
    element.append(
      (a as unknown as {getRootElement(): HTMLElement}).getRootElement(),
      (b as unknown as {getRootElement(): HTMLElement}).getRootElement(),
    );
    dropListRef.withItems([a, b]);

    let entered: {item: unknown; container: unknown; currentIndex: number} | null = null;
    const unsubscribe = dropListRef.entered.subscribe(event => {
      entered = {item: event.item, container: event.container, currentIndex: event.currentIndex};
    });

    dropListRef.enter(d, 0, 0, 0);

    expect(entered).toEqual({item: d, container: dropListRef, currentIndex: 0});
    expect(element.firstElementChild).toBe(
      (d as unknown as {getPlaceholderElement(): HTMLElement}).getPlaceholderElement(),
    );
    expect(dropListRef.getItemIndex(d)).toBe(0);
    unsubscribe();
    dropListRef.dispose();
  });

  it('exit 移出条目并派发 exited', () => {
    const {element, dropListRef} = setupList();
    const a = createStubDrag('a');
    const b = createStubDrag('b');
    element.append(
      (a as unknown as {getRootElement(): HTMLElement}).getRootElement(),
      (b as unknown as {getRootElement(): HTMLElement}).getRootElement(),
    );
    dropListRef.withItems([a, b]);
    dropListRef.enter(a, 0, 0, 0);

    let exited: {item: unknown; container: unknown} | null = null;
    const unsubscribe = dropListRef.exited.subscribe(event => {
      exited = {item: event.item, container: event.container};
    });

    dropListRef.exit(a);
    expect(exited).toEqual({item: a, container: dropListRef});
    expect(dropListRef.isDragging()).toBe(false);
    unsubscribe();
    dropListRef.dispose();
  });

  it('drop 派发完整载荷', () => {
    const {dropListRef} = setupList();
    const previous = setupList();
    const a = createStubDrag('a');
    const event = new MouseEvent('mouseup');
    let payload: Record<string, unknown> | null = null;
    const unsubscribe = dropListRef.dropped.subscribe(dropEvent => {
      payload = {...dropEvent};
    });

    dropListRef.drop(a, 2, 0, previous.dropListRef, true, {x: 10, y: 20}, {x: 5, y: 6}, event);

    expect(payload).toMatchObject({
      item: a,
      currentIndex: 2,
      previousIndex: 0,
      container: dropListRef,
      previousContainer: previous.dropListRef,
      isPointerOverContainer: true,
      distance: {x: 10, y: 20},
      dropPoint: {x: 5, y: 6},
      event,
    });
    unsubscribe();
    dropListRef.dispose();
    previous.dropListRef.dispose();
  });
});

describe('DropListRef 排序行为', () => {
  it('_sortItem 按指针位置排序并派发 sorted', () => {
    const {element, dropListRef} = setupList();
    const a = createStubDrag('a', {top: 0, left: 0, width: 100, height: 100});
    const b = createStubDrag('b', {top: 100, left: 0, width: 100, height: 100});
    element.append(
      (a as unknown as {getRootElement(): HTMLElement}).getRootElement(),
      (b as unknown as {getRootElement(): HTMLElement}).getRootElement(),
    );
    dropListRef.withItems([a, b]);
    dropListRef.start();

    let sorted: {previousIndex: number; currentIndex: number} | null = null;
    const unsubscribe = dropListRef.sorted.subscribe(event => {
      sorted = {previousIndex: event.previousIndex, currentIndex: event.currentIndex};
    });

    dropListRef._sortItem(a, 50, 150, {x: 0, y: 1});

    expect(sorted).toEqual({previousIndex: 0, currentIndex: 1});
    unsubscribe();
    dropListRef.dispose();
  });

  it('sortingDisabled 时不排序也不派发 sorted', () => {
    const {element, dropListRef} = setupList();
    const a = createStubDrag('a', {top: 0, left: 0, width: 100, height: 100});
    const b = createStubDrag('b', {top: 100, left: 0, width: 100, height: 100});
    element.append(
      (a as unknown as {getRootElement(): HTMLElement}).getRootElement(),
      (b as unknown as {getRootElement(): HTMLElement}).getRootElement(),
    );
    dropListRef.withItems([a, b]);
    dropListRef.sortingDisabled = true;
    dropListRef.start();

    let sorted = false;
    const unsubscribe = dropListRef.sorted.subscribe(() => {
      sorted = true;
    });
    dropListRef._sortItem(a, 50, 150, {x: 0, y: 1});
    expect(sorted).toBe(false);
    unsubscribe();
    dropListRef.dispose();
  });
});

describe('DropListRef 跨容器接收', () => {
  it('connectedTo 后按指针位置返回可接收的兄弟容器', () => {
    const {dropListRef} = setupList();
    const siblingElement = document.createElement('div');
    document.body.appendChild(siblingElement);
    mockRect(siblingElement, rect({top: 0, left: 300, width: 200, height: 200}));
    const sibling = createDropListRef(siblingElement);
    dropListRef.connectedTo([sibling]);
    dropListRef.start();

    mockElementFromPoint(siblingElement);
    expect(dropListRef._getSiblingContainerFromPosition(createStubDrag('a'), 350, 100)).toBe(sibling);
    dropListRef.dispose();
    sibling.dispose();
  });

  it('enterPredicate 拒绝时不可接收', () => {
    const {dropListRef} = setupList();
    const siblingElement = document.createElement('div');
    document.body.appendChild(siblingElement);
    mockRect(siblingElement, rect({top: 0, left: 300, width: 200, height: 200}));
    const sibling = createDropListRef(siblingElement);
    sibling.enterPredicate = () => false;
    dropListRef.connectedTo([sibling]);
    dropListRef.start();

    mockElementFromPoint(siblingElement);
    expect(dropListRef._getSiblingContainerFromPosition(createStubDrag('a'), 350, 100)).toBeUndefined();
    dropListRef.dispose();
    sibling.dispose();
  });

  it('start 通知可接收的兄弟容器', () => {
    const {dropListRef} = setupList();
    const siblingElement = document.createElement('div');
    document.body.appendChild(siblingElement);
    mockRect(siblingElement, rect({top: 0, left: 300, width: 200, height: 200}));
    const sibling = createDropListRef(siblingElement);
    const a = createStubDrag('a');
    dropListRef.withItems([a]);
    dropListRef.connectedTo([sibling]);

    let receiving: {receiver: unknown; initiator: unknown} | null = null;
    const unsubscribe = sibling.receivingStarted.subscribe(event => {
      receiving = {receiver: event.receiver, initiator: event.initiator};
    });

    dropListRef.start();
    expect(receiving).toEqual({receiver: sibling, initiator: dropListRef});
    unsubscribe();
    dropListRef.dispose();
    sibling.dispose();
  });
});

describe('DropListRef 几何与滚动', () => {
  it('_isOverContainer 按缓存矩形判断指针位置', () => {
    const {dropListRef} = setupList();
    dropListRef.start();
    expect(dropListRef._isOverContainer(100, 100)).toBe(true);
    expect(dropListRef._isOverContainer(300, 300)).toBe(false);
    dropListRef.dispose();
  });

  it('指针接近容器边缘时自动滚动', () => {
    const {element, dropListRef} = setupList({top: 0, left: 0, width: 400, height: 400});
    mockScrollMetrics(element, {
      clientHeight: 400,
      clientWidth: 400,
      scrollHeight: 2000,
      scrollWidth: 400,
      scrollTop: 0,
      scrollLeft: 0,
      offsetHeight: 400,
      offsetWidth: 400,
    });
    const scrollBy = vi.fn();
    Object.defineProperty(element, 'scrollBy', {configurable: true, value: scrollBy});
    dropListRef.start();

    dropListRef._startScrollingIfNecessary(200, 395);
    expect(scrollBy).toHaveBeenCalledWith(0, 2);
    dropListRef._stopScrolling();
    dropListRef.dispose();
  });

  it('withElementContainer 拒绝非后代容器', () => {
    const {dropListRef} = setupList();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    expect(() => dropListRef.withElementContainer(outside)).toThrowError(/descendant/);
    dropListRef.dispose();
  });
});
