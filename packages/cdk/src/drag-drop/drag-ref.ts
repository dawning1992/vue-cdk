/**
 * 拖拽条目引用，移植自 Angular CDK drag-drop（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 与 Angular 的差异：
 * - 事件流使用仓库自研 Emitter，退订返回函数；
 * - 无 NgZone/DI，构造函数直接接收 document、ViewportRuler、DragDropRegistry；
 * - 自定义预览/占位符模板由框架层提供 render/destroy 函数。
 */

import {coerceElement, type ElementOrRef} from '../coercion';
import {Emitter} from '../emitter';
import {isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader} from '../a11y';
import {getEventTarget, getShadowRoot} from '../platform';
import type {Direction} from '../scrolling/directionality';
import {addListener} from '../scrolling/listen';
import {viewportRuler, type ViewportRuler} from '../scrolling/viewport-ruler';
import {deepCloneNode} from './dom/clone-node';
import {adjustDomRect, getMutableClientRect, isOverflowingParent} from './dom/dom-rect';
import {ParentPositionTracker} from './dom/parent-position-tracker';
import {
  type DragCSSStyleDeclaration,
  combineTransforms,
  getTransform,
  toggleNativeDragInteractions,
  toggleVisibility,
} from './dom/styling';
import {dragDropRegistry, type DragDropRegistry} from './drag-drop-registry';
import type {DropListRef} from './drop-list-ref';
import {PreviewRef} from './preview-ref';
import {injectDragDropStyles} from './style-inject';

/** 拖拽起点配置。 */
export interface DragRefConfig {
  /** 用户拖动多少像素后 CDK 才开启拖拽序列。 */
  dragStartThreshold: number;

  /** 用户拖动多少像素后 CDK 才判定方向发生改变。 */
  pointerDirectionChangeThreshold: number;

  /** 拖拽产生的绝对定位元素（预览）的 z-index。 */
  zIndex?: number;

  /** 当前条目嵌套所在的父拖拽条目。 */
  parentDragRef?: DragRef;
}

/** 位置约束函数：接收指针位置与条目信息，返回条目应渲染的位置。 */
export type DragConstrainPosition = (
  userPointerPosition: Point,
  dragRef: DragRef,
  dimensions: DOMRect,
  pickupPositionInElement: Point,
) => Point;

/** 页面或元素内坐标。 */
export interface Point {
  x: number;
  y: number;
}

/** 预览可插入的位置：全局（body）、原父节点或指定元素。 */
export type PreviewContainer = 'global' | 'parent' | ElementOrRef<HTMLElement>;

/**
 * 拖拽辅助元素（预览/占位符）模板。
 * `render` 返回可插入 DOM 的根元素；`destroy` 释放模板渲染资源。
 */
export interface DragHelperTemplate {
  render: () => HTMLElement;
  destroy: () => void;
}

/** 预览模板：额外支持按原条目尺寸对齐。 */
export interface DragPreviewTemplate extends DragHelperTemplate {
  matchSize?: boolean;
}

/** 被动监听选项（不阻止默认行为）。 */
const passiveEventListenerOptions: AddEventListenerOptions = {passive: true};

/** 主动监听选项。 */
const activeEventListenerOptions: AddEventListenerOptions = {passive: false};

/** 主动捕获监听选项。 */
const activeCapturingEventOptions: AddEventListenerOptions = {capture: true, passive: false};

/** 触摸事件后忽略合成鼠标事件的时间（毫秒）。 */
const MOUSE_EVENT_IGNORE_TIME = 800;

/** 占位符类名。 */
const PLACEHOLDER_CLASS = 'vcdk-drag-placeholder';

/** 拖拽时需要以 !important 覆盖的内联样式。 */
const dragImportantProperties = new Set(['position']);

/** 获取浏览器全局 document（SSR 环境下调用时返回 undefined 由调用方兜底）。 */
function getDocument(): Document {
  return typeof document !== 'undefined' ? document : (globalThis as {document: Document}).document;
}

/** 创建 DragRef：把元素变为可拖拽条目，使用模块级单例依赖。 */
export function createDragRef<T = unknown>(
  element: ElementOrRef<HTMLElement>,
  config: DragRefConfig = {
    dragStartThreshold: 5,
    pointerDirectionChangeThreshold: 5,
  },
): DragRef<T> {
  // 结构样式随拖拽条目创建注入（幂等）：不放在模块入口顶层调用，
  // 避免 barrel 入口被 tree-shaking 误判为无副作用而丢失样式。
  injectDragDropStyles();
  return new DragRef(element, config, getDocument(), viewportRuler, dragDropRegistry);
}

/** 拖拽移动事件载荷。 */
export interface DragMoveEvent {
  source: DragRef;
  pointerPosition: Point;
  event: MouseEvent | TouchEvent;
  distance: Point;
  delta: {x: -1 | 0 | 1; y: -1 | 0 | 1};
}

/** 拖放事件载荷。 */
export interface DragDropEvent {
  previousIndex: number;
  currentIndex: number;
  item: DragRef;
  container: DropListRef;
  previousContainer: DropListRef;
  distance: Point;
  dropPoint: Point;
  isPointerOverContainer: boolean;
  event: MouseEvent | TouchEvent;
}

/**
 * 可拖拽条目引用。自由拖拽（无容器）时直接位移根元素；
 * 位于 DropListRef 内时通过占位符/排序策略参与列表重排。
 */
export class DragRef<T = any> {
  private _rootElementCleanups: (() => void)[] | undefined;
  private _cleanupShadowRootSelectStart: (() => void) | undefined;

  /** 拖拽期间跟随指针的预览。 */
  private _preview: PreviewRef | null = null;

  /** 预览插入位置。 */
  private _previewContainer: PreviewContainer | undefined;

