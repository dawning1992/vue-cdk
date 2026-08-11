import type {Ref} from 'vue';
import type {OverlayRef} from '../overlay-ref';
import type {PositionStrategy} from './position-strategy';
import {
  type ConnectedPosition,
  type ViewportMargin,
  ConnectedOverlayPositionChange,
  ScrollingVisibility,
  validateHorizontalPosition,
  validateVerticalPosition,
} from './connected-position';
import {
  isElementClippedByScrolling,
  isElementScrolledOutsideView,
  type Dimensions,
} from './scroll-clip';
import {Emitter} from '../../emitter';
import {coerceArray, coerceCssPixelValue} from '../../coercion';
import {isBrowser} from '../../platform';
import {viewportRuler as defaultViewportRuler, type ViewportRuler} from '../../scrolling';
import {overlayContainer as defaultOverlayContainer, OverlayContainer} from '../overlay-container';

/** 定位算法使用的连接原点：元素、元素引用或屏幕坐标点。 */
export type FlexibleConnectedPositionStrategyOrigin =
  | HTMLElement
  | Ref<HTMLElement | null | undefined>
  | (Point & {width?: number; height?: number});

/** 原生 Popover 渲染时的 DOM 插入位置。 */
export type FlexibleOverlayPopoverLocation =
  | 'global'
  | 'inline'
  | {type: 'parent'; element: Element};

/** 重导出连接位置类型，保持与 Angular 从策略模块导出 ConnectedPosition 的 API 一致。 */
export type {ConnectedPosition} from './connected-position';

/** 可作为滚动容器的对象：直接传元素或包装对象。 */
export type ScrollableContainer = HTMLElement | {element: HTMLElement};

/** 简单二维坐标。 */
export interface Point {
  x: number;
  y: number;
}

/** 定位策略依赖，均可在测试中注入自定义实例。 */
export interface FlexibleConnectedPositionStrategyDeps {
  viewportRuler?: ViewportRuler;
  document?: Document;
  overlayContainer?: OverlayContainer;
}

/** 连接定位 bounding box 的类名。 */
const boundingBoxClass = 'vcdk-overlay-connected-position-bounding-box';

/** 用于拆分 CSS 数值与单位。 */
const cssUnitPattern = /([A-Za-z%]+)$/;

/**
 * 连接定位策略：以触发元素（或坐标点）为原点，从一组候选位置中
 * 自动选择最适配视口的方案。
 *
 * 位置选择优先级（与 Angular 一致）：
 * 1. 首个完整落在视口内的候选位置；
 * 2. 开启 flexible 尺寸时，可用面积 × weight 得分最高的位置；
 * 3. 开启 push 时，越界最少的候选位置并整体推回视口；
 * 4. 兜底使用越界最少的位置。
 */
export class FlexibleConnectedPositionStrategy implements PositionStrategy {
  private _overlayRef: OverlayRef | null = null;
  private _isInitialRender = false;
  private _lastBoundingBoxSize = {width: 0, height: 0};
  private _isPushed = false;
  private _canPush = true;
  private _growAfterOpen = false;
  private _hasFlexibleDimensions = true;
  private _positionLocked = false;

  private _originRect!: Dimensions;
  private _overlayRect!: Dimensions;
  private _viewportRect!: Dimensions;
  private _containerRect!: Dimensions;

  private _viewportMargin: ViewportMargin = 0;
  private _scrollables: HTMLElement[] = [];
  private _preferredPositions: ConnectedPosition[] = [];
  private _origin!: FlexibleConnectedPositionStrategyOrigin;
  private _pane!: HTMLElement;
  private _isDisposed = false;
  private _boundingBox: HTMLElement | null = null;
  private _lastPosition: ConnectedPosition | null = null;
  private _lastScrollVisibility: ScrollingVisibility | null = null;
  private readonly _positionChanges = new Emitter<ConnectedOverlayPositionChange>();
  private _resizeCleanup: (() => void) | undefined;
  private _offsetX = 0;
  private _offsetY = 0;
  private _transformOriginSelector = '';
  private _appliedPanelClasses: string[] = [];
  private _previousPushAmount: {x: number; y: number} | null = null;
  private _popoverLocation: FlexibleOverlayPopoverLocation = 'global';

  private _viewportRuler: ViewportRuler;
  private _document: Document;
  private _overlayContainer: OverlayContainer;

  /** 位置变化事件流。 */
  positionChanges: Emitter<ConnectedOverlayPositionChange> = this._positionChanges;

  /** 当前候选位置列表（从最优到最差排序）。 */
  get positions(): ConnectedPosition[] {
    return this._preferredPositions;
  }

  constructor(
    connectedTo: FlexibleConnectedPositionStrategyOrigin,
    deps: FlexibleConnectedPositionStrategyDeps = {},
  ) {
    this._viewportRuler = deps.viewportRuler ?? defaultViewportRuler;
    this._document = deps.document ?? (isBrowser() ? window.document : (undefined as unknown as Document));
    this._overlayContainer = deps.overlayContainer ?? defaultOverlayContainer;
    this.setOrigin(connectedTo);
  }

