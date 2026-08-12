/**
 * 拖放容器引用，移植自 Angular CDK drag-drop（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 与 Angular 的差异：
 * - 事件流使用仓库自研 Emitter；
 * - 自动滚动用 requestAnimationFrame 替代 RxJS interval + animationFrameScheduler；
 * - `createDropListRef` 无需 injector 参数。
 */

import {coerceElement, type ElementOrRef} from '../coercion';
import {Emitter} from '../emitter';
import type {Direction} from '../scrolling/directionality';
import {viewportRuler, type ViewportRuler} from '../scrolling/viewport-ruler';
import {getShadowRoot} from '../platform';
import {dragDropRegistry, type DragDropRegistry} from './drag-drop-registry';
import {isInsideClientRect, isPointerNearDomRect} from './dom/dom-rect';
import {ParentPositionTracker} from './dom/parent-position-tracker';
import {type DragCSSStyleDeclaration} from './dom/styling';
import type {DragRef, Point} from './drag-ref';
import type {DropListOrientation} from './config';
import type {DropListSortStrategy} from './sorting/drop-list-sort-strategy';
import {SingleAxisSortStrategy} from './sorting/single-axis-sort-strategy';
import {MixedSortStrategy} from './sorting/mixed-sort-strategy';

/** 拖拽条目影响容器的指针距离阈值（占宽/高的比例）。 */
const DROP_PROXIMITY_THRESHOLD = 0.05;

/** 自动滚动的边缘阈值（占宽/高的比例）。 */
const SCROLL_PROXIMITY_THRESHOLD = 0.05;

/** 纵向自动滚动方向。 */
enum AutoScrollVerticalDirection {
  NONE,
  UP,
  DOWN,
}

/** 横向自动滚动方向。 */
enum AutoScrollHorizontalDirection {
  NONE,
  LEFT,
  RIGHT,
}

/** 创建 DropListRef：把元素变为拖放容器，使用模块级单例依赖。 */
export function createDropListRef<T = unknown>(
  element: ElementOrRef<HTMLElement>,
): DropListRef<T> {
  return new DropListRef(element, dragDropRegistry, document, viewportRuler);
}

/** 拖放容器引用：管理条目、跨容器连接、排序与自动滚动。 */
export class DropListRef<T = any> {
  /** 容器元素。 */
  element: HTMLElement;

  /** 容器是否禁用拖拽。 */
  disabled: boolean = false;

  /** 是否禁用容器内排序。 */
  sortingDisabled: boolean = false;

  /** 锁定容器内条目移动的轴。 */
  lockAxis: 'x' | 'y' | null = null;

  /** 是否禁用边缘自动滚动。 */
  autoScrollDisabled: boolean = false;

  /** 自动滚动每帧像素数。 */
  autoScrollStep: number = 2;

  /** 条目离开初始容器后是否保留锚点节点。 */
  hasAnchor: boolean = false;

  /** 判定条目能否移入本容器。 */
  enterPredicate: (drag: DragRef, drop: DropListRef) => boolean = () => true;

  /** 判定条目能否被排入指定索引。 */
  sortPredicate: (index: number, drag: DragRef, drop: DropListRef) => boolean = () => true;

  /** 拖拽序列开始前派发。 */
  readonly beforeStarted = new Emitter<void>();

  /** 条目进入容器时派发。 */
  readonly entered = new Emitter<{item: DragRef; container: DropListRef; currentIndex: number}>();

  /** 条目移出容器时派发。 */
  readonly exited = new Emitter<{item: DragRef; container: DropListRef}>();

  /** 条目在容器内放下时派发。 */
  readonly dropped = new Emitter<{
    item: DragRef;
    currentIndex: number;
    previousIndex: number;
    container: DropListRef;
    previousContainer: DropListRef;
    isPointerOverContainer: boolean;
    distance: Point;
    dropPoint: Point;
    event: MouseEvent | TouchEvent;
  }>();

  /** 拖动中条目交换位置时派发。 */
  readonly sorted = new Emitter<{
    previousIndex: number;
    currentIndex: number;
    container: DropListRef;
    item: DragRef;
  }>();

  /** 连接列表开始接收条目时派发。 */
  readonly receivingStarted = new Emitter<{
    receiver: DropListRef;
    initiator: DropListRef;
    items: DragRef[];
  }>();

  /** 连接列表停止接收条目时派发。 */
  readonly receivingStopped = new Emitter<{
    receiver: DropListRef;
    initiator: DropListRef;
  }>();

  /** 可附加到容器的任意数据（组件层用于引用组件实例）。 */
  data!: T;

