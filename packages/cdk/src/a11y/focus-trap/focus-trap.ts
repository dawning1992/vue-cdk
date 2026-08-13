/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：NgZone/afterNextRender → Vue nextTick；DOCUMENT 注入 → 构造参数；
 * DOM 类名/标记使用 vcdk-* 前缀。
 */

/**
 * 在 DOM 元素内捕获焦点，对应 Angular CDK 的 FocusTrap。
 *
 * 实现方式：在目标元素前后插入两个视觉隐藏的锚点，Tab 聚焦到锚点时
 * 自动跳回陷阱区域的另一侧。注意该方案假设 Tab 顺序与 DOM 顺序一致，
 * `tabindex > 0`、flex `order`、Shadow DOM 等情况会导致两者不一致。
 */

import {nextTick} from 'vue';
import {InteractivityChecker} from './interactivity-checker';
import {injectFocusTrapStyles} from './style-inject';

/** 区域边界标记的查询选择器（kebab-case 为 Vue 模板惯例，camelCase 兼容编程式 DOM）。 */
const REGION_START_SELECTOR = '[vcdk-focus-region-start], [vcdkFocusRegionStart]';
const REGION_END_SELECTOR = '[vcdk-focus-region-end], [vcdkFocusRegionEnd]';
const INITIAL_SELECTOR = '[vcdk-focus-initial], [vcdkFocusInitial]';

/**
 * 在 DOM 元素内捕获焦点：锚点 Tab 到区域外时，焦点被拉回区域内。
 */
export class FocusTrap {
  private _startAnchor: HTMLElement | null = null;
  private _endAnchor: HTMLElement | null = null;
  private _hasAttached = false;

  // 锚点监听器保持为普通函数引用，便于销毁时解绑。
  protected startAnchorListener = () => this.focusLastTabbableElement();
  protected endAnchorListener = () => this.focusFirstTabbableElement();