  /** 绑定到 overlay：校验候选位置并订阅视口 resize。 */
  attach(overlayRef: OverlayRef): void {
    if (this._overlayRef && overlayRef !== this._overlayRef) {
      throw Error('FlexibleConnectedPositionStrategy: 该策略已绑定到另一个 overlay。');
    }
    this._validatePositions();

    overlayRef.hostElement.classList.add(boundingBoxClass);
    this._overlayRef = overlayRef;
    this._boundingBox = overlayRef.hostElement;
    this._pane = overlayRef.overlayElement;
    this._isDisposed = false;
    this._isInitialRender = true;
    this._lastPosition = null;

    this._resizeCleanup?.();
    // 窗口 resize 时视为首次定位，允许策略重新选择最优位置
    // （否则位置锁定会导致 overlay 停留在旧位置）。
    this._resizeCleanup = this._viewportRuler.change().subscribe(() => {
      this._isInitialRender = true;
      this.apply();
    });
  }

  /** 依据当前几何信息重新计算并应用最优位置。 */
  apply(): void {
    if (this._isDisposed || !isBrowser()) {
      return;
    }

    // 非首次渲染且启用了位置锁定时，沿用上次计算的位置，避免 overlay 跳动。
    if (!this._isInitialRender && this._positionLocked && this._lastPosition) {
      this.reapplyLastPosition();
      return;
    }

    this._clearPanelClasses();
    this._resetOverlayElementStyles();
    this._resetBoundingBoxStyles();

    this._viewportRect = this._getNarrowedViewportRect();
    this._originRect = this._getOriginRect();
    this._overlayRect = this._pane.getBoundingClientRect();
    this._containerRect = this._getContainerRect();

    const originRect = this._originRect;
    const overlayRect = this._overlayRect;
    const viewportRect = this._viewportRect;
    const containerRect = this._containerRect;

    const flexibleFits: FlexibleFit[] = [];
    let fallback: FallbackPosition | undefined;

    for (const pos of this._preferredPositions) {
      const originPoint = this._getOriginPoint(originRect, containerRect, pos);
      const overlayPoint = this._getOverlayPoint(originPoint, overlayRect, pos);
      const overlayFit = this._getOverlayFit(overlayPoint, overlayRect, viewportRect, pos);

      if (overlayFit.isCompletelyWithinViewport) {
        this._isPushed = false;
        this._applyPosition(pos, originPoint);
        return;
      }

      if (this._canFitWithFlexibleDimensions(overlayFit, overlayPoint, viewportRect)) {
        flexibleFits.push({
          position: pos,
          origin: originPoint,
          overlayRect,
          boundingBoxRect: this._calculateBoundingBoxRect(originPoint, pos),
        });
        continue;
      }

      if (!fallback || fallback.overlayFit.visibleArea < overlayFit.visibleArea) {
        fallback = {overlayFit, overlayPoint, originPoint, position: pos, overlayRect};
      }
    }

    if (flexibleFits.length) {
      let bestFit: FlexibleFit | null = null;
      let bestScore = -1;
      for (const fit of flexibleFits) {
        const score =
          fit.boundingBoxRect.width * fit.boundingBoxRect.height * (fit.position.weight || 1);
        if (score > bestScore) {
          bestScore = score;
          bestFit = fit;
        }
      }
      this._isPushed = false;
      this._applyPosition(bestFit!.position, bestFit!.origin);
      return;
    }

    if (this._canPush) {
      this._isPushed = true;
      this._applyPosition(fallback!.position, fallback!.originPoint);
      return;
    }

    this._applyPosition(fallback!.position, fallback!.originPoint);
  }

  /** 卸载内容时清理：移除位置类并释放 resize 监听。 */
  detach(): void {
    this._clearPanelClasses();
    this._lastPosition = null;
    this._previousPushAmount = null;
    this._resizeCleanup?.();
    this._resizeCleanup = undefined;
  }

