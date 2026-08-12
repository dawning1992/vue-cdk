import {afterEach, describe, expect, it} from 'vitest';
import type {DragRef} from './drag-ref';
import {dragDropRegistry, DragDropRegistry} from './drag-drop-registry';

function createDragMock(isDragging: () => boolean = () => false): DragRef {
  return {isDragging} as unknown as DragRef;
}

afterEach(() => {
  // 清理所有注册项，避免全局监听器泄漏到其他用例。
  const registry = dragDropRegistry as unknown as {
    _dragInstances: Set<DragRef>;
    _dropInstances: Set<unknown>;
  };
  registry._dragInstances.forEach(item => dragDropRegistry.removeDragItem(item));
  registry._dropInstances.forEach(item => dragDropRegistry.removeDropContainer(item));
});

describe('DragDropRegistry 注册与注销', () => {
  it('register/remove 拖拽条目', () => {
    const drag = createDragMock();
    dragDropRegistry.registerDragItem(drag);
    expect(dragDropRegistry.isDragging(drag)).toBe(false);
    dragDropRegistry.removeDragItem(drag);
  });

  it('register/remove 拖放容器', () => {
    const drop = {} as unknown as never;
    dragDropRegistry.registerDropContainer(drop);
    dragDropRegistry.removeDropContainer(drop);
  });

  it('DOM 节点与指令映射可查可删', () => {
    const node = document.createElement('div');
    const drag = createDragMock();
    dragDropRegistry.registerDirectiveNode(node, drag);
    expect(dragDropRegistry.getDragDirectiveForNode(node)).toBe(drag);
    dragDropRegistry.removeDirectiveNode(node);
    expect(dragDropRegistry.getDragDirectiveForNode(node)).toBeNull();
  });
});

describe('DragDropRegistry 拖拽生命周期', () => {
  it('startDragging 后文档级 mousemove/mouseup 派发 pointerMove/pointerUp', () => {
    const registry = new DragDropRegistry();
    const drag = createDragMock(() => true);
    const moveSpy = {moved: 0, up: 0};
    const unsubscribeMove = registry.pointerMove.subscribe(() => moveSpy.moved++);
    const unsubscribeUp = registry.pointerUp.subscribe(() => moveSpy.up++);

    registry.registerDragItem(drag);
    registry.startDragging(drag, new MouseEvent('mousedown'));
    expect(registry.isDragging(drag)).toBe(true);

    document.dispatchEvent(new MouseEvent('mousemove'));
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(moveSpy.moved).toBe(1);
    expect(moveSpy.up).toBe(1);

    registry.stopDragging(drag);
    expect(registry.isDragging(drag)).toBe(false);
    document.dispatchEvent(new MouseEvent('mousemove'));
    expect(moveSpy.moved).toBe(1);

    unsubscribeMove();
    unsubscribeUp();
    registry.removeDragItem(drag);
  });

  it('触摸序列绑定 touchend/touchcancel', () => {
    const registry = new DragDropRegistry();
    const drag = createDragMock(() => true);
    let ended = 0;
    const unsubscribe = registry.pointerUp.subscribe(() => ended++);

    registry.registerDragItem(drag);
    registry.startDragging(drag, new TouchEvent('touchstart'));
    document.dispatchEvent(new TouchEvent('touchend'));
    document.dispatchEvent(new TouchEvent('touchcancel'));
    expect(ended).toBe(2);

    registry.stopDragging(drag);
    registry.removeDragItem(drag);
    unsubscribe();
  });

  it('拖拽中阻止 selectstart 默认行为', () => {
    const registry = new DragDropRegistry();
    const drag = createDragMock(() => true);
    registry.registerDragItem(drag);
    registry.startDragging(drag, new MouseEvent('mousedown'));

    const selectEvent = new MouseEvent('selectstart', {cancelable: true});
    document.dispatchEvent(selectEvent);
    expect(selectEvent.defaultPrevented).toBe(true);

    registry.stopDragging(drag);
    const laterEvent = new MouseEvent('selectstart', {cancelable: true});
    document.dispatchEvent(laterEvent);
    expect(laterEvent.defaultPrevented).toBe(false);
    registry.removeDragItem(drag);
  });

  it('持久 touchmove 监听在拖拽开始后派发 pointerMove 并阻止默认', () => {
    const registry = new DragDropRegistry();
    const drag = createDragMock(() => true);
    let moved = 0;
    const unsubscribe = registry.pointerMove.subscribe(() => moved++);

    registry.registerDragItem(drag);
    registry.startDragging(drag, new TouchEvent('touchstart'));

    const touchEvent = new TouchEvent('touchmove', {cancelable: true});
    document.dispatchEvent(touchEvent);
    expect(moved).toBe(1);
    expect(touchEvent.defaultPrevented).toBe(true);

    registry.removeDragItem(drag);
    unsubscribe();
  });

  it('scrolled 流在滚动事件后派发', () => {
    const registry = new DragDropRegistry();
    const drag = createDragMock(() => true);
    let scrolled = 0;
    const stream = registry.scrolled();
    const unsubscribe = stream.subscribe(() => scrolled++);

    registry.registerDragItem(drag);
    registry.startDragging(drag, new MouseEvent('mousedown'));
    document.dispatchEvent(new Event('scroll'));
    expect(scrolled).toBe(1);

    registry.stopDragging(drag);
    unsubscribe();
    registry.removeDragItem(drag);
  });

  it('同一 drag 重复 startDragging 不重复注册监听', () => {
    const registry = new DragDropRegistry();
    const drag = createDragMock(() => true);
    registry.registerDragItem(drag);
    registry.startDragging(drag, new MouseEvent('mousedown'));
    registry.startDragging(drag, new MouseEvent('mousedown'));
    registry.stopDragging(drag);
    registry.removeDragItem(drag);
  });
});