  /** 陷阱是否激活；关闭时锚点不再进入 Tab 顺序。 */
  get enabled(): boolean {
    return this._enabled;
  }
  set enabled(value: boolean) {
    this._enabled = value;

    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(value, this._startAnchor);
      this._toggleAnchorTabIndex(value, this._endAnchor);
    }
  }
  protected _enabled = true;

  constructor(
    readonly _element: HTMLElement,
    private _checker: InteractivityChecker,
    readonly _document: Document,
    deferAnchors = false,
  ) {
    // 结构样式随陷阱创建注入（幂等）：不放在模块入口顶层调用，
    // 避免 barrel 入口被 tree-shaking 误判为无副作用而丢失样式。
    injectFocusTrapStyles();
    if (!deferAnchors) {
      this.attachAnchors();
    }
  }

  /** 销毁陷阱：移除锚点与监听器。 */
  destroy(): void {
    const startAnchor = this._startAnchor;
    const endAnchor = this._endAnchor;

    if (startAnchor) {
      startAnchor.removeEventListener('focus', this.startAnchorListener);
      startAnchor.remove();
    }

    if (endAnchor) {
      endAnchor.removeEventListener('focus', this.endAnchorListener);
      endAnchor.remove();
    }

    this._startAnchor = this._endAnchor = null;
    this._hasAttached = false;
  }

  /**
   * 在目标元素前后插入锚点；目标不在 DOM 中时不会插入，可稍后重试。
   * 返回是否成功挂载。
   */
  attachAnchors(): boolean {
    if (this._hasAttached) {
      return true;
    }

    if (!this._startAnchor) {
      this._startAnchor = this._createAnchor();
      this._startAnchor.addEventListener('focus', this.startAnchorListener);
    }

    if (!this._endAnchor) {
      this._endAnchor = this._createAnchor();
      this._endAnchor.addEventListener('focus', this.endAnchorListener);
    }

    if (this._element.parentNode) {
      this._element.parentNode.insertBefore(this._startAnchor, this._element);
      this._element.parentNode.insertBefore(this._endAnchor, this._element.nextSibling);
      this._hasAttached = true;
    }

    return this._hasAttached;
  }

  /** 等待 DOM 稳定后聚焦初始元素，返回是否聚焦成功。 */
  focusInitialElementWhenReady(options?: FocusOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      void nextTick(() => resolve(this.focusInitialElement(options)));
    });
  }

  /** 等待 DOM 稳定后聚焦区域内第一个可 Tab 元素。 */
  focusFirstTabbableElementWhenReady(options?: FocusOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      void nextTick(() => resolve(this.focusFirstTabbableElement(options)));
    });
  }

  /** 等待 DOM 稳定后聚焦区域内最后一个可 Tab 元素。 */
  focusLastTabbableElementWhenReady(options?: FocusOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      void nextTick(() => resolve(this.focusLastTabbableElement(options)));
    });
  }

  /** 获取指定方向的区域边界元素（标记优先，其次首/末可 Tab 元素）。 */
  private _getRegionBoundary(bound: 'start' | 'end'): HTMLElement | null {
    const markers = this._element.querySelectorAll(
      bound === 'start' ? REGION_START_SELECTOR : REGION_END_SELECTOR,
    ) as NodeListOf<HTMLElement>;

    if (bound === 'start') {
      return markers.length ? markers[0] : this._getFirstTabbableElement(this._element);
    }
    return markers.length ? markers[markers.length - 1] : this._getLastTabbableElement(this._element);
  }

  /** 聚焦陷阱初始化时应聚焦的元素（vcdk-focus-initial 标记或第一个可 Tab 元素）。 */
  focusInitialElement(options?: FocusOptions): boolean {
    const redirectToElement = this._element.querySelector(INITIAL_SELECTOR) as HTMLElement | null;

    if (redirectToElement) {
      // 开发模式下提示指向了不可聚焦的元素，帮助尽早发现问题。
      if (import.meta.env.DEV && !this._checker.isFocusable(redirectToElement)) {
        console.warn(`Element matching '[vcdk-focus-initial]' is not focusable.`, redirectToElement);
      }

      if (!this._checker.isFocusable(redirectToElement)) {
        const focusableChild = this._getFirstTabbableElement(redirectToElement) as HTMLElement | null;
        focusableChild?.focus(options);
        return !!focusableChild;
      }

      redirectToElement.focus(options);
      return true;
    }

    return this.focusFirstTabbableElement(options);
  }

  /** 聚焦区域内第一个可 Tab 元素，返回是否成功。 */
  focusFirstTabbableElement(options?: FocusOptions): boolean {
    const redirectToElement = this._getRegionBoundary('start');

    if (redirectToElement) {
      redirectToElement.focus(options);
    }

    return !!redirectToElement;
  }

  /** 聚焦区域内最后一个可 Tab 元素，返回是否成功。 */
  focusLastTabbableElement(options?: FocusOptions): boolean {
    const redirectToElement = this._getRegionBoundary('end');

    if (redirectToElement) {
      redirectToElement.focus(options);
    }

    return !!redirectToElement;
  }

  /** 陷阱是否已成功挂载锚点。 */
  hasAttached(): boolean {
    return this._hasAttached;
  }

  /** 递归查找子树内第一个可 Tab 元素（含根自身）。 */
  private _getFirstTabbableElement(root: HTMLElement): HTMLElement | null {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }

    const children = root.children;
    for (let i = 0; i < children.length; i++) {
      const tabbableChild =
        children[i].nodeType === this._document.ELEMENT_NODE
          ? this._getFirstTabbableElement(children[i] as HTMLElement)
          : null;

      if (tabbableChild) {
        return tabbableChild;
      }
    }

    return null;
  }

  /** 递归查找子树内最后一个可 Tab 元素（含根自身）。 */
  private _getLastTabbableElement(root: HTMLElement): HTMLElement | null {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }

    // 按 DOM 逆序迭代。
    const children = root.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const tabbableChild =
        children[i].nodeType === this._document.ELEMENT_NODE
          ? this._getLastTabbableElement(children[i] as HTMLElement)
          : null;

      if (tabbableChild) {
        return tabbableChild;
      }
    }

    return null;
  }

  /** 创建视觉隐藏的锚点元素。 */
  private _createAnchor(): HTMLElement {
    const anchor = this._document.createElement('div');
    this._toggleAnchorTabIndex(this._enabled, anchor);
    anchor.classList.add('vcdk-visually-hidden');
    anchor.classList.add('vcdk-focus-trap-anchor');
    anchor.setAttribute('aria-hidden', 'true');
    return anchor;
  }

  /**
   * 切换锚点 tabindex：启用时设为 0，禁用时直接移除属性。
   * 不用 -1 是因为带 tabindex 的元素仍可能被方向键命中。
   */
  private _toggleAnchorTabIndex(isEnabled: boolean, anchor: HTMLElement): void {
    isEnabled ? anchor.setAttribute('tabindex', '0') : anchor.removeAttribute('tabindex');
  }

  /** 切换两个锚点的 Tab 拦截状态（供可配置陷阱的启用/停用流程调用）。 */
  protected toggleAnchors(enabled: boolean): void {
    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(enabled, this._startAnchor);
      this._toggleAnchorTabIndex(enabled, this._endAnchor);
    }
  }
}

/** 便于创建焦点陷阱的工厂，对应 Angular CDK 的 FocusTrapFactory。 */
export class FocusTrapFactory {
  private _checker = new InteractivityChecker();

  /**
   * 在指定元素周围创建焦点陷阱。
   * @param element 被陷阱包裹的元素。
   * @param deferCaptureElements 是否延迟锚点创建（元素可能尚未挂载到 DOM）。
   */
  create(element: HTMLElement, deferCaptureElements = false): FocusTrap {
    return new FocusTrap(element, this._checker, document, deferCaptureElements);
  }
}

/** 全局单例工厂，与仓库其他单例（overlayContainer 等）风格一致。 */
export const focusTrapFactory = new FocusTrapFactory();