  /** 销毁策略：还原样式、解除绑定并结束事件流。 */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    if (this._boundingBox) {
      extendStyles(this._boundingBox.style, {
        top: '',
        left: '',
        right: '',
        bottom: '',
        height: '',
        width: '',
        alignItems: '',
        justifyContent: '',
      } as CSSStyleDeclaration);
    }
    if (this._pane) {
      this._resetOverlayElementStyles();
    }
    if (this._overlayRef) {
      this._overlayRef.hostElement.classList.remove(boundingBoxClass);
    }
    this.detach();
    this._positionChanges.complete();
    this._overlayRef = null;
    this._boundingBox = null;
    this._isDisposed = true;
  }

  /**
   * 沿用上次计算的位置重新对齐（即使更高优先级的候选现在可以放下）。
   * 用于滚动重新定位时保持面板朝向不变。
   */
  reapplyLastPosition(): void {
    if (this._isDisposed || !isBrowser()) {
      return;
    }
    const lastPosition = this._lastPosition;
    if (lastPosition) {
      this._originRect = this._getOriginRect();
      this._overlayRect = this._pane.getBoundingClientRect();
      this._viewportRect = this._getNarrowedViewportRect();
      this._containerRect = this._getContainerRect();
      this._applyPosition(
        lastPosition,
        this._getOriginPoint(this._originRect, this._containerRect, lastPosition),
      );
    } else {
      this.apply();
    }
  }

  /** 设置用于判断裁剪/移出视口的滚动容器列表。 */
  withScrollableContainers(scrollables: ScrollableContainer[]): this {
    this._scrollables = scrollables.map(item =>
      item instanceof HTMLElement ? item : item.element,
    );
    return this;
  }

  /** 设置候选位置列表（从优到劣）。 */
  withPositions(positions: ConnectedPosition[]): this {
    this._preferredPositions = positions;
    if (positions.indexOf(this._lastPosition!) === -1) {
      this._lastPosition = null;
    }
    this._validatePositions();
    return this;
  }

  /** 设置 overlay 与视口边缘的最小间距（整体或按方向）。 */
  withViewportMargin(margin: ViewportMargin): this {
    this._viewportMargin = margin;
    return this;
  }

  /** 是否允许 overlay 的宽高被约束以适配视口。 */
  withFlexibleDimensions(flexibleDimensions = true): this {
    this._hasFlexibleDimensions = flexibleDimensions;
    return this;
  }

  /** 是否允许首次定位后继续增大尺寸（受视口约束）。 */
  withGrowAfterOpen(growAfterOpen = true): this {
    this._growAfterOpen = growAfterOpen;
    return this;
  }

  /** 候选位置全部越界时，是否将 overlay 推回视口内。 */
  withPush(canPush = true): this {
    this._canPush = canPush;
    return this;
  }

  /** 首次定位后锁定位置，后续重新定位沿用原朝向。 */
  withLockedPosition(isLocked = true): this {
    this._positionLocked = isLocked;
    return this;
  }

  /** 更换定位原点（元素、元素引用或坐标点）。 */
  setOrigin(origin: FlexibleConnectedPositionStrategyOrigin): this {
    this._origin = origin;
    return this;
  }

  /** 设置默认 X 轴偏移；候选位置自身的 offsetX 优先。 */
  withDefaultOffsetX(offset: number): this {
    this._offsetX = offset;
    return this;
  }

  /** 设置默认 Y 轴偏移；候选位置自身的 offsetY 优先。 */
  withDefaultOffsetY(offset: number): this {
    this._offsetY = offset;
    return this;
  }

  /**
   * 配置 transform-origin：根据当前选中位置，为面板内匹配选择器的元素
   * 设置动画原点，使入场动画从连接点方向展开。
   */
  withTransformOriginOn(selector: string): this {
    this._transformOriginSelector = selector;
    return this;
  }

  /** 配置 Popover 模式的 DOM 插入位置。 */
  withPopoverLocation(location: FlexibleOverlayPopoverLocation): this {
    this._popoverLocation = location;
    return this;
  }

  /** 返回 Popover 模式的插入点；global 返回 null（使用全局容器）。 */
  getPopoverInsertionPoint(): Element | null | {type: 'parent'; element: Element} {
    if (this._popoverLocation === 'global') {
      return null;
    }
    if (this._popoverLocation !== 'inline') {
      return this._popoverLocation;
    }
    const origin = unwrapOrigin(this._origin);
    return origin instanceof HTMLElement ? origin : null;
  }

  /** 计算 origin 上连接点的屏幕坐标。 */
  private _getOriginPoint(
    originRect: Dimensions,
    containerRect: Dimensions,
    pos: ConnectedPosition,
  ): Point {
    let x: number;
    if (pos.originX === 'center') {
      // 居中时始终基于 left 计算，避免 RTL 下偏移错误。
      x = originRect.left + originRect.width / 2;
    } else {
      const startX = this._isRtl() ? originRect.right : originRect.left;
      const endX = this._isRtl() ? originRect.left : originRect.right;
      x = pos.originX === 'start' ? startX : endX;
    }

    // Safari 缩放时容器矩形可能出现负偏移，需补偿到坐标中。
    if (containerRect.left < 0) {
      x -= containerRect.left;
    }

    let y: number;
    if (pos.originY === 'center') {
      y = originRect.top + originRect.height / 2;
    } else {
      y = pos.originY === 'top' ? originRect.top : originRect.bottom;
    }

    // 移动端浏览器为聚焦输入框可能整体平移页面，同样需要补偿。
    if (containerRect.top < 0) {
      y -= containerRect.top;
    }

    return {x, y};
  }

  /** 由 origin 连接点计算 overlay 左上角坐标。 */
  private _getOverlayPoint(
    originPoint: Point,
    overlayRect: Dimensions,
    pos: ConnectedPosition,
  ): Point {
    let overlayStartX: number;
    if (pos.overlayX === 'center') {
      overlayStartX = -overlayRect.width / 2;
    } else if (pos.overlayX === 'start') {
      overlayStartX = this._isRtl() ? -overlayRect.width : 0;
    } else {
      overlayStartX = this._isRtl() ? 0 : -overlayRect.width;
    }

    let overlayStartY: number;
    if (pos.overlayY === 'center') {
      overlayStartY = -overlayRect.height / 2;
    } else {
      overlayStartY = pos.overlayY === 'top' ? 0 : -overlayRect.height;
    }

    return {
      x: originPoint.x + overlayStartX,
      y: originPoint.y + overlayStartY,
    };
  }

  /** 计算 overlay 在指定位置与视口的适配程度。 */
  private _getOverlayFit(
    point: Point,
    rawOverlayRect: Dimensions,
    viewport: Dimensions,
    position: ConnectedPosition,
  ): OverlayFit {
    const overlay = getRoundedBoundingClientRect(rawOverlayRect);
    let {x, y} = point;
    const offsetX = this._getOffset(position, 'x');
    const offsetY = this._getOffset(position, 'y');

    if (offsetX) {
      x += offsetX;
    }
    if (offsetY) {
      y += offsetY;
    }

    const leftOverflow = 0 - x;
    const rightOverflow = x + overlay.width - viewport.width;
    const topOverflow = 0 - y;
    const bottomOverflow = y + overlay.height - viewport.height;

    const visibleWidth = this._subtractOverflows(overlay.width, leftOverflow, rightOverflow);
    const visibleHeight = this._subtractOverflows(overlay.height, topOverflow, bottomOverflow);
    const visibleArea = visibleWidth * visibleHeight;

    return {
      visibleArea,
      isCompletelyWithinViewport: overlay.width * overlay.height === visibleArea,
      fitsInViewportVertically: visibleHeight === overlay.height,
      fitsInViewportHorizontally: visibleWidth === overlay.width,
    };
  }

  /** flexible 尺寸下，判断位置是否至少能满足最小宽高。 */
  private _canFitWithFlexibleDimensions(
    fit: OverlayFit,
    point: Point,
    viewport: Dimensions,
  ): boolean {
    if (this._hasFlexibleDimensions) {
      const availableHeight = viewport.bottom - point.y;
      const availableWidth = viewport.right - point.x;
      const minHeight = getPixelValue(this._overlayRef!.getConfig().minHeight);
      const minWidth = getPixelValue(this._overlayRef!.getConfig().minWidth);
      const verticalFit =
        fit.fitsInViewportVertically || (minHeight != null && minHeight <= availableHeight);
      const horizontalFit =
        fit.fitsInViewportHorizontally || (minWidth != null && minWidth <= availableWidth);
      return verticalFit && horizontalFit;
    }
    return false;
  }

  /**
   * 将越界的 overlay 推回视口。位置锁定时复用上次的推入量，
   * 避免滚动时元素持续“跟随”视口边缘。
   */
  private _pushOverlayOnScreen(
    start: Point,
    rawOverlayRect: Dimensions,
    scrollPosition: {top: number; left: number},
  ): Point {
    if (this._previousPushAmount && this._positionLocked) {
      return {
        x: start.x + this._previousPushAmount.x,
        y: start.y + this._previousPushAmount.y,
      };
    }

    const overlay = getRoundedBoundingClientRect(rawOverlayRect);
    const viewport = this._viewportRect;

    const overflowRight = Math.max(start.x + overlay.width - viewport.width, 0);
    const overflowBottom = Math.max(start.y + overlay.height - viewport.height, 0);
    const overflowTop = Math.max(viewport.top - scrollPosition.top - start.y, 0);
    const overflowLeft = Math.max(viewport.left - scrollPosition.left - start.x, 0);

    let pushX = 0;
    let pushY = 0;

    if (overlay.width <= viewport.width) {
      pushX = overflowLeft || -overflowRight;
    } else {
      pushX = start.x < this._getViewportMarginStart()
        ? viewport.left - scrollPosition.left - start.x
        : 0;
    }

    if (overlay.height <= viewport.height) {
      pushY = overflowTop || -overflowBottom;
    } else {
      pushY = start.y < this._getViewportMarginTop()
        ? viewport.top - scrollPosition.top - start.y
        : 0;
    }

    this._previousPushAmount = {x: pushX, y: pushY};
    return {x: start.x + pushX, y: start.y + pushY};
  }

  /** 应用位置：设置 transform-origin、面板样式、bounding box 并派发变更事件。 */
  private _applyPosition(position: ConnectedPosition, originPoint: Point): void {
    this._setTransformOrigin(position);
    this._setOverlayElementStyles(originPoint, position);
    this._setBoundingBoxStyles(originPoint, position);

    if (position.panelClass) {
      this._addPanelClasses(position.panelClass);
    }

    if (this._positionChanges.hasListeners) {
      const scrollVisibility = this._getScrollVisibility();
      if (
        position !== this._lastPosition ||
        !this._lastScrollVisibility ||
        !compareScrollVisibility(this._lastScrollVisibility, scrollVisibility)
      ) {
        this._positionChanges.next(
          new ConnectedOverlayPositionChange(position, scrollVisibility),
        );
      }
      this._lastScrollVisibility = scrollVisibility;
    }

    this._lastPosition = position;
    this._isInitialRender = false;
  }

  /** 根据选中位置为匹配选择器的元素设置 transform-origin。 */
  private _setTransformOrigin(position: ConnectedPosition): void {
    if (!this._transformOriginSelector) {
      return;
    }
    const elements = this._boundingBox!.querySelectorAll<HTMLElement>(
      this._transformOriginSelector,
    );
    let xOrigin: 'left' | 'right' | 'center';
    const yOrigin: 'top' | 'bottom' | 'center' = position.overlayY;

    if (position.overlayX === 'center') {
      xOrigin = 'center';
    } else if (this._isRtl()) {
      xOrigin = position.overlayX === 'start' ? 'right' : 'left';
    } else {
      xOrigin = position.overlayX === 'start' ? 'left' : 'right';
    }

    for (const element of elements) {
      element.style.transformOrigin = `${xOrigin} ${yOrigin}`;
    }
  }

  /** 计算连接定位 bounding box 的位置与尺寸（不落样式，供评分使用）。 */
  private _calculateBoundingBoxRect(origin: Point, position: ConnectedPosition): BoundingBoxRect {
    const viewport = this._viewportRect;
    const isRtl = this._isRtl();
    let height: number;
    let top: number;
    let bottom: number;

    if (position.overlayY === 'top') {
      top = origin.y;
      height = viewport.height - top + this._getViewportMarginBottom();
    } else if (position.overlayY === 'bottom') {
      bottom =
        viewport.height - origin.y + this._getViewportMarginTop() + this._getViewportMarginBottom();
      height = viewport.height - bottom + this._getViewportMarginTop();
    } else {
      const smallestDistanceToViewportEdge = Math.min(
        viewport.bottom - origin.y + viewport.top,
        origin.y,
      );
      const previousHeight = this._lastBoundingBoxSize.height;
      height = smallestDistanceToViewportEdge * 2;
      top = origin.y - smallestDistanceToViewportEdge;
      if (height > previousHeight && !this._isInitialRender && !this._growAfterOpen) {
        top = origin.y - previousHeight / 2;
      }
    }

    const isBoundedByRightViewportEdge =
      (position.overlayX === 'start' && !isRtl) || (position.overlayX === 'end' && isRtl);
    const isBoundedByLeftViewportEdge =
      (position.overlayX === 'end' && !isRtl) || (position.overlayX === 'start' && isRtl);

    let width: number;
    let left: number;
    let right: number;

    if (isBoundedByLeftViewportEdge) {
      right =
        viewport.width - origin.x + this._getViewportMarginStart() + this._getViewportMarginEnd();
      width = origin.x - this._getViewportMarginStart();
    } else if (isBoundedByRightViewportEdge) {
      left = origin.x;
      width = viewport.right - origin.x - this._getViewportMarginEnd();
    } else {
      const smallestDistanceToViewportEdge = Math.min(
        viewport.right - origin.x + viewport.left,
        origin.x,
      );
      const previousWidth = this._lastBoundingBoxSize.width;
      width = smallestDistanceToViewportEdge * 2;
      left = origin.x - smallestDistanceToViewportEdge;
      if (width > previousWidth && !this._isInitialRender && !this._growAfterOpen) {
        left = origin.x - previousWidth / 2;
      }
    }

    return {top: top!, left: left!, bottom: bottom!, right: right!, width, height};
  }

  /** 将 bounding box 样式应用到 host。 */
  private _setBoundingBoxStyles(origin: Point, position: ConnectedPosition): void {
    const boundingBoxRect = this._calculateBoundingBoxRect(origin, position);

    // 避免滚动时 overlay 尺寸“越滚越大”：非首次渲染且未开启 grow 时
    // 取上次尺寸与本次计算值的较小者。
    if (!this._isInitialRender && !this._growAfterOpen) {
      boundingBoxRect.height = Math.min(boundingBoxRect.height, this._lastBoundingBoxSize.height);
      boundingBoxRect.width = Math.min(boundingBoxRect.width, this._lastBoundingBoxSize.width);
    }

    const styles: Partial<CSSStyleDeclaration> = {};
    if (this._hasExactPosition()) {
      styles.top = styles.left = '0';
      styles.bottom = styles.right = 'auto';
      styles.maxHeight = styles.maxWidth = '';
      styles.width = styles.height = '100%';
    } else {
      const maxHeight = this._overlayRef!.getConfig().maxHeight;
      const maxWidth = this._overlayRef!.getConfig().maxWidth;

      styles.width = coerceCssPixelValue(boundingBoxRect.width);
      styles.height = coerceCssPixelValue(boundingBoxRect.height);
      styles.top = coerceCssPixelValue(boundingBoxRect.top) || 'auto';
      styles.bottom = coerceCssPixelValue(boundingBoxRect.bottom) || 'auto';
      styles.left = coerceCssPixelValue(boundingBoxRect.left) || 'auto';
      styles.right = coerceCssPixelValue(boundingBoxRect.right) || 'auto';

      styles.alignItems = position.overlayX === 'center' ? 'center' : position.overlayX === 'end' ? 'flex-end' : 'flex-start';
      styles.justifyContent = position.overlayY === 'center' ? 'center' : position.overlayY === 'bottom' ? 'flex-end' : 'flex-start';

      if (maxHeight) {
        styles.maxHeight = coerceCssPixelValue(maxHeight);
      }
      if (maxWidth) {
        styles.maxWidth = coerceCssPixelValue(maxWidth);
      }
    }

    this._lastBoundingBoxSize = boundingBoxRect;
    extendStyles(this._boundingBox!.style, styles as CSSStyleDeclaration);
  }

  /** 重置 bounding box 样式，准备新一轮计算。 */
  private _resetBoundingBoxStyles(): void {
    extendStyles(this._boundingBox!.style, {
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      height: '',
      width: '',
      alignItems: '',
      justifyContent: '',
    } as CSSStyleDeclaration);
  }

  /** 重置面板定位样式，准备新一轮计算。 */
  private _resetOverlayElementStyles(): void {
    extendStyles(this._pane.style, {
      top: '',
      left: '',
      bottom: '',
      right: '',
      position: '',
      transform: '',
    } as CSSStyleDeclaration);
  }

  /** 将精确定位样式应用到面板。 */
  private _setOverlayElementStyles(originPoint: Point, position: ConnectedPosition): void {
    const styles: Partial<CSSStyleDeclaration> = {};
    const hasExactPosition = this._hasExactPosition();
    const hasFlexibleDimensions = this._hasFlexibleDimensions;
    const config = this._overlayRef!.getConfig();

    if (hasExactPosition) {
      const scrollPosition = this._viewportRuler.getViewportScrollPosition();
      extendStyles(styles as CSSStyleDeclaration, this._getExactOverlayY(position, originPoint, scrollPosition));
      extendStyles(styles as CSSStyleDeclaration, this._getExactOverlayX(position, originPoint, scrollPosition));
    } else {
      styles.position = 'static';
    }

    // 偏移使用 transform 而非 margin/top-left：center 定位依赖 flex 流，
    // 设置任何 top/left 都会破坏布局；transform 对三种定位均有效。
    let transformString = '';
    const offsetX = this._getOffset(position, 'x');
    const offsetY = this._getOffset(position, 'y');
    if (offsetX) {
      transformString += `translateX(${offsetX}px) `;
    }
    if (offsetY) {
      transformString += `translateY(${offsetY}px)`;
    }
    styles.transform = transformString.trim();

    // flexible 尺寸下 max-width/height 需要是 100%，因此约束转移到 bounding box 上；
    // 精确定位时保留原值。
    if (config.maxHeight) {
      styles.maxHeight = hasExactPosition || !hasFlexibleDimensions
        ? coerceCssPixelValue(config.maxHeight)
        : '';
    }
    if (config.maxWidth) {
      styles.maxWidth = hasExactPosition || !hasFlexibleDimensions
        ? coerceCssPixelValue(config.maxWidth)
        : '';
    }

    extendStyles(this._pane.style, styles as CSSStyleDeclaration);
  }

  /** 非 flexible 或 push 状态下，计算精确的 top/bottom 值。 */
  private _getExactOverlayY(
    position: ConnectedPosition,
    originPoint: Point,
    scrollPosition: {top: number; left: number},
  ): CSSStyleDeclaration {
    const styles = {top: '', bottom: ''} as CSSStyleDeclaration;
    let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);

    if (this._isPushed) {
      overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
    }

    if (position.overlayY === 'bottom') {
      const documentHeight = this._document.documentElement!.clientHeight;
      styles.bottom = `${documentHeight - (overlayPoint.y + this._overlayRect.height)}px`;
    } else {
      styles.top = coerceCssPixelValue(overlayPoint.y);
    }
    return styles;
  }

  /** 非 flexible 或 push 状态下，计算精确的 left/right 值。 */
  private _getExactOverlayX(
    position: ConnectedPosition,
    originPoint: Point,
    scrollPosition: {top: number; left: number},
  ): CSSStyleDeclaration {
    const styles = {left: '', right: ''} as CSSStyleDeclaration;
    let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);

    if (this._isPushed) {
      overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
    }

    let horizontalStyleProperty: 'left' | 'right';
    if (this._isRtl()) {
      horizontalStyleProperty = position.overlayX === 'end' ? 'left' : 'right';
    } else {
      horizontalStyleProperty = position.overlayX === 'end' ? 'right' : 'left';
    }

    if (horizontalStyleProperty === 'right') {
      const documentWidth = this._document.documentElement!.clientWidth;
      styles.right = `${documentWidth - (overlayPoint.x + this._overlayRect.width)}px`;
    } else {
      styles.left = coerceCssPixelValue(overlayPoint.x);
    }
    return styles;
  }

  /** 计算 origin 与 overlay 相对滚动容器的可见性，供 positionChange 载荷使用。 */
  private _getScrollVisibility(): ScrollingVisibility {
    const originBounds = this._getOriginRect();
    const overlayBounds = this._pane.getBoundingClientRect();
    const scrollContainerBounds = this._scrollables.map(el => el.getBoundingClientRect());
    return {
      isOriginClipped: isElementClippedByScrolling(originBounds, scrollContainerBounds),
      isOriginOutsideView: isElementScrolledOutsideView(originBounds, scrollContainerBounds),
      isOverlayClipped: isElementClippedByScrolling(overlayBounds, scrollContainerBounds),
      isOverlayOutsideView: isElementScrolledOutsideView(overlayBounds, scrollContainerBounds),
    };
  }

  /** 逐项扣除溢出量。 */
  private _subtractOverflows(length: number, ...overflows: number[]): number {
    return overflows.reduce((currentValue, currentOverflow) => {
      return currentValue - Math.max(currentOverflow, 0);
    }, length);
  }

  /** 基于 viewportMargin 收窄视口矩形。 */
  private _getNarrowedViewportRect(): Dimensions {
    const width = this._document.documentElement!.clientWidth;
    const height = this._document.documentElement!.clientHeight;
    const scrollPosition = this._viewportRuler.getViewportScrollPosition();
    return {
      top: scrollPosition.top + this._getViewportMarginTop(),
      left: scrollPosition.left + this._getViewportMarginStart(),
      right: scrollPosition.left + width - this._getViewportMarginEnd(),
      bottom: scrollPosition.top + height - this._getViewportMarginBottom(),
      width: width - this._getViewportMarginStart() - this._getViewportMarginEnd(),
      height: height - this._getViewportMarginTop() - this._getViewportMarginBottom(),
    };
  }

  /** 当前是否处于 RTL 上下文。 */
  private _isRtl(): boolean {
    return this._overlayRef!.getDirection() === 'rtl';
  }

  /** 是否使用精确定位（非 flexible 或正在 push）。 */
  private _hasExactPosition(): boolean {
    return !this._hasFlexibleDimensions || this._isPushed;
  }

  /** 读取位置偏移：候选位置未指定时回退到默认偏移。 */
  private _getOffset(position: ConnectedPosition, axis: 'x' | 'y'): number {
    if (axis === 'x') {
      return position.offsetX == null ? this._offsetX : position.offsetX;
    }
    return position.offsetY == null ? this._offsetY : position.offsetY;
  }

  /** 校验候选位置的连接点取值。 */
  private _validatePositions(): void {
    if (!this._preferredPositions.length) {
      throw Error('FlexibleConnectedPositionStrategy: 至少需要一个候选位置。');
    }
    this._preferredPositions.forEach(pair => {
      validateHorizontalPosition('originX', pair.originX);
      validateVerticalPosition('originY', pair.originY);
      validateHorizontalPosition('overlayX', pair.overlayX);
      validateVerticalPosition('overlayY', pair.overlayY);
    });
  }

  /** 为面板追加位置类并记录，便于清除。 */
  private _addPanelClasses(cssClasses: string | string[]): void {
    if (this._pane) {
      coerceArray(cssClasses).forEach(cssClass => {
        if (cssClass !== '' && this._appliedPanelClasses.indexOf(cssClass) === -1) {
          this._appliedPanelClasses.push(cssClass);
          this._pane.classList.add(cssClass);
        }
      });
    }
  }

  /** 清除策略此前追加的面板类。 */
  private _clearPanelClasses(): void {
    if (this._pane) {
      this._appliedPanelClasses.forEach(cssClass => this._pane.classList.remove(cssClass));
      this._appliedPanelClasses = [];
    }
  }

  private _getViewportMarginStart(): number {
    if (typeof this._viewportMargin === 'number') {
      return this._viewportMargin;
    }
    return this._viewportMargin?.start ?? 0;
  }

  private _getViewportMarginEnd(): number {
    if (typeof this._viewportMargin === 'number') {
      return this._viewportMargin;
    }
    return this._viewportMargin?.end ?? 0;
  }

  private _getViewportMarginTop(): number {
    if (typeof this._viewportMargin === 'number') {
      return this._viewportMargin;
    }
    return this._viewportMargin?.top ?? 0;
  }

  private _getViewportMarginBottom(): number {
    if (typeof this._viewportMargin === 'number') {
      return this._viewportMargin;
    }
    return this._viewportMargin?.bottom ?? 0;
  }

  /** 获取 origin 的几何矩形：元素取 getBoundingClientRect，点按 0 尺寸处理。 */
  private _getOriginRect(): Dimensions {
    const origin = unwrapOrigin(this._origin);
    if (origin instanceof HTMLElement) {
      return origin.getBoundingClientRect();
    }
    const width = origin.width || 0;
    const height = origin.height || 0;
    return {
      top: origin.y,
      bottom: origin.y + height,
      left: origin.x,
      right: origin.x + width,
      height,
      width,
    };
  }

  /** 获取 overlay 容器的几何矩形。 */
  private _getContainerRect(): Dimensions {
    const isInlinePopover =
      this._overlayRef!.getConfig().usePopover && this._popoverLocation !== 'global';
    const element = this._overlayContainer.getContainerElement();
    if (isInlinePopover) {
      element.style.display = 'block';
    }
    const dimensions = element.getBoundingClientRect();
    if (isInlinePopover) {
      element.style.display = '';
    }
    return dimensions;
  }
}