  /** 排序期间代替条目显示的占位符元素。 */
  private _placeholder!: HTMLElement;

  /** 用户在元素内按下的坐标。 */
  private _pickupPositionInElement!: Point;

  /** 用户在页面按下的坐标。 */
  private _pickupPositionOnPage!: Point;

  /** 记录条目原始 DOM 位置的标记节点。 */
  private _marker!: Comment;

  /** 条目离开初始容器后留下的锚点（hasAnchor 场景）。 */
  private _anchor: HTMLElement | null = null;

  /** 非拖拽状态下元素的位移（下次拖拽的基准）。 */
  private _passiveTransform: Point = {x: 0, y: 0};

  /** 拖拽中的位移。 */
  private _activeTransform: Point = {x: 0, y: 0};

  /** 首次拖拽前元素已有的 transform。 */
  private _initialTransform?: string;

  /** 拖拽序列是否已正式开启（与是否位移无关）。 */
  private _hasStartedDragging = false;

  /** 元素是否已发生位移。 */
  private _hasMoved = false;

  /** 拖拽开始时条目所在的容器。 */
  private _initialContainer!: DropListRef;

  /** 条目在初始容器中的起始索引。 */
  private _initialIndex!: number;

  /** 可滚动祖先的位置缓存。 */
  private _parentPositions: ParentPositionTracker;

  /** 指针移动方向增量缓存。 */
  private _pointerDirectionDelta!: {x: -1 | 0 | 1; y: -1 | 0 | 1};

  /** 上次方向改变时的指针位置。 */
  private _pointerPositionAtLastDirectionChange!: Point;

  /** 最近一次指针位置。 */
  private _lastKnownPointerPosition!: Point;

  /** 实际被拖拽移动的根元素。 */
  private _rootElement!: HTMLElement;

  /** 拖拽 SVG 元素时用于坐标换算的 ownerSVGElement。 */
  private _ownerSVGElement: SVGSVGElement | null = null;

  /** 拖拽开始前的 webkitTapHighlightColor，用于结束后恢复。 */
  private _rootElementTapHighlight!: string;

  private _pointerMoveSubscription: (() => void) | undefined;
  private _pointerUpSubscription: (() => void) | undefined;
  private _scrollSubscription: (() => void) | undefined;
  private _resizeSubscription: (() => void) | undefined;

  /** 上次触摸事件时间，用于过滤合成鼠标事件。 */
  private _lastTouchEventTime!: number;

  /** 上次拖拽序列开始时间。 */
  private _dragStartTime!: number;

  private _boundaryElement: HTMLElement | null = null;
  private _nativeInteractionsEnabled = true;

  private _initialDomRect?: DOMRect;
  private _previewRect?: DOMRect;
  private _boundaryRect?: DOMRect;

  private _previewTemplate?: DragPreviewTemplate | null;
  private _placeholderTemplate?: DragHelperTemplate | null;

  /** 可触发拖拽的 handle 元素。 */
  private _handles: HTMLElement[] = [];

  /** 当前被禁用的 handle。 */
  private _disabledHandles = new Set<HTMLElement>();

  /** 条目所属容器。 */
  private _dropContainer?: DropListRef;

  /** 布局方向。 */
  private _direction: Direction = 'ltr';

  /** 嵌套拖拽的父条目。 */
  private _parentDragRef: DragRef<unknown> | null = null;

  /** 缓存的 shadow root；undefined 表示尚未解析。 */
  private _cachedShadowRoot: ShadowRoot | null | undefined;

  /** 锁定拖拽的轴。 */
  lockAxis: 'x' | 'y' | null = null;

  /** 按下后等待多少毫秒才开启拖拽。 */
  dragStartDelay: number | {touch: number; mouse: number} = 0;

  /** 追加到预览元素的类名。 */
  previewClass: string | string[] | undefined;

  /** 父元素存在 scale 变换时用于修正位移的比例。 */
  scale: number = 1;

  private _disabled = false;

  /** 拖拽序列准备阶段派发（用于同步输入）。 */
  readonly beforeStarted = new Emitter<void>();

  /** 用户开始拖拽条目时派发。 */
  readonly started = new Emitter<{source: DragRef; event: MouseEvent | TouchEvent}>();

  /** 用户松开条目（动画开始前）派发。 */
  readonly released = new Emitter<{source: DragRef; event: MouseEvent | TouchEvent}>();

  /** 用户停止拖拽时派发。 */
  readonly ended = new Emitter<{
    source: DragRef;
    distance: Point;
    dropPoint: Point;
    event: MouseEvent | TouchEvent;
  }>();

  /** 条目进入新容器时派发。 */
  readonly entered = new Emitter<{container: DropListRef; item: DragRef; currentIndex: number}>();

  /** 条目移出容器时派发。 */
  readonly exited = new Emitter<{container: DropListRef; item: DragRef}>();

  /** 条目在容器内放下时派发。 */
  readonly dropped = new Emitter<DragDropEvent>();

  /** 拖拽过程中逐像素派发；仅在存在订阅者时触发，避免高频开销。 */
  readonly moved = new Emitter<DragMoveEvent>();

  /** 可附加到条目的任意数据（组件层用于引用组件实例）。 */
  data!: T;

  /** 自定义位置约束函数。 */
  constrainPosition?: DragConstrainPosition;

  constructor(
    element: ElementOrRef<HTMLElement>,
    private _config: DragRefConfig,
    private _document: Document = getDocument(),
    private _viewportRuler: ViewportRuler = viewportRuler,
    private _dragDropRegistry: DragDropRegistry = dragDropRegistry,
  ) {
    this.withRootElement(element).withParent(_config.parentDragRef || null);
    this._parentPositions = new ParentPositionTracker(_document);
    _dragDropRegistry.registerDragItem(this);
  }