  /** 条目所在的元素容器（默认与 element 相同）。 */
  private _container!: HTMLElement;

  private _isDragging = false;

  /** 可滚动祖先位置缓存。 */
  private _parentPositions: ParentPositionTracker;

  /** 排序策略（按 orientation 选择）。 */
  private _sortStrategy!: DropListSortStrategy;

  private _domRect: DOMRect | undefined;
  private _draggables: readonly DragRef[] = [];
  private _siblings: readonly DropListRef[] = [];
  private _activeSiblings = new Set<DropListRef>();

  /** 视口滚动监听退订函数。 */
  private _viewportScrollSubscription: (() => void) | undefined;

  private _verticalScrollDirection = AutoScrollVerticalDirection.NONE;
  private _horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;
  private _scrollNode!: HTMLElement | Window;
  private _rafId: number | null = null;

  private _cachedShadowRoot: DocumentOrShadowRoot | null = null;
  private _document: Document;

  private _scrollableElements: HTMLElement[] = [];
  private _initialScrollSnap = '';
  private _direction: Direction = 'ltr';

  constructor(
    element: ElementOrRef<HTMLElement>,
    private _dragDropRegistry: DragDropRegistry = dragDropRegistry,
    _document: Document = document,
    private _viewportRuler: ViewportRuler = viewportRuler,
  ) {
    const coercedElement = (this.element = coerceElement(element));
    this._document = _document;
    this.withOrientation('vertical').withElementContainer(coercedElement);
    _dragDropRegistry.registerDropContainer(this);
    this._parentPositions = new ParentPositionTracker(_document);
  }

  /** 移除容器上的拖放能力并释放资源。 */
  dispose() {
    this._stopScrolling();
    this._viewportScrollSubscription?.();
    this.beforeStarted.complete();
    this.entered.complete();
    this.exited.complete();
    this.dropped.complete();
    this.sorted.complete();
    this.receivingStarted.complete();
    this.receivingStopped.complete();
    this._activeSiblings.clear();
    this._scrollNode = null!;
    this._parentPositions.clear();
    this._dragDropRegistry.removeDropContainer(this);
  }

  /** 容器内是否有条目正在被拖拽。 */
  isDragging() {
    return this._isDragging;
  }

  /** 开始拖拽（通知连接容器做好接收准备）。 */
  start(): void {
    this._draggingStarted();
    this._notifyReceivingSiblings();
  }

  /** 条目进入容器。 */
  enter(item: DragRef, pointerX: number, pointerY: number, index?: number): void {
    this._draggingStarted();

    if (index == null && this.sortingDisabled) {
      index = this._draggables.indexOf(item);
    }

    this._sortStrategy.enter(item, pointerX, pointerY, index);
    this._cacheParentPositions();
    this._notifyReceivingSiblings();
    this.entered.next({item, container: this, currentIndex: this.getItemIndex(item)});
  }

  /** 条目移出容器。 */
  exit(item: DragRef): void {
    this._reset();
    this.exited.next({item, container: this});
  }

  /** 条目在容器内放下。 */
  drop(
    item: DragRef,
    currentIndex: number,
    previousIndex: number,
    previousContainer: DropListRef,
    isPointerOverContainer: boolean,
    distance: Point,
    dropPoint: Point,
    event: MouseEvent | TouchEvent,
  ): void {
    this._reset();
    this.dropped.next({
      item,
      currentIndex,
      previousIndex,
      container: this,
      previousContainer,
      isPointerOverContainer,
      distance,
      dropPoint,
      event,
    });
  }

  /** 设置容器内的条目集合。 */
  withItems(items: DragRef[]): this {
    const previousItems = this._draggables;
    this._draggables = items;
    items.forEach(item => item._withDropContainer(this));

    if (this.isDragging()) {
      const draggedItems = previousItems.filter(item => item.isDragging());

      if (draggedItems.every(item => items.indexOf(item) === -1)) {
        this._reset();
      } else {
        this._sortStrategy.withItems(this._draggables);
      }
    }

    return this;
  }

  /** 设置布局方向。 */
  withDirection(direction: Direction): this {
    this._direction = direction;
    if (this._sortStrategy instanceof SingleAxisSortStrategy) {
      this._sortStrategy.direction = direction;
    }
    return this;
  }

  /** 设置与本容器连接的兄弟容器。 */
  connectedTo(connectedTo: DropListRef[]): this {
    this._siblings = connectedTo.slice();
    return this;
  }