/** 解包 Vue ref 形式的 origin。 */
function unwrapOrigin(origin: FlexibleConnectedPositionStrategyOrigin): HTMLElement | (Point & {width?: number; height?: number}) {
  if (isVueRef(origin)) {
    return origin.value ?? {x: 0, y: 0};
  }
  return origin;
}

/** 运行时判断是否为 Vue ref（避免与 Element 等对象混淆）。 */
function isVueRef(value: unknown): value is Ref<HTMLElement | null | undefined> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    '__v_isRef' in value
  );
}

/** 浅拷贝扩展样式对象。 */
function extendStyles(
  destination: CSSStyleDeclaration,
  source: CSSStyleDeclaration,
): CSSStyleDeclaration {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      (destination as unknown as Record<string, unknown>)[key] = (
        source as unknown as Record<string, unknown>
      )[key];
    }
  }
  return destination;
}

/** 将数字或像素字符串解析为像素值；无法解析时返回 null。 */
function getPixelValue(input: number | string | null | undefined): number | null {
  if (typeof input !== 'number' && input != null) {
    const [value, units] = input.split(cssUnitPattern);
    return !units || units === 'px' ? parseFloat(value) : null;
  }
  return input || null;
}

/** 将 DOMRect 各值向下取整，消除浏览器缩放时的亚像素偏差。 */
function getRoundedBoundingClientRect(clientRect: Dimensions): Dimensions {
  return {
    top: Math.floor(clientRect.top),
    right: Math.floor(clientRect.right),
    bottom: Math.floor(clientRect.bottom),
    left: Math.floor(clientRect.left),
    width: Math.floor(clientRect.width),
    height: Math.floor(clientRect.height),
  };
}