  /** 条目是否被禁用：自身禁用或所在容器禁用。 */
  get disabled(): boolean {
    return this._disabled || !!(this._dropContainer && this._dropContainer.disabled);
  }
  set disabled(value: boolean) {
    if (value !== this._disabled) {
      this._disabled = value;
      this._toggleNativeDragInteractions();
      this._handles.forEach(handle => toggleNativeDragInteractions(handle, value));
    }
  }

  /** 拖拽期间代替条目的占位符元素。 */
  getPlaceholderElement(): HTMLElement {
    return this._placeholder;
  }

  /** 根拖拽元素。 */
  getRootElement(): HTMLElement {
    return this._rootElement;
  }

  /** 当前可见元素：拖拽中为占位符，否则为根元素。 */
  getVisibleElement(): HTMLElement {
    return this.isDragging() ? this.getPlaceholderElement() : this.getRootElement();
  }

  /** 注册可触发拖拽的 handle 元素。 */
  withHandles(handles: (HTMLElement | ElementOrRef<HTMLElement>)[]): this {
    this._handles = handles.map(handle => coerceElement(handle));
    this._handles.forEach(handle => toggleNativeDragInteractions(handle, this.disabled));
    this._toggleNativeDragInteractions();

    const disabledHandles = new Set<HTMLElement>();
    this._disabledHandles.forEach(handle => {
      if (this._handles.indexOf(handle) > -1) {
        disabledHandles.add(handle);
      }
    });
    this._disabledHandles = disabledHandles;
    return this;
  }

  /** 注册预览模板。 */
  withPreviewTemplate(template: DragPreviewTemplate | null): this {
    this._previewTemplate = template;
    return this;
  }

  /** 注册占位符模板。 */
  withPlaceholderTemplate(template: DragHelperTemplate | null): this {
    this._placeholderTemplate = template;
    return this;
  }

  /** 切换根元素（根元素是拖拽时被移动的元素）。 */
  withRootElement(rootElement: ElementOrRef<HTMLElement>): this {
    const element = coerceElement(rootElement);

    if (element !== this._rootElement) {
      this._removeRootElementListeners();
      this._rootElementCleanups = [
        addListener(element, 'mousedown', (event: Event) =>
          this._pointerDown(event as MouseEvent | TouchEvent),
        activeEventListenerOptions),
        addListener(element, 'touchstart', (event: Event) =>
          this._pointerDown(event as MouseEvent | TouchEvent),
        passiveEventListenerOptions),
        addListener(element, 'dragstart', (event: Event) =>
          this._nativeDragStart(event as DragEvent),
        activeEventListenerOptions),
      ];
      this._initialTransform = undefined;
      this._rootElement = element;
    }

    if (typeof SVGElement !== 'undefined' && this._rootElement instanceof SVGElement) {
      this._ownerSVGElement = this._rootElement.ownerSVGElement;
    }

    return this;
  }

  /** 设置位置约束边界；视口尺寸变化时自动把条目拉回边界内。 */
  withBoundaryElement(boundaryElement: ElementOrRef<HTMLElement> | null): this {
    this._boundaryElement = boundaryElement ? coerceElement(boundaryElement) : null;
    this._resizeSubscription?.();
    if (boundaryElement) {
      this._resizeSubscription = this._viewportRuler
        .change(10)
        .subscribe(() => this._containInsideBoundaryOnResize());
    }
    return this;
  }

  /** 设置嵌套拖拽的父条目。 */
  withParent(parent: DragRef<unknown> | null): this {
    this._parentDragRef = parent;
    return this;
  }

  /** 移除元素上的拖拽能力并释放全部资源。 */
  dispose() {
    this._removeRootElementListeners();

    if (this.isDragging()) {
      this._rootElement?.remove();
    }

    this._marker?.remove();
    this._destroyPreview();
    this._destroyPlaceholder();
    this._dragDropRegistry.removeDragItem(this);
    this._removeListeners();
    this.beforeStarted.complete();
    this.started.complete();
    this.released.complete();
    this.ended.complete();
    this.entered.complete();
    this.exited.complete();
    this.dropped.complete();
    this.moved.complete();
    this._handles = [];
    this._disabledHandles.clear();
    this._dropContainer = undefined;
    this._resizeSubscription?.();
    this._parentPositions.clear();
    this._boundaryElement =
      this._rootElement =
      this._ownerSVGElement =
      this._placeholderTemplate =
      this._previewTemplate =
      this._marker =
      this._parentDragRef =
        null!;
  }

  /** 条目是否正在拖拽。 */
  isDragging(): boolean {
    return this._hasStartedDragging && this._dragDropRegistry.isDragging(this);
  }

  /** 把自由拖拽条目重置到初始位置。 */
  reset(): void {
    this._rootElement.style.transform = this._initialTransform || '';
    this._activeTransform = {x: 0, y: 0};
    this._passiveTransform = {x: 0, y: 0};
  }

  /** 把条目重置回边界内（视口变化导致溢出时使用）。 */
  resetToBoundary(): void {
    if (
      this._boundaryElement &&
      this._rootElement &&
      isOverflowingParent(
        this._boundaryElement.getBoundingClientRect(),
        this._rootElement.getBoundingClientRect(),
      )
    ) {
      const parentRect = this._boundaryElement.getBoundingClientRect();
      const childRect = this._rootElement.getBoundingClientRect();

      let offsetX = 0;
      let offsetY = 0;

      if (childRect.left < parentRect.left) {
        offsetX = parentRect.left - childRect.left;
      } else if (childRect.right > parentRect.right) {
        offsetX = parentRect.right - childRect.right;
      }

      if (childRect.top < parentRect.top) {
        offsetY = parentRect.top - childRect.top;
      } else if (childRect.bottom > parentRect.bottom) {
        offsetY = parentRect.bottom - childRect.bottom;
      }

      const x = this._activeTransform.x + offsetX;
      const y = this._activeTransform.y + offsetY;

      this._rootElement.style.transform = getTransform(x, y);
      this._activeTransform = {x, y};
      this._passiveTransform = {x, y};
    }
  }