  /** 设置容器朝向（vertical / horizontal / mixed）。 */
  withOrientation(orientation: DropListOrientation): this {
    if (orientation === 'mixed') {
      this._sortStrategy = new MixedSortStrategy(this._document, this._dragDropRegistry);
    } else {
      const strategy = new SingleAxisSortStrategy(this._dragDropRegistry);
      strategy.direction = this._direction;
      strategy.orientation = orientation;
      this._sortStrategy = strategy;
    }
    this._sortStrategy.withElementContainer(this._container);
    this._sortStrategy.withSortPredicate((index, item) => this.sortPredicate(index, item, this));
    return this;
  }

  /** 设置可滚动的祖先元素（自身始终可滚动）。 */
  withScrollableParents(elements: HTMLElement[]): this {
    const element = this._container;
    this._scrollableElements =
      elements.indexOf(element) === -1 ? [element, ...elements] : elements.slice();
    return this;
  }

  /**
   * 指定条目元素的替代容器（须为容器的后代）。
   * 用于内容投影等无法直接控制条目父节点的场景。
   */
  withElementContainer(container: HTMLElement): this {
    if (container === this._container) {
      return this;
    }

    const element = coerceElement(this.element);

    if (container !== element && !element.contains(container)) {
      throw new Error(
        'Invalid DOM structure for drop list. Alternate container element must be a descendant of the drop list.',
      );
    }

    const oldContainerIndex = this._scrollableElements.indexOf(this._container);
    const newContainerIndex = this._scrollableElements.indexOf(container);

    if (oldContainerIndex > -1) {
      this._scrollableElements.splice(oldContainerIndex, 1);
    }

    if (newContainerIndex > -1) {
      this._scrollableElements.splice(newContainerIndex, 1);
    }

    if (this._sortStrategy) {
      this._sortStrategy.withElementContainer(container);
    }

    this._cachedShadowRoot = null;
    this._scrollableElements.unshift(container);
    this._container = container;
    return this;
  }

  /** 已注册的可滚动祖先。 */
  getScrollableParents(): readonly HTMLElement[] {
    return this._scrollableElements;
  }

  /** 条目索引。 */
  getItemIndex(item: DragRef): number {
    return this._isDragging
      ? this._sortStrategy.getItemIndex(item)
      : this._draggables.indexOf(item);
  }

  /** 指定索引的条目。 */
  getItemAtIndex(index: number): DragRef | null {
    return this._isDragging
      ? this._sortStrategy.getItemAtIndex(index)
      : this._draggables[index] || null;
  }

  /** 容器是否正从连接列表接收条目。 */
  isReceiving(): boolean {
    return this._activeSiblings.size > 0;
  }

  /** 按指针位置排序条目。 */
  _sortItem(
    item: DragRef,
    pointerX: number,
    pointerY: number,
    pointerDelta: {x: number; y: number},
  ): void {
    if (
      this.sortingDisabled ||
      !this._domRect ||
      !isPointerNearDomRect(this._domRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)
    ) {
      return;
    }

    const result = this._sortStrategy.sort(item, pointerX, pointerY, pointerDelta);

    if (result) {
      this.sorted.next({
        previousIndex: result.previousIndex,
        currentIndex: result.currentIndex,
        container: this,
        item,
      });
    }
  }