/** 比较两次滚动可见性是否相同，避免无意义的事件派发。 */
function compareScrollVisibility(a: ScrollingVisibility, b: ScrollingVisibility): boolean {
  if (a === b) {
    return true;
  }
  return (
    a.isOriginClipped === b.isOriginClipped &&
    a.isOriginOutsideView === b.isOriginOutsideView &&
    a.isOverlayClipped === b.isOverlayClipped &&
    a.isOverlayOutsideView === b.isOverlayOutsideView
  );
}

/** 单个位置候选在视口内的适配测量。 */
interface OverlayFit {
  isCompletelyWithinViewport: boolean;
  fitsInViewportVertically: boolean;
  fitsInViewportHorizontally: boolean;
  visibleArea: number;
}

/** 兜底位置记录。 */
interface FallbackPosition {
  position: ConnectedPosition;
  originPoint: Point;
  overlayPoint: Point;
  overlayFit: OverlayFit;
  overlayRect: Dimensions;
}

/** bounding box 的位置与尺寸。 */
interface BoundingBoxRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  height: number;
  width: number;
}

/** flexible 适配候选记录。 */
interface FlexibleFit {
  position: ConnectedPosition;
  origin: Point;
  overlayRect: Dimensions;
  boundingBoxRect: BoundingBoxRect;
}

/** 下拉菜单标准候选位置（优先向下，放不下时向上）。 */
export const STANDARD_DROPDOWN_BELOW_POSITIONS: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
  {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom'},
];

/** 下拉菜单标准候选位置（水平展开在触发元素两侧）。 */
export const STANDARD_DROPDOWN_ADJACENT_POSITIONS: ConnectedPosition[] = [
  {originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top'},
  {originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom'},
  {originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top'},
  {originX: 'start', originY: 'bottom', overlayX: 'end', overlayY: 'bottom'},
];
