import {afterEach, describe, expect, it} from 'vitest';
import {dispatchMouseEvent, dispatchTouchEvent, mockRect} from '../../tests/helpers';
import {dragDropRegistry} from './drag-drop-registry';
import {createDragRef} from './drag-ref';

interface PointLike {
  x: number;
  y: number;
}

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

function setupDrag(rectValue: Partial<DOMRect> = rect({left: 50, top: 50, width: 100, height: 50})) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  mockRect(element, rectValue);
  const dragRef = createDragRef(element);
  return {element, dragRef};
}

function mouseDrag(
  element: HTMLElement,
  from: PointLike,
  to: PointLike,
  options: {buttons?: number} = {},
) {
  dispatchMouseEvent(element, 'mousedown', {
    button: 0,
    buttons: 1,
    detail: 1,
    pageX: from.x,
    pageY: from.y,
    clientX: from.x,
    clientY: from.y,
  });
  // 第一次移动跨越启动阈值开启序列，位移在第二次移动才应用。
  dispatchMouseEvent(document, 'mousemove', {
    buttons: options.buttons ?? 1,
    pageX: to.x,
    pageY: to.y,
    clientX: to.x,
    clientY: to.y,
  });
  dispatchMouseEvent(document, 'mousemove', {
    buttons: options.buttons ?? 1,
    pageX: to.x,
    pageY: to.y,
    clientX: to.x,
    clientY: to.y,
  });
  dispatchMouseEvent(document, 'mouseup', {
    buttons: 0,
    pageX: to.x,
    pageY: to.y,
    clientX: to.x,
    clientY: to.y,
  });
}