  /** 指针靠近容器/视口边缘时启动自动滚动。 */
  _startScrollingIfNecessary(pointerX: number, pointerY: number) {
    if (this.autoScrollDisabled) {
      return;
    }

    let scrollNode: HTMLElement | Window | undefined;
    let verticalScrollDirection = AutoScrollVerticalDirection.NONE;
    let horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;

    this._parentPositions.positions.forEach((position, element) => {
      if (element === this._document || !position.clientRect || scrollNode) {
        return;
      }

      if (isPointerNearDomRect(position.clientRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
        [verticalScrollDirection, horizontalScrollDirection] = getElementScrollDirections(
          element as HTMLElement,
          position.clientRect,
          this._direction,
          pointerX,
          pointerY,
        );

        if (verticalScrollDirection || horizontalScrollDirection) {
          scrollNode = element as HTMLElement;
        }
      }
    });

    if (!verticalScrollDirection && !horizontalScrollDirection) {
      const {width, height} = this._viewportRuler.getViewportSize();
      const domRect = {
        width,
        height,
        top: 0,
        right: width,
        bottom: height,
        left: 0,
      } as DOMRect;
      verticalScrollDirection = getVerticalScrollDirection(domRect, pointerY);
      horizontalScrollDirection = getHorizontalScrollDirection(domRect, pointerX);
      scrollNode = window;
    }

    if (
      scrollNode &&
      (verticalScrollDirection !== this._verticalScrollDirection ||
        horizontalScrollDirection !== this._horizontalScrollDirection ||
        scrollNode !== this._scrollNode)
    ) {
      this._verticalScrollDirection = verticalScrollDirection;
      this._horizontalScrollDirection = horizontalScrollDirection;
      this._scrollNode = scrollNode;

      if ((verticalScrollDirection || horizontalScrollDirection) && scrollNode) {
        this._startScrollInterval();
      } else {
        this._stopScrolling();
      }
    }
  }

  /** 停止自动滚动。 */
  _stopScrolling() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /** 拖拽序列在容器内开始：禁用 scroll-snap、启动排序策略并缓存几何。 */
  private _draggingStarted() {
    const styles = this._container.style as DragCSSStyleDeclaration;
    this.beforeStarted.next();
    this._isDragging = true;

    this._initialScrollSnap = styles.msScrollSnapType || styles.scrollSnapType || '';
    styles.scrollSnapType = styles.msScrollSnapType = 'none';
    this._sortStrategy.start(this._draggables);
    this._cacheParentPositions();
    this._viewportScrollSubscription?.();
    this._listenToScrollEvents();
  }

  /** 缓存可滚动祖先的位置。 */
  private _cacheParentPositions() {
    this._parentPositions.cache(this._scrollableElements);
    this._domRect = this._parentPositions.positions.get(this._container)!.clientRect!;
  }

  /** 重置容器到初始状态。 */
  private _reset() {
    this._isDragging = false;
    const styles = this._container.style as DragCSSStyleDeclaration;
    styles.scrollSnapType = styles.msScrollSnapType = this._initialScrollSnap;

    this._siblings.forEach(sibling => sibling._stopReceiving(this));
    this._sortStrategy.reset();
    this._stopScrolling();
    this._viewportScrollSubscription?.();
    this._parentPositions.clear();
  }

  /** 启动逐帧自动滚动（首帧立即执行，与 Angular interval 语义一致）。 */
  private _startScrollInterval = () => {
    this._stopScrolling();

    const step = () => {
      const node = this._scrollNode;
      const scrollStep = this.autoScrollStep;

      if (this._verticalScrollDirection === AutoScrollVerticalDirection.UP) {
        node.scrollBy(0, -scrollStep);
      } else if (this._verticalScrollDirection === AutoScrollVerticalDirection.DOWN) {
        node.scrollBy(0, scrollStep);
      }

      if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.LEFT) {
        node.scrollBy(-scrollStep, 0);
      } else if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.RIGHT) {
        node.scrollBy(scrollStep, 0);
      }

      this._rafId = requestAnimationFrame(step);
    };

    step();
  };

  /** 指针是否位于容器内。 */
  _isOverContainer(x: number, y: number): boolean {
    return this._domRect != null && isInsideClientRect(this._domRect, x, y);
  }

  /** 按指针位置查找可接收条目的兄弟容器。 */
  _getSiblingContainerFromPosition(item: DragRef, x: number, y: number): DropListRef | undefined {
    return this._siblings.find(sibling => sibling._canReceive(item, x, y));
  }

  /** 容器是否可接收指定条目（含 elementFromPoint 命中校验）。 */
  _canReceive(item: DragRef, x: number, y: number): boolean {
    if (
      !this._domRect ||
      !isInsideClientRect(this._domRect, x, y) ||
      !this.enterPredicate(item, this)
    ) {
      return false;
    }

    const elementFromPoint = this._getShadowRoot().elementFromPoint(x, y) as HTMLElement | null;

    if (!elementFromPoint) {
      return false;
    }

    return elementFromPoint === this._container || this._container.contains(elementFromPoint);
  }

  /** 连接容器开始拖拽时做好接收准备。 */
  _startReceiving(sibling: DropListRef, items: DragRef[]) {
    const activeSiblings = this._activeSiblings;

    if (
      !activeSiblings.has(sibling) &&
      items.every(item => {
        return this.enterPredicate(item, this) || this._draggables.indexOf(item) > -1;
      })
    ) {
      activeSiblings.add(sibling);
      this._cacheParentPositions();
      this._listenToScrollEvents();
      this.receivingStarted.next({
        initiator: sibling,
        receiver: this,
        items,
      });
    }
  }

  /** 连接容器停止拖拽。 */
  _stopReceiving(sibling: DropListRef) {
    this._activeSiblings.delete(sibling);
    this._viewportScrollSubscription?.();
    this.receivingStopped.next({initiator: sibling, receiver: this});
  }

  /** 监听视口滚动以同步内部状态。 */
  private _listenToScrollEvents() {
    this._viewportScrollSubscription = this._dragDropRegistry
      .scrolled(this._getShadowRoot())
      .subscribe(event => {
        if (this.isDragging()) {
          const scrollDifference = this._parentPositions.handleScroll(event);

          if (scrollDifference) {
            this._sortStrategy.updateOnScroll(scrollDifference.top, scrollDifference.left);
          }
        } else if (this.isReceiving()) {
          this._cacheParentPositions();
        }
      });
  }

  /** 懒解析 shadow root（元素可能在 ngFor 等动态结构中）。 */
  private _getShadowRoot(): DocumentOrShadowRoot {
    if (!this._cachedShadowRoot) {
      const shadowRoot = getShadowRoot(this._container);
      this._cachedShadowRoot = shadowRoot || this._document;
    }

    return this._cachedShadowRoot;
  }

  /** 通知连接容器：本容器有条目正在被拖拽。 */
  private _notifyReceivingSiblings() {
    const draggedItems = this._sortStrategy
      .getActiveItemsSnapshot()
      .filter(item => item.isDragging());
    this._siblings.forEach(sibling => sibling._startReceiving(this, draggedItems));
  }
}

