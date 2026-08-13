import {Fragment, createVNode, nextTick, type AppContext, type VNode} from 'vue';
import {DomPortalOutlet} from '../portal/dom-portal-outlet';
import {Portal, TemplatePortal} from '../portal/portal';
import {Emitter} from '../emitter';
import type {PositionStrategy} from './position/position-strategy';
import type {ScrollStrategy} from './scroll/scroll-strategy';
import type {OverlayConfig} from './overlay-config';
import {BackdropRef} from './backdrop-ref';
import type {OverlayKeyboardDispatcher} from './dispatchers/overlay-keyboard-dispatcher';
import type {OverlayOutsideClickDispatcher} from './dispatchers/overlay-outside-click-dispatcher';
import type {OverlayContainer} from './overlay-container';
import {coerceArray, coerceCssPixelValue} from '../coercion';
import {supportsPopover, isBrowser} from '../platform';

/**
 * 可挂载到 overlay 的内容：VNode、渲染函数或 Portal。
 *
 * Portal 路径与 Angular 一致（`overlayRef.attach(new TemplatePortal(...))`），
 * 返回挂载引用；VNode/渲染函数路径为 Vue 便捷写法，返回归一化后的 VNode。
 */
export type OverlayContent = VNode | (() => VNode | VNode[] | null) | Portal<any>;

/** OverlayRef 的依赖集合。 */
export interface OverlayRefDeps {
  document: Document;
  keyboardDispatcher: OverlayKeyboardDispatcher;
  outsideClickDispatcher: OverlayOutsideClickDispatcher;
  container: OverlayContainer;
  animationsDisabled?: boolean;
  /** 来自调用方组件实例的应用上下文，用于命令式渲染时保留 provide/inject 能力。 */
  appContext?: AppContext | null;
}

/** overlay 面板尺寸配置。 */
export interface OverlaySizeConfig {
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
}

/**
 * Overlay 引用：一个已创建浮层的操作句柄。
 *
 * 生命周期约定：
 * - `attach` 后 `hasAttached()` 为 true，重复 attach 会抛出错误；
 * - `detach` 卸载内容但保留引用，可再次 attach；
 * - `dispose` 彻底销毁，之后所有操作失效；
 * - 事件流（attachments/detachments/backdropClick/keydownEvents/outsidePointerEvents）
 *   在 dispose 时 complete，订阅方不应在之后继续使用。
 */
export class OverlayRef {
  private readonly _backdropClick = new Emitter<MouseEvent>();
  private readonly _attachments = new Emitter<void>();
  private readonly _detachments = new Emitter<void>();
  readonly _keydownEvents = new Emitter<KeyboardEvent>();
  readonly _outsidePointerEvents = new Emitter<MouseEvent>();

  private _positionStrategy: PositionStrategy | undefined;
  private _scrollStrategy: ScrollStrategy | undefined;
  private _backdropRef: BackdropRef | null = null;
  private _disposed = false;
  private _hasAttached = false;
  private _previousHostParent: HTMLElement | null = null;
  private _locationCleanup: (() => void) | undefined;

  private _host: HTMLElement;
  private _pane: HTMLElement;
  /** 基于面板元素的 portal 出口：统一管理内容挂载/卸载/销毁。 */
  private _outlet: DomPortalOutlet;
  private _config: OverlayConfig;
  private _document: Document;
  private _container: OverlayContainer;
  private _keyboardDispatcher: OverlayKeyboardDispatcher;
  private _outsideClickDispatcher: OverlayOutsideClickDispatcher;
  private _animationsDisabled: boolean;

  constructor(host: HTMLElement, pane: HTMLElement, config: OverlayConfig, deps: OverlayRefDeps) {
    this._host = host;
    this._pane = pane;
    this._config = config;
    this._document = deps.document;
    this._container = deps.container;
    this._keyboardDispatcher = deps.keyboardDispatcher;
    this._outsideClickDispatcher = deps.outsideClickDispatcher;
    this._animationsDisabled = deps.animationsDisabled ?? false;
    this._outlet = new DomPortalOutlet(this._pane, {appContext: deps.appContext ?? null});

    if (config.scrollStrategy) {
      this._scrollStrategy = config.scrollStrategy;
      this._scrollStrategy.attach(this);
    }
    this._positionStrategy = config.positionStrategy;
  }