  /** 禁用指定 handle；被禁用的 handle 会拦截并中断拖拽。 */
  disableHandle(handle: HTMLElement) {
    if (!this._disabledHandles.has(handle) && this._handles.indexOf(handle) > -1) {
      this._disabledHandles.add(handle);
      toggleNativeDragInteractions(handle, true);
    }
  }

  /** 启用指定 handle。 */
  enableHandle(handle: HTMLElement) {
    if (this._disabledHandles.has(handle)) {
      this._disabledHandles.delete(handle);
      toggleNativeDragInteractions(handle, this.disabled);
    }
  }

  /** 设置条目布局方向。 */
  withDirection(direction: Direction): this {
    this._direction = direction;
    return this;
  }

  /** 设置条目所属容器（由 DropListRef.withItems 调用）。 */
  _withDropContainer(container: DropListRef) {
    this._dropContainer = container;
  }

  /** 获取自由拖拽当前位置（拖拽中为活动位移，否则为被动位移）。 */
  getFreeDragPosition(): Readonly<Point> {
    const position = this.isDragging() ? this._activeTransform : this._passiveTransform;
    return {x: position.x, y: position.y};
  }

  /** 设置自由拖拽位置。 */
  setFreeDragPosition(value: Point): this {
    this._activeTransform = {x: 0, y: 0};
    this._passiveTransform.x = value.x;
    this._passiveTransform.y = value.y;

    if (!this._dropContainer) {
      this._applyRootElementTransform(value.x, value.y);
    }

    return this;
  }

  /** 设置预览插入位置。 */
  withPreviewContainer(value: PreviewContainer): this {
    this._previewContainer = value;
    return this;
  }

  /** 基于最近一次指针位置重新排序（滚动期间由排序策略调用）。 */
  _sortFromLastPointerPosition() {
    const position = this._lastKnownPointerPosition;

    if (position && this._dropContainer) {
      this._updateActiveDropContainer(this._getConstrainedPointerPosition(position), position);
    }
  }

  /** 取消全部全局订阅。 */
  private _removeListeners() {
    this._pointerMoveSubscription?.();
    this._pointerUpSubscription?.();
    this._scrollSubscription?.();
    this._cleanupShadowRootSelectStart?.();
    this._pointerMoveSubscription =
      this._pointerUpSubscription =
      this._scrollSubscription =
      this._cleanupShadowRootSelectStart =
        undefined;
  }

  /** 销毁预览。 */
  private _destroyPreview() {
    this._preview?.destroy();
    this._preview = null;
  }

  /** 销毁占位符并恢复锚点。 */
  private _destroyPlaceholder() {
    this._anchor?.remove();
    this._placeholder?.remove();
    this._placeholder = this._anchor = null!;
  }

  /** mousedown / touchstart 处理：委托给 handle 或根元素开启拖拽序列。 */
  private _pointerDown = (event: MouseEvent | TouchEvent) => {
    this.beforeStarted.next();

    if (this._handles.length) {
      const targetHandle = this._getTargetHandle(event);

      if (targetHandle && !this._disabledHandles.has(targetHandle) && !this.disabled) {
        this._initializeDragSequence(targetHandle, event);
      }
    } else if (!this.disabled) {
      this._initializeDragSequence(this._rootElement, event);
    }
  };