/** 计算节点的纵向自动滚动方向。 */
function getVerticalScrollDirection(clientRect: DOMRect, pointerY: number) {
  const {top, bottom, height} = clientRect;
  const yThreshold = height * SCROLL_PROXIMITY_THRESHOLD;

  if (pointerY >= top - yThreshold && pointerY <= top + yThreshold) {
    return AutoScrollVerticalDirection.UP;
  } else if (pointerY >= bottom - yThreshold && pointerY <= bottom + yThreshold) {
    return AutoScrollVerticalDirection.DOWN;
  }

  return AutoScrollVerticalDirection.NONE;
}

/** 计算节点的横向自动滚动方向。 */
function getHorizontalScrollDirection(clientRect: DOMRect, pointerX: number) {
  const {left, right, width} = clientRect;
  const xThreshold = width * SCROLL_PROXIMITY_THRESHOLD;

  if (pointerX >= left - xThreshold && pointerX <= left + xThreshold) {
    return AutoScrollHorizontalDirection.LEFT;
  } else if (pointerX >= right - xThreshold && pointerX <= right + xThreshold) {
    return AutoScrollHorizontalDirection.RIGHT;
  }

  return AutoScrollHorizontalDirection.NONE;
}

/** 计算元素应滚动方向；不可滚动的方向返回 NONE 以便让位给外层容器。 */
function getElementScrollDirections(
  element: HTMLElement,
  clientRect: DOMRect,
  direction: Direction,
  pointerX: number,
  pointerY: number,
): [AutoScrollVerticalDirection, AutoScrollHorizontalDirection] {
  const computedVertical = getVerticalScrollDirection(clientRect, pointerY);
  const computedHorizontal = getHorizontalScrollDirection(clientRect, pointerX);
  let verticalScrollDirection = AutoScrollVerticalDirection.NONE;
  let horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;

  if (computedVertical) {
    const scrollTop = element.scrollTop;

    if (computedVertical === AutoScrollVerticalDirection.UP) {
      if (scrollTop > 0) {
        verticalScrollDirection = AutoScrollVerticalDirection.UP;
      }
    } else if (element.scrollHeight - scrollTop > element.clientHeight) {
      verticalScrollDirection = AutoScrollVerticalDirection.DOWN;
    }
  }

  if (computedHorizontal) {
    const scrollLeft = element.scrollLeft;

    if (direction === 'rtl') {
      if (computedHorizontal === AutoScrollHorizontalDirection.RIGHT) {
        if (scrollLeft < 0) {
          horizontalScrollDirection = AutoScrollHorizontalDirection.RIGHT;
        }
      } else if (element.scrollWidth + scrollLeft > element.clientWidth) {
        horizontalScrollDirection = AutoScrollHorizontalDirection.LEFT;
      }
    } else {
      if (computedHorizontal === AutoScrollHorizontalDirection.LEFT) {
        if (scrollLeft > 0) {
          horizontalScrollDirection = AutoScrollHorizontalDirection.LEFT;
        }
      } else if (element.scrollWidth - scrollLeft > element.clientWidth) {
        horizontalScrollDirection = AutoScrollHorizontalDirection.RIGHT;
      }
    }
  }

  return [verticalScrollDirection, horizontalScrollDirection];
}