  /** overlay 的面板元素（定位与尺寸都作用于它）。 */
  get overlayElement(): HTMLElement {
    return this._pane;
  }

  /** overlay 的遮罩元素；未启用遮罩时为 null。 */
  get backdropElement(): HTMLElement | null {
    return this._backdropRef?.element ?? null;
  }

  /** overlay 的宿主包装元素（global wrapper 或 bounding box）。 */
  get hostElement(): HTMLElement {
    return this._host;
  }

  /** 事件谓词：决定 overlay 是否接收全局分发器派发的事件。 */
  get eventPredicate(): ((event: Event) => boolean) | null {
    return this._config.eventPredicate || null;
  }

  /** 挂载 VNode 或渲染函数内容，返回归一化后的 VNode。 */
  attach(content?: VNode | (() => VNode | VNode[] | null)): VNode | null;
  /** 挂载 Portal 内容，返回出口的挂载引用（组件实例 / VNode / DOM 元素）。 */
  attach(portal: Portal<any>): any;
  /**
   * 挂载内容并完成 overlay 的完整初始化。
   * @param content 可选；不传时由外部（如 Teleport）负责渲染面板内容。
   */
  attach(content?: OverlayContent): VNode | null | unknown {
    if (this._disposed) {
      return null;
    }
    if (this._hasAttached) {
      throw Error('OverlayRef: overlay 已挂载内容，请先调用 detach()。');
    }
    this._hasAttached = true;

    // 先挂 host 再渲染内容，保证重复挂载时动画模块能正常工作。
    this._attachHost();

    let attachedResult: VNode | null | unknown = null;
    if (content != null) {
      if (content instanceof Portal) {
        // Portal 路径：内容生命周期由 portal 出口统一管理。
        attachedResult = this._outlet.attach(content);
      } else {
        // 旧路径兼容：VNode 或渲染函数经模板 Portal 包装后挂载，
        // 包装组件会追踪渲染函数内的响应式依赖，父级状态变化可驱动内容更新。
        const vnode = normalizeContent(content);
        const renderFn: () => VNode | VNode[] | null =
          typeof content === 'function' ? content : () => content;
        this._outlet.attachTemplatePortal(new TemplatePortal(renderFn, undefined));
        attachedResult = vnode;
      }
    }

    this._positionStrategy?.attach(this);
    this._updateStackingOrder();
    this._updateElementSize();
    this._updateElementDirection();
    if (this._scrollStrategy) {
      this._scrollStrategy.enable();
    }

    // 内容渲染完成后才能测量尺寸，因此位置更新延后到下一轮渲染。
    nextTick(() => {
      if (this.hasAttached()) {
        this.updatePosition();
      }
    });

    this._togglePointerEvents(true);
    if (this._config.hasBackdrop) {
      this._attachBackdrop();
    }
    if (this._config.panelClass) {
      this._toggleClasses(this._pane, this._config.panelClass, true);
    }

    this._attachments.next();
    this._keyboardDispatcher.add(this);
    if (this._config.disposeOnNavigation) {
      this._subscribeNavigation();
    }
    this._outsideClickDispatcher.add(this);
    return attachedResult;
  }

  /** 卸载内容并停止滚动策略与事件分发；引用保留可再次 attach。 */
  detach(): void {
    if (!this._hasAttached) {
      return;
    }
    this.detachBackdrop();
    this._togglePointerEvents(false);
    this._positionStrategy?.detach?.();
    if (this._scrollStrategy) {
      this._scrollStrategy.disable();
    }
    if (this._outlet.hasAttached()) {
      this._outlet.detach();
    }
    this._hasAttached = false;

    this._detachments.next();
    this._keyboardDispatcher.remove(this);
    this._unsubscribeNavigation();
    this._outsideClickDispatcher.remove(this);

    // 内容卸载后把 host 移出 DOM，避免空宿主参与渲染造成滚动抖动；
    // 记录原父节点供下次 attach 恢复位置。
    if (this._host.parentElement) {
      this._previousHostParent = this._host.parentElement;
      this._host.remove();
    }
  }