  /** 指针移动处理：未达阈值时判定，达到后开始拖拽并持续位移。 */
  private _pointerMove = (event: MouseEvent | TouchEvent) => {
    const pointerPosition = this._getPointerPositionOnPage(event);

    if (!this._hasStartedDragging) {
      const distanceX = Math.abs(pointerPosition.x - this._pickupPositionOnPage.x);
      const distanceY = Math.abs(pointerPosition.y - this._pickupPositionOnPage.y);
      const isOverThreshold = distanceX + distanceY >= this._config.dragStartThreshold;

      if (isOverThreshold) {
        const isDelayElapsed = Date.now() >= this._dragStartTime + this._getDragStartDelay(event);
        const container = this._dropContainer;

        if (!isDelayElapsed) {
          this._endDragSequence(event);
          return;
        }

        if (!container || (!container.isDragging() && !container.isReceiving())) {
          if (event.cancelable) {
            event.preventDefault();
          }
          this._hasStartedDragging = true;
          this._startDragSequence(event);
        }
      }

      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const constrainedPointerPosition = this._getConstrainedPointerPosition(pointerPosition);
    this._hasMoved = true;
    this._lastKnownPointerPosition = pointerPosition;
    this._updatePointerDirectionDelta(constrainedPointerPosition);

    if (this._dropContainer) {
      this._updateActiveDropContainer(constrainedPointerPosition, pointerPosition);
    } else {
      const offset = this.constrainPosition ? this._initialDomRect! : this._pickupPositionOnPage;
      const activeTransform = this._activeTransform;
      activeTransform.x = constrainedPointerPosition.x - offset.x + this._passiveTransform.x;
      activeTransform.y = constrainedPointerPosition.y - offset.y + this._passiveTransform.y;
      this._applyRootElementTransform(activeTransform.x, activeTransform.y);
    }

    if (this.moved.hasListeners) {
      this.moved.next({
        source: this,
        pointerPosition: constrainedPointerPosition,
        event,
        distance: this._getDragDistance(constrainedPointerPosition),
        delta: this._pointerDirectionDelta,
      });
    }
  };

  /** 指针抬起：结束拖拽序列。 */
  private _pointerUp = (event: MouseEvent | TouchEvent) => {
    this._endDragSequence(event);
  };

  /** 清理订阅并结束拖拽序列。 */
  private _endDragSequence(event: MouseEvent | TouchEvent) {
    if (!this._dragDropRegistry.isDragging(this)) {
      return;
    }

    this._removeListeners();
    this._dragDropRegistry.stopDragging(this);
    this._toggleNativeDragInteractions();

    if (this._handles.length) {
      (this._rootElement.style as DragCSSStyleDeclaration).webkitTapHighlightColor =
        this._rootElementTapHighlight;
    }

    if (!this._hasStartedDragging) {
      return;
    }

    this.released.next({source: this, event});

    if (this._dropContainer) {
      this._dropContainer._stopScrolling();
      this._animatePreviewToPlaceholder().then(() => {
        this._cleanupDragArtifacts(event);
        this._cleanupCachedDimensions();
        this._dragDropRegistry.stopDragging(this);
      });
    } else {
      this._passiveTransform.x = this._activeTransform.x;
      const pointerPosition = this._getPointerPositionOnPage(event);
      this._passiveTransform.y = this._activeTransform.y;
      this.ended.next({
        source: this,
        distance: this._getDragDistance(pointerPosition),
        dropPoint: pointerPosition,
        event,
      });
      this._cleanupCachedDimensions();
      this._dragDropRegistry.stopDragging(this);
    }
  }

  /** 正式开启拖拽序列：创建占位符/预览，把根元素移出视觉。 */
  private _startDragSequence(event: MouseEvent | TouchEvent) {
    if (isTouchEvent(event)) {
      this._lastTouchEventTime = Date.now();
    }

    this._toggleNativeDragInteractions();

    const shadowRoot = this._getShadowRoot();
    const dropContainer = this._dropContainer;

    if (shadowRoot) {
      this._cleanupShadowRootSelectStart = addListener(
        shadowRoot,
        'selectstart',
        shadowDomSelectStart,
        activeCapturingEventOptions,
      );
    }

    if (dropContainer) {
      const element = this._rootElement;
      const parent = element.parentNode as HTMLElement;
      const placeholder = (this._placeholder = this._createPlaceholderElement());
      const marker = (this._marker =
        this._marker || this._document.createComment('vcdk-drag-marker'));

      parent.insertBefore(marker, element);
      this._initialTransform = element.style.transform || '';

      this._preview = new PreviewRef(
        this._document,
        this._rootElement,
        this._direction,
        this._initialDomRect!,
        this._previewTemplate || null,
        this.previewClass || null,
        this._pickupPositionOnPage,
        this._initialTransform,
        this._config.zIndex || 1000,
      );
      this._preview.attach(this._getPreviewInsertionPoint(parent, shadowRoot));

      // 根元素移出视觉（保留在 DOM 中，否则 iOS 会停止后续事件派发）。
      toggleVisibility(element, false, dragImportantProperties);
      this._document.body.appendChild(parent.replaceChild(placeholder, element));
      this.started.next({source: this, event});
      dropContainer.start();
      this._initialContainer = dropContainer;
      this._initialIndex = dropContainer.getItemIndex(this);
    } else {
      this.started.next({source: this, event});
      this._initialContainer = this._initialIndex = undefined!;
    }

    this._parentPositions.cache(dropContainer ? dropContainer.getScrollableParents() : []);
  }

  /** 初始化拖拽序列所需的变量与订阅。 */
  private _initializeDragSequence(referenceElement: HTMLElement, event: MouseEvent | TouchEvent) {
    if (this._parentDragRef) {
      event.stopPropagation();
    }

    const isDragging = this.isDragging();
    const isTouchSequence = isTouchEvent(event);
    const isAuxiliaryMouseButton = !isTouchSequence && (event as MouseEvent).button !== 0;
    const rootElement = this._rootElement;
    const target = getEventTarget(event);
    const isSyntheticEvent =
      !isTouchSequence &&
      this._lastTouchEventTime &&
      this._lastTouchEventTime + MOUSE_EVENT_IGNORE_TIME > Date.now();
    const isFakeEvent = isTouchSequence
      ? isFakeTouchstartFromScreenReader(event as TouchEvent)
      : isFakeMousedownFromScreenReader(event as MouseEvent);

    if (target && (target as HTMLElement).draggable && event.type === 'mousedown') {
      event.preventDefault();
    }

    if (isDragging || isAuxiliaryMouseButton || isSyntheticEvent || isFakeEvent) {
      return;
    }

    if (this._handles.length) {
      const rootStyles = rootElement.style as DragCSSStyleDeclaration;
      this._rootElementTapHighlight = rootStyles.webkitTapHighlightColor || '';
      rootStyles.webkitTapHighlightColor = 'transparent';
    }

    this._hasMoved = false;
    this._hasStartedDragging = this._hasMoved;

    this._removeListeners();
    this._initialDomRect = this._rootElement.getBoundingClientRect();
    this._pointerMoveSubscription = this._dragDropRegistry.pointerMove.subscribe(this._pointerMove);
    this._pointerUpSubscription = this._dragDropRegistry.pointerUp.subscribe(this._pointerUp);
    this._scrollSubscription = this._dragDropRegistry
      .scrolled(this._getShadowRoot())
      .subscribe(scrollEvent => this._updateOnScroll(scrollEvent));

    if (this._boundaryElement) {
      this._boundaryRect = getMutableClientRect(this._boundaryElement);
    }

    this._pickupPositionInElement =
      this._previewTemplate && !this._previewTemplate.matchSize
        ? {x: 0, y: 0}
        : this._getPointerPositionInElement(this._initialDomRect, referenceElement, event);
    const pointerPosition =
      (this._pickupPositionOnPage =
      this._lastKnownPointerPosition =
        this._getPointerPositionOnPage(event));
    this._pointerDirectionDelta = {x: 0, y: 0};
    this._pointerPositionAtLastDirectionChange = {x: pointerPosition.x, y: pointerPosition.y};
    this._dragStartTime = Date.now();
    this._dragDropRegistry.startDragging(this, event);
  }

  /** 清理拖拽产生的 DOM 产物并派发 ended/dropped。 */
  private _cleanupDragArtifacts(event: MouseEvent | TouchEvent) {
    // 拖回动画期间条目被销毁时（如测试立即卸载），跳过清理避免空引用。
    if (!this._rootElement || !this._marker) {
      return;
    }

    toggleVisibility(this._rootElement, true, dragImportantProperties);
    this._marker.parentNode!.replaceChild(this._rootElement, this._marker);

    this._destroyPreview();
    this._destroyPlaceholder();
    this._initialDomRect =
      this._boundaryRect =
      this._previewRect =
      this._initialTransform =
        undefined;

    const container = this._dropContainer!;
    const currentIndex = container.getItemIndex(this);
    const pointerPosition = this._getPointerPositionOnPage(event);
    const distance = this._getDragDistance(pointerPosition);
    const isPointerOverContainer = container._isOverContainer(pointerPosition.x, pointerPosition.y);

    this.ended.next({source: this, distance, dropPoint: pointerPosition, event});
    this.dropped.next({
      item: this,
      currentIndex,
      previousIndex: this._initialIndex,
      container,
      previousContainer: this._initialContainer,
      isPointerOverContainer,
      distance,
      dropPoint: pointerPosition,
      event,
    });
    container.drop(
      this,
      currentIndex,
      this._initialIndex,
      this._initialContainer,
      isPointerOverContainer,
      distance,
      pointerPosition,
      event,
    );
    this._dropContainer = this._initialContainer;
  }

  /** 按指针位置更新条目所在容器或触发排序。 */
  private _updateActiveDropContainer({x, y}: Point, {x: rawX, y: rawY}: Point) {
    let newContainer = this._initialContainer._getSiblingContainerFromPosition(this, x, y);

    if (
      !newContainer &&
      this._dropContainer !== this._initialContainer &&
      this._initialContainer._isOverContainer(x, y)
    ) {
      newContainer = this._initialContainer;
    }

    if (newContainer && newContainer !== this._dropContainer) {
      const exitIndex = this._dropContainer!.getItemIndex(this);
      const nextItemElement =
        this._dropContainer!.getItemAtIndex(exitIndex + 1)?.getVisibleElement() || null;

      this.exited.next({item: this, container: this._dropContainer!});
      this._dropContainer!.exit(this);
      this._conditionallyInsertAnchor(newContainer, this._dropContainer!, nextItemElement);
      this._dropContainer = newContainer!;
      this._dropContainer.enter(
        this,
        x,
        y,
        newContainer === this._initialContainer && newContainer.sortingDisabled
          ? this._initialIndex
          : undefined,
      );
      this.entered.next({
        item: this,
        container: newContainer!,
        currentIndex: newContainer!.getItemIndex(this),
      });
    }

    if (this.isDragging()) {
      this._dropContainer!._startScrollingIfNecessary(rawX, rawY);
      this._dropContainer!._sortItem(this, x, y, this._pointerDirectionDelta);

      if (this.constrainPosition) {
        this._applyPreviewTransform(x, y);
      } else {
        this._applyPreviewTransform(
          x - this._pickupPositionInElement.x,
          y - this._pickupPositionInElement.y,
        );
      }
    }
  }

  /** 预览动画到占位符位置，完成后 resolve。 */
  private _animatePreviewToPlaceholder(): Promise<void> {
    if (!this._hasMoved) {
      return Promise.resolve();
    }

    const placeholderRect = this._placeholder.getBoundingClientRect();
    this._preview!.addClass('vcdk-drag-animating');
    this._applyPreviewTransform(placeholderRect.left, placeholderRect.top);

    const duration = this._preview!.getTransitionDuration();

    if (duration === 0) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const handler = (event: TransitionEvent) => {
        if (
          !event ||
          (this._preview &&
            getEventTarget(event) === this._preview.element &&
            event.propertyName === 'transform')
        ) {
          cleanupListener();
          resolve();
          clearTimeout(timeout);
        }
      };

      const timeout = setTimeout(handler as (event?: TransitionEvent) => void, duration * 1.5);
      const cleanupListener = this._preview!.addEventListener('transitionend', handler);
    });
  }

  /** 创建占位符：自定义模板或根元素克隆。 */
  private _createPlaceholderElement(): HTMLElement {
    const placeholderConfig = this._placeholderTemplate;
    let placeholder: HTMLElement;

    if (placeholderConfig) {
      placeholder = placeholderConfig.render();
    } else {
      placeholder = deepCloneNode(this._rootElement);
    }

    placeholder.style.pointerEvents = 'none';
    placeholder.classList.add(PLACEHOLDER_CLASS);
    return placeholder;
  }

  /** 计算元素内的按下位置。 */
  private _getPointerPositionInElement(
    elementRect: DOMRect,
    referenceElement: HTMLElement,
    event: MouseEvent | TouchEvent,
  ): Point {
    const handleElement = referenceElement === this._rootElement ? null : referenceElement;
    const referenceRect = handleElement ? handleElement.getBoundingClientRect() : elementRect;
    const point = isTouchEvent(event) ? event.targetTouches[0] : event;
    const scrollPosition = this._getViewportScrollPosition();
    const x = point.pageX - referenceRect.left - scrollPosition.left;
    const y = point.pageY - referenceRect.top - scrollPosition.top;

    return {
      x: referenceRect.left - elementRect.left + x,
      y: referenceRect.top - elementRect.top + y,
    };
  }

  /** 计算页面指针位置（SVG 元素按矩阵换算）。 */
  private _getPointerPositionOnPage(event: MouseEvent | TouchEvent): Point {
    const scrollPosition = this._getViewportScrollPosition();
    const point = isTouchEvent(event)
      ? event.touches[0] || event.changedTouches[0] || {pageX: 0, pageY: 0}
      : event;

    const x = point.pageX - scrollPosition.left;
    const y = point.pageY - scrollPosition.top;

    if (this._ownerSVGElement) {
      const svgMatrix = this._ownerSVGElement.getScreenCTM();
      if (svgMatrix) {
        const svgPoint = this._ownerSVGElement.createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;
        return svgPoint.matrixTransform(svgMatrix.inverse());
      }
    }

    return {x, y};
  }

  /** 计算约束后的指针位置（lockAxis / boundary / constrainPosition）。 */
  private _getConstrainedPointerPosition(point: Point): Point {
    const dropContainerLock = this._dropContainer ? this._dropContainer.lockAxis : null;
    let {x, y} = this.constrainPosition
      ? this.constrainPosition(point, this, this._initialDomRect!, this._pickupPositionInElement)
      : point;

    if (this.lockAxis === 'x' || dropContainerLock === 'x') {
      y = this._pickupPositionOnPage.y - (this.constrainPosition ? this._pickupPositionInElement.y : 0);
    } else if (this.lockAxis === 'y' || dropContainerLock === 'y') {
      x = this._pickupPositionOnPage.x - (this.constrainPosition ? this._pickupPositionInElement.x : 0);
    }

    if (this._boundaryRect) {
      const {x: pickupX, y: pickupY} = !this.constrainPosition
        ? this._pickupPositionInElement
        : {x: 0, y: 0};

      const boundaryRect = this._boundaryRect;
      const {width: previewWidth, height: previewHeight} = this._getPreviewRect();
      const minY = boundaryRect.top + pickupY;
      const maxY = boundaryRect.bottom - (previewHeight - pickupY);
      const minX = boundaryRect.left + pickupX;
      const maxX = boundaryRect.right - (previewWidth - pickupX);

      x = clamp(x, minX, maxX);
      y = clamp(y, minY, maxY);
    }

    return {x, y};
  }

  /** 更新拖拽方向增量（超过阈值才更新，避免逐像素抖动）。 */
  private _updatePointerDirectionDelta(pointerPositionOnPage: Point) {
    const {x, y} = pointerPositionOnPage;
    const delta = this._pointerDirectionDelta;
    const positionSinceLastChange = this._pointerPositionAtLastDirectionChange;

    const changeX = Math.abs(x - positionSinceLastChange.x);
    const changeY = Math.abs(y - positionSinceLastChange.y);

    if (changeX > this._config.pointerDirectionChangeThreshold) {
      delta.x = x > positionSinceLastChange.x ? 1 : -1;
      positionSinceLastChange.x = x;
    }

    if (changeY > this._config.pointerDirectionChangeThreshold) {
      delta.y = y > positionSinceLastChange.y ? 1 : -1;
      positionSinceLastChange.y = y;
    }

    return delta;
  }

  /** 根据 handle 数量切换原生拖拽交互。 */
  private _toggleNativeDragInteractions() {
    if (!this._rootElement || !this._handles) {
      return;
    }

    const shouldEnable = this._handles.length > 0 || !this.isDragging();

    if (shouldEnable !== this._nativeInteractionsEnabled) {
      this._nativeInteractionsEnabled = shouldEnable;
      toggleNativeDragInteractions(this._rootElement, shouldEnable);
    }
  }

  /** 移除根元素上的监听。 */
  private _removeRootElementListeners() {
    this._rootElementCleanups?.forEach(cleanup => cleanup());
    this._rootElementCleanups = undefined;
  }

  /** 应用根元素 transform，保留原有 transform。 */
  private _applyRootElementTransform(x: number, y: number) {
    const scale = 1 / this.scale;
    const transform = getTransform(x * scale, y * scale);
    const styles = this._rootElement.style;

    if (this._initialTransform == null) {
      this._initialTransform =
        styles.transform && styles.transform != 'none' ? styles.transform : '';
    }

    styles.transform = combineTransforms(transform, this._initialTransform);
  }

  /** 应用预览 transform，自定义模板时忽略原元素 transform。 */
  private _applyPreviewTransform(x: number, y: number) {
    const initialTransform = this._previewTemplate?.render ? undefined : this._initialTransform;
    const transform = getTransform(x, y);
    this._preview!.setTransform(combineTransforms(transform, initialTransform));
  }

  /** 计算拖拽距离。 */
  private _getDragDistance(currentPosition: Point): Point {
    const pickupPosition = this._pickupPositionOnPage;

    if (pickupPosition) {
      return {x: currentPosition.x - pickupPosition.x, y: currentPosition.y - pickupPosition.y};
    }

    return {x: 0, y: 0};
  }

  /** 清理缓存的矩形数据。 */
  private _cleanupCachedDimensions() {
    this._boundaryRect = this._previewRect = undefined;
    this._parentPositions.clear();
  }

  /** 视口尺寸变化后把条目拉回边界内。 */
  private _containInsideBoundaryOnResize() {
    let {x, y} = this._passiveTransform;

    if ((x === 0 && y === 0) || this.isDragging() || !this._boundaryElement) {
      return;
    }

    const elementRect = this._rootElement.getBoundingClientRect();
    const boundaryRect = this._boundaryElement.getBoundingClientRect();

    if (
      (boundaryRect.width === 0 && boundaryRect.height === 0) ||
      (elementRect.width === 0 && elementRect.height === 0)
    ) {
      return;
    }

    const leftOverflow = boundaryRect.left - elementRect.left;
    const rightOverflow = elementRect.right - boundaryRect.right;
    const topOverflow = boundaryRect.top - elementRect.top;
    const bottomOverflow = elementRect.bottom - boundaryRect.bottom;

    if (boundaryRect.width > elementRect.width) {
      if (leftOverflow > 0) {
        x += leftOverflow;
      }

      if (rightOverflow > 0) {
        x -= rightOverflow;
      }
    } else {
      x = 0;
    }

    if (boundaryRect.height > elementRect.height) {
      if (topOverflow > 0) {
        y += topOverflow;
      }

      if (bottomOverflow > 0) {
        y -= bottomOverflow;
      }
    } else {
      y = 0;
    }

    if (x !== this._passiveTransform.x || y !== this._passiveTransform.y) {
      this.setFreeDragPosition({y, x});
    }
  }

  /** 按事件类型解析拖拽启动延迟。 */
  private _getDragStartDelay(event: MouseEvent | TouchEvent): number {
    const value = this.dragStartDelay;

    if (typeof value === 'number') {
      return value;
    } else if (isTouchEvent(event)) {
      return value.touch;
    }

    return value ? value.mouse : 0;
  }

  /** 滚动期间平移内部缓存并调整自由拖拽位移。 */
  private _updateOnScroll(event: Event) {
    const scrollDifference = this._parentPositions.handleScroll(event);

    if (scrollDifference) {
      const target = getEventTarget(event) as HTMLElement | Document | null;

      if (
        this._boundaryRect &&
        target &&
        target !== this._boundaryElement &&
        target.contains(this._boundaryElement)
      ) {
        adjustDomRect(this._boundaryRect, scrollDifference.top, scrollDifference.left);
      }

      this._pickupPositionOnPage.x += scrollDifference.left;
      this._pickupPositionOnPage.y += scrollDifference.top;

      if (!this._dropContainer) {
        this._activeTransform.x -= scrollDifference.left;
        this._activeTransform.y -= scrollDifference.top;
        this._applyRootElementTransform(this._activeTransform.x, this._activeTransform.y);
      }
    }
  }

  /** 获取视口滚动位置。 */
  private _getViewportScrollPosition() {
    return (
      this._parentPositions.positions.get(this._document)?.scrollPosition ||
      this._parentPositions.getViewportScrollPosition()
    );
  }

  /** 延迟解析 shadow root，确保元素已进入 Shadow DOM。 */
  private _getShadowRoot(): ShadowRoot | null {
    if (this._cachedShadowRoot === undefined) {
      this._cachedShadowRoot = getShadowRoot(this._rootElement);
    }

    return this._cachedShadowRoot;
  }

  /** 计算预览插入点。 */
  private _getPreviewInsertionPoint(
    initialParent: HTMLElement,
    shadowRoot: ShadowRoot | null,
  ): HTMLElement {
    const previewContainer = this._previewContainer || 'global';

    if (previewContainer === 'parent') {
      return initialParent;
    }

    if (previewContainer === 'global') {
      const documentRef = this._document;

      return ((
        shadowRoot ||
        documentRef.fullscreenElement ||
        (documentRef as Document & {webkitFullscreenElement?: Element}).webkitFullscreenElement ||
        (documentRef as Document & {mozFullScreenElement?: Element}).mozFullScreenElement ||
        (documentRef as Document & {msFullscreenElement?: Element}).msFullscreenElement ||
        documentRef.body
      ) as unknown) as HTMLElement;
    }

    return coerceElement(previewContainer);
  }

  /** 延迟解析预览尺寸（缓存；尺寸为 0 时重新测量）。 */
  private _getPreviewRect(): DOMRect {
    if (!this._previewRect || (!this._previewRect.width && !this._previewRect.height)) {
      this._previewRect = this._preview
        ? this._preview.getBoundingClientRect()
        : this._initialDomRect!;
    }

    return this._previewRect;
  }

  /** 阻止原生 dragstart（带 handle 时只允许从 handle 拖起）。 */
  private _nativeDragStart = (event: DragEvent) => {
    if (this._handles.length) {
      const targetHandle = this._getTargetHandle(event);

      if (targetHandle && !this._disabledHandles.has(targetHandle) && !this.disabled) {
        event.preventDefault();
      }
    } else if (!this.disabled) {
      event.preventDefault();
    }
  };

  /** 查找事件目标命中的 handle。 */
  private _getTargetHandle(event: Event): HTMLElement | undefined {
    return this._handles.find(handle => {
      return event.target && (event.target === handle || handle.contains(event.target as Node));
    });
  }

  /** 离开初始容器时按需插入锚点，保持列表视觉一致。 */
  private _conditionallyInsertAnchor(
    newContainer: DropListRef,
    exitContainer: DropListRef,
    nextItemElement: HTMLElement | null,
  ) {
    if (newContainer === this._initialContainer) {
      this._anchor?.remove();
      this._anchor = null;
    } else if (exitContainer === this._initialContainer && exitContainer.hasAnchor) {
      const anchor = (this._anchor ??= deepCloneNode(this._placeholder));
      anchor.classList.remove(PLACEHOLDER_CLASS);
      anchor.classList.add('vcdk-drag-anchor');
      anchor.style.transform = '';

      if (nextItemElement) {
        nextItemElement.before(anchor);
      } else {
        coerceElement(exitContainer.element).appendChild(anchor);
      }
    }
  }
}

/** 把值夹在 [min, max] 区间。 */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** 事件是否为触摸事件（按类型首字母判断，最高频路径）。 */
function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return event.type[0] === 't';
}

/** Shadow DOM 内阻止 selectstart 的回调。 */
function shadowDomSelectStart(event: Event) {
  event.preventDefault();
}