function touchDrag(element: HTMLElement, from: PointLike, to: PointLike) {
  dispatchTouchEvent(element, 'touchstart', [
    {pageX: from.x, pageY: from.y, identifier: 1, radiusX: 2, radiusY: 2},
  ]);
  dispatchTouchEvent(document, 'touchmove', [
    {pageX: from.x + 10, pageY: from.y, identifier: 1, radiusX: 2, radiusY: 2},
  ]);
  dispatchTouchEvent(document, 'touchmove', [
    {pageX: to.x, pageY: to.y, identifier: 1, radiusX: 2, radiusY: 2},
  ]);
  dispatchTouchEvent(document, 'touchend', [
    {pageX: to.x, pageY: to.y, identifier: 1, radiusX: 2, radiusY: 2},
  ]);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('DragRef 自由拖拽', () => {
  it('超过阈值后开始拖拽并应用 transform', () => {
    const {element, dragRef} = setupDrag();
    const started = {count: 0};
    const unsubscribe = dragRef.started.subscribe(() => started.count++);

    mouseDrag(element, {x: 100, y: 100}, {x: 120, y: 120});

    expect(started.count).toBe(1);
    expect(element.style.transform).toBe('translate3d(20px, 20px, 0)');
    unsubscribe();
    dragRef.dispose();
  });

  it('未达阈值不开始拖拽', () => {
    const {element, dragRef} = setupDrag();
    dispatchMouseEvent(element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 100,
      clientX: 100,
      clientY: 100,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 102, pageY: 102, clientX: 102, clientY: 102});
    dispatchMouseEvent(document, 'mouseup', {buttons: 0});
    expect(dragRef.isDragging()).toBe(false);
    expect(element.style.transform).toBe('');
    dragRef.dispose();
  });

  it('released 与 ended 事件载荷包含距离与落点', () => {
    const {element, dragRef} = setupDrag();
    const order: string[] = [];
    const released = {source: null as unknown, event: null as MouseEvent | TouchEvent | null};
    const ended = {
      distance: null as unknown,
      dropPoint: null as unknown,
      event: null as MouseEvent | TouchEvent | null,
    };
    const unsubRelease = dragRef.released.subscribe(payload => {
      order.push('released');
      released.source = payload.source;
      released.event = payload.event;
    });
    const unsubEnd = dragRef.ended.subscribe(payload => {
      order.push('ended');
      ended.distance = payload.distance;
      ended.dropPoint = payload.dropPoint;
      ended.event = payload.event;
    });

    mouseDrag(element, {x: 100, y: 100}, {x: 130, y: 140});

    expect(order).toEqual(['released', 'ended']);
    expect(released.source).toBe(dragRef);
    expect(released.event!.type).toBe('mouseup');
    expect(ended.distance).toEqual({x: 30, y: 40});
    expect(ended.dropPoint).toEqual({x: 130, y: 140});
    expect(ended.event!.type).toBe('mouseup');

    unsubRelease();
    unsubEnd();
    dragRef.dispose();
  });

  it('moved 事件派发距离与方向增量', () => {
    const {element, dragRef} = setupDrag();
    const moves: {distance: PointLike; delta: PointLike}[] = [];
    const unsubscribe = dragRef.moved.subscribe(payload => {
      moves.push({distance: payload.distance, delta: payload.delta});
    });

    mouseDrag(element, {x: 100, y: 100}, {x: 130, y: 120});

    expect(moves.length).toBeGreaterThan(0);
    const last = moves[moves.length - 1];
    expect(last.distance).toEqual({x: 30, y: 20});
    expect(last.delta).toEqual({x: 1, y: 1});
    unsubscribe();
    dragRef.dispose();
  });

  it('lockAxis 锁定对应轴的位置', () => {
    const {element, dragRef} = setupDrag();
    dragRef.lockAxis = 'y';
    mouseDrag(element, {x: 100, y: 100}, {x: 130, y: 140});
    expect(element.style.transform).toBe('translate3d(0px, 40px, 0)');
    dragRef.dispose();
  });

  it('dragStartDelay 未到时结束序列', () => {
    const {element, dragRef} = setupDrag();
    dragRef.dragStartDelay = 10000;
    let started = false;
    const unsubscribe = dragRef.started.subscribe(() => {
      started = true;
    });

    dispatchMouseEvent(element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 100,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 130, pageY: 130, clientX: 130, clientY: 130});

    expect(started).toBe(false);
    expect(dragDropRegistry.isDragging(dragRef)).toBe(false);
    unsubscribe();
    dragRef.dispose();
  });

  it('触摸序列可触发拖拽', () => {
    const {element, dragRef} = setupDrag();
    let started = false;
    const unsubscribe = dragRef.started.subscribe(() => {
      started = true;
    });

    touchDrag(element, {x: 100, y: 100}, {x: 130, y: 130});

    expect(started).toBe(true);
    expect(element.style.transform).toBe('translate3d(30px, 30px, 0)');
    unsubscribe();
    dragRef.dispose();
  });

  it('屏幕阅读器伪造的 mousedown 被忽略', () => {
    const {element, dragRef} = setupDrag();
    let started = false;
    const unsubscribe = dragRef.started.subscribe(() => {
      started = true;
    });

    dispatchMouseEvent(element, 'mousedown', {button: 0, buttons: 0, detail: 0, pageX: 100, pageY: 100});
    dispatchMouseEvent(document, 'mousemove', {buttons: 0, pageX: 130, pageY: 130});
    dispatchMouseEvent(document, 'mouseup', {buttons: 0});

    expect(started).toBe(false);
    unsubscribe();
    dragRef.dispose();
  });

  it('beforeStarted 在按下指针时派发', () => {
    const {element, dragRef} = setupDrag();
    let beforeStarted = false;
    const unsubscribe = dragRef.beforeStarted.subscribe(() => {
      beforeStarted = true;
    });
    dispatchMouseEvent(element, 'mousedown', {button: 0, buttons: 1, detail: 1, pageX: 100, pageY: 100});
    expect(beforeStarted).toBe(true);
    unsubscribe();
    dragRef.dispose();
  });

  it('setFreeDragPosition / getFreeDragPosition / reset 控制自由位置', () => {
    const {element, dragRef} = setupDrag();
    dragRef.setFreeDragPosition({x: 30, y: 40});
    expect(element.style.transform).toBe('translate3d(30px, 40px, 0)');
    expect(dragRef.getFreeDragPosition()).toEqual({x: 30, y: 40});

    dragRef.reset();
    expect(element.style.transform).toBe('');
    dragRef.dispose();
  });

  it('constrainPosition 约束拖拽位置', () => {
    const {element, dragRef} = setupDrag();
    dragRef.constrainPosition = position => ({x: Math.min(position.x, 150), y: position.y});
    mouseDrag(element, {x: 100, y: 100}, {x: 200, y: 130});
    // 自定义约束下位移以元素初始矩形左上角为基准：约束点 (150,130) - 矩形 (50,50)。
    expect(element.style.transform).toBe('translate3d(100px, 80px, 0)');
    dragRef.dispose();
  });

  it('withBoundaryElement 把位置约束在边界内', () => {
    const {element, dragRef} = setupDrag();
    const boundary = document.createElement('div');
    document.body.appendChild(boundary);
    mockRect(boundary, rect({left: 0, top: 0, width: 100, height: 100}));
    dragRef.withBoundaryElement(boundary);

    dispatchMouseEvent(element, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 100,
      pageY: 100,
      clientX: 100,
      clientY: 100,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 120, pageY: 120, clientX: 120, clientY: 120});

    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 500, pageY: 500, clientX: 500, clientY: 500});
    dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 500, pageY: 500, clientX: 500, clientY: 500});

    // 边界 100x100，条目 100x50，拾取点在元素内 (50,50)：
    // 约束后指针 = (50, 100)，减去拾取点 (100,100) 得到位移 (-50, 0)。
    expect(element.style.transform).toBe('translate3d(-50px, 0px, 0)');
    dragRef.dispose();
  });

  it('resetToBoundary 把溢出边界的条目拉回边界内', () => {
    const {dragRef} = setupDrag();
    const boundary = document.createElement('div');
    document.body.appendChild(boundary);
    mockRect(boundary, rect({left: 0, top: 0, width: 100, height: 100}));
    dragRef.withBoundaryElement(boundary);
    dragRef.setFreeDragPosition({x: 80, y: 80});

    dragRef.resetToBoundary();

    // 与 Angular 一致：resetToBoundary 以 _activeTransform 为基准（setFreeDragPosition 后为 0），
    // 元素右侧 150 超出边界右侧 100，offsetX = -50；y 未溢出保持不变。
    expect(dragRef.getFreeDragPosition()).toEqual({x: -50, y: 0});
    dragRef.dispose();
  });

  it('scale 缩放 transform 位移', () => {
    const {element, dragRef} = setupDrag();
    dragRef.scale = 2;
    mouseDrag(element, {x: 100, y: 100}, {x: 120, y: 120});
    expect(element.style.transform).toBe('translate3d(10px, 10px, 0)');
    dragRef.dispose();
  });

  it('withRootElement 切换可拖拽根元素', () => {
    const {dragRef} = setupDrag();
    const newRoot = document.createElement('div');
    document.body.appendChild(newRoot);
    mockRect(newRoot, rect({left: 0, top: 0, width: 100, height: 50}));
    dragRef.withRootElement(newRoot);

    mouseDrag(newRoot, {x: 10, y: 10}, {x: 30, y: 30});
    expect(newRoot.style.transform).toBe('translate3d(20px, 20px, 0)');
    dragRef.dispose();
  });

  it('嵌套拖拽时子项阻止事件冒泡，父项不开始拖拽', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    parent.appendChild(child);
    document.body.appendChild(parent);
    mockRect(parent, rect({left: 0, top: 0, width: 200, height: 100}));
    mockRect(child, rect({left: 10, top: 10, width: 50, height: 30}));

    const parentDrag = createDragRef(parent);
    const childDrag = createDragRef(child);
    childDrag.withParent(parentDrag);

    let parentStarted = false;
    let childStarted = false;
    const unsubParent = parentDrag.started.subscribe(() => {
      parentStarted = true;
    });
    const unsubChild = childDrag.started.subscribe(() => {
      childStarted = true;
    });

    dispatchMouseEvent(child, 'mousedown', {
      button: 0,
      buttons: 1,
      detail: 1,
      pageX: 20,
      pageY: 20,
      clientX: 20,
      clientY: 20,
    });
    dispatchMouseEvent(document, 'mousemove', {buttons: 1, pageX: 40, pageY: 40, clientX: 40, clientY: 40});
    dispatchMouseEvent(document, 'mouseup', {buttons: 0, pageX: 40, pageY: 40, clientX: 40, clientY: 40});

    expect(childStarted).toBe(true);
    expect(parentStarted).toBe(false);
    unsubParent();
    unsubChild();
    childDrag.dispose();
    parentDrag.dispose();
  });

  it('dispose 后不再响应指针事件', () => {
    const {element, dragRef} = setupDrag();
    dragRef.dispose();
    let beforeStarted = 0;
    const unsubscribe = dragRef.beforeStarted.subscribe(() => beforeStarted++);
    dispatchMouseEvent(element, 'mousedown', {button: 0, buttons: 1, detail: 1, pageX: 100, pageY: 100});
    expect(beforeStarted).toBe(0);
    unsubscribe();
  });
});