  /** 彻底销毁 overlay：清理策略、事件流与 DOM。幂等。 */
  dispose(): void {
    if (this._disposed) {
      return;
    }
    const isAttached = this._hasAttached;

    this._positionStrategy?.dispose();
    this._disposeScrollStrategy();
    this._backdropRef?.dispose();
    this._unsubscribeNavigation();
    this._keyboardDispatcher.remove(this);
    if (this._outlet.hasAttached()) {
      this._outlet.detach();
    }
    this._outlet.dispose();
    this._attachments.complete();
    this._backdropClick.complete();
    this._keydownEvents.complete();
    this._outsidePointerEvents.complete();
    this._outsideClickDispatcher.remove(this);
    this._host.remove();
    this._previousHostParent = null;

    if (isAttached) {
      this._detachments.next();
    }
    this._detachments.complete();
    this._hasAttached = false;
    this._disposed = true;
  }

  /** 当前是否已挂载内容。 */
  hasAttached(): boolean {
    return this._hasAttached;
  }

  /** 遮罩点击事件流。 */
  backdropClick(): Emitter<MouseEvent> {
    return this._backdropClick;
  }

  /** 挂载完成事件流。 */
  attachments(): Emitter<void> {
    return this._attachments;
  }

  /** 卸载完成事件流。 */
  detachments(): Emitter<void> {
    return this._detachments;
  }

  /** 派发到该 overlay 的键盘事件流。 */
  keydownEvents(): Emitter<KeyboardEvent> {
    return this._keydownEvents;
  }

  /** 派发到该 overlay 的外部点击事件流。 */
  outsidePointerEvents(): Emitter<MouseEvent> {
    return this._outsidePointerEvents;
  }

  /** 当前配置（updateSize/setDirection 会替换为新对象，读取方勿长期持有引用）。 */
  getConfig(): OverlayConfig {
    return this._config;
  }

  /** 依据定位策略重新计算位置。 */
  updatePosition(): void {
    this._positionStrategy?.apply();
  }

  /** 切换定位策略；已挂载时立即重新定位。 */
  updatePositionStrategy(strategy: PositionStrategy): void {
    if (strategy === this._positionStrategy) {
      return;
    }
    this._positionStrategy?.dispose();
    this._positionStrategy = strategy;
    if (this._hasAttached) {
      strategy.attach(this);
      this.updatePosition();
    }
  }

  /** 更新面板尺寸（数字按像素处理）。 */
  updateSize(sizeConfig: OverlaySizeConfig): void {
    this._config = {...this._config, ...sizeConfig};
    this._updateElementSize();
  }

  /** 设置文本方向（ltr/rtl）。 */
  setDirection(direction: 'ltr' | 'rtl'): void {
    this._config = {...this._config, direction};
    this._updateElementDirection();
  }

  /** 为面板追加一个或多个类。 */
  addPanelClass(classes: string | string[]): void {
    if (this._pane) {
      this._toggleClasses(this._pane, classes, true);
    }
  }

  /** 从面板移除一个或多个类。 */
  removePanelClass(classes: string | string[]): void {
    if (this._pane) {
      this._toggleClasses(this._pane, classes, false);
    }
  }

  /** 当前文本方向；未配置时回退 ltr。 */
  getDirection(): 'ltr' | 'rtl' {
    return this._config.direction || 'ltr';
  }

  /** 切换滚动策略；已挂载时立即启用新策略。 */
  updateScrollStrategy(strategy: ScrollStrategy): void {
    if (strategy === this._scrollStrategy) {
      return;
    }
    this._disposeScrollStrategy();
    this._scrollStrategy = strategy;
    if (this._hasAttached) {
      strategy.attach(this);
      strategy.enable();
    }
  }

  /** 卸载遮罩：动画关闭时淡出，禁用动画时立即销毁。 */
  detachBackdrop(): void {
    if (this._animationsDisabled) {
      this._backdropRef?.dispose();
      this._backdropRef = null;
    } else {
      this._backdropRef?.detach();
    }
  }

  private _updateElementDirection(): void {
    this._host.setAttribute('dir', this.getDirection());
  }

  private _updateElementSize(): void {
    if (!this._pane) {
      return;
    }
    const style = this._pane.style;
    style.width = coerceCssPixelValue(this._config.width);
    style.height = coerceCssPixelValue(this._config.height);
    style.minWidth = coerceCssPixelValue(this._config.minWidth);
    style.minHeight = coerceCssPixelValue(this._config.minHeight);
    style.maxWidth = coerceCssPixelValue(this._config.maxWidth);
    style.maxHeight = coerceCssPixelValue(this._config.maxHeight);
  }

  private _togglePointerEvents(enablePointer: boolean): void {
    this._pane.style.pointerEvents = enablePointer ? '' : 'none';
  }

  private _attachHost(): void {
    if (this._host.parentElement) {
      return;
    }
    const customInsertionPoint = this._config.usePopover
      ? this._positionStrategy?.getPopoverInsertionPoint?.()
      : null;

    if (customInsertionPoint instanceof Element) {
      customInsertionPoint.after(this._host);
    } else if (customInsertionPoint?.type === 'parent') {
      customInsertionPoint.element.appendChild(this._host);
    } else if (this._previousHostParent) {
      this._previousHostParent.appendChild(this._host);
    } else {
      this._container.getContainerElement().appendChild(this._host);
    }

    if (this._config.usePopover && supportsPopover()) {
      // 浏览器可能在元素脱离 DOM 或父链异常时抛错，忽略以保证降级可用。
      try {
        (this._host as HTMLElement & {showPopover(): void}).showPopover();
      } catch {
        // 忽略 Popover 调用失败，回退为普通容器渲染。
      }
    }
  }

  private _attachBackdrop(): void {
    const showingClass = 'vcdk-overlay-backdrop-showing';
    this._backdropRef?.dispose();
    this._backdropRef = new BackdropRef(this._document, event => {
      this._backdropClick.next(event);
    });

    if (this._animationsDisabled) {
      this._backdropRef.element.classList.add('vcdk-overlay-backdrop-noop-animation');
    }
    if (this._config.backdropClass) {
      this._toggleClasses(this._backdropRef.element, this._config.backdropClass, true);
    }

    if (this._config.usePopover && supportsPopover()) {
      this._host.prepend(this._backdropRef.element);
    } else {
      this._host.parentElement!.insertBefore(this._backdropRef.element, this._host);
    }

    if (!this._animationsDisabled && typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        this._backdropRef?.element.classList.add(showingClass);
      });
    } else {
      this._backdropRef.element.classList.add(showingClass);
    }
  }

  /**
   * 更新堆叠顺序：将 host 移到容器末尾。
   * 防止“一个 overlay 卸载后、另一个较旧的 overlay 再打开”时 DOM 顺序与视觉顺序不一致。
   */
  private _updateStackingOrder(): void {
    if (!this._config.usePopover && this._host.nextSibling) {
      this._host.parentNode!.appendChild(this._host);
    }
  }

  private _toggleClasses(element: HTMLElement, cssClasses: string | string[], isAdd: boolean): void {
    const classes = coerceArray(cssClasses).filter(c => !!c);
    if (classes.length) {
      isAdd ? element.classList.add(...classes) : element.classList.remove(...classes);
    }
  }

  private _subscribeNavigation(): void {
    if (!isBrowser()) {
      return;
    }
    const dispose = (): void => this.dispose();
    window.addEventListener('popstate', dispose);
    window.addEventListener('hashchange', dispose);
    this._locationCleanup = () => {
      window.removeEventListener('popstate', dispose);
      window.removeEventListener('hashchange', dispose);
    };
  }

  private _unsubscribeNavigation(): void {
    this._locationCleanup?.();
    this._locationCleanup = undefined;
  }

  private _disposeScrollStrategy(): void {
    this._scrollStrategy?.disable();
    this._scrollStrategy?.detach?.();
  }
}

/** 将 overlay 内容归一化为单根 VNode。 */
function normalizeContent(content: VNode | (() => VNode | VNode[] | null)): VNode {
  const value = typeof content === 'function' ? content() : content;
  if (Array.isArray(value)) {
    return createVNode(Fragment, null, value);
  }
  return value ?? createVNode(Fragment);
}
