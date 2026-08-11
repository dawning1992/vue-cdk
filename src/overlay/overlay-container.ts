import {injectOverlayStyles} from './style-inject';
import {isBrowser} from '../platform';

/**
 * Overlay 容器：所有浮层统一挂载的固定定位元素。
 *
 * 容器在首次访问时懒创建并挂到 body 尾部；创建前会注入结构样式，
 * 因此库可在不额外引入 css 的情况下开箱即用。
 */
export class OverlayContainer {
  protected _containerElement: HTMLElement | null = null;
  protected _document: Document | null;

  constructor(documentRef?: Document | null) {
    this._document = documentRef ?? (isBrowser() ? window.document : null);
  }

  /** 获取容器元素；若不存在则懒创建。 */
  getContainerElement(): HTMLElement {
    this._loadStyles();
    if (!this._containerElement) {
      this._createContainer();
    }
    return this._containerElement!;
  }

  /** 容器绑定的 document；未提供时返回 null。 */
  get document(): Document | null {
    return this._document;
  }

  /** 容器在 body 中是否已存在。 */
  hasContainerElement(): boolean {
    return this._containerElement != null;
  }

  /** 销毁容器并移除其 DOM 元素。 */
  dispose(): void {
    this._containerElement?.remove();
    this._containerElement = null;
  }

  protected _loadStyles(): void {
    injectOverlayStyles();
  }

  protected _createContainer(): void {
    if (!this._document?.body) {
      throw new Error('OverlayContainer: 无法创建容器，document.body 不存在（SSR 环境应跳过 overlay 创建）。');
    }
    const container = this._document.createElement('div');
    container.classList.add('vcdk-overlay-container');
    this._document.body.appendChild(container);
    this._containerElement = container;
  }
}

/** 全屏模式容器：进入 fullscreen 时将容器移入全屏元素，退出后恢复 body。 */
export class FullscreenOverlayContainer extends OverlayContainer {
  private _fullscreenElement: HTMLElement | null = null;
  private _listening = false;

  override getContainerElement(): HTMLElement {
    this._ensureFullscreenListener();
    return super.getContainerElement();
  }

  override dispose(): void {
    if (this._listening) {
      document.removeEventListener('fullscreenchange', this._onFullscreenChange);
      this._listening = false;
    }
    super.dispose();
  }

  private _ensureFullscreenListener(): void {
    if (!this._listening && isBrowser()) {
      document.addEventListener('fullscreenchange', this._onFullscreenChange);
      this._listening = true;
    }
  }

  private _onFullscreenChange = (): void => {
    if (!isBrowser()) {
      return;
    }
    const fullscreenElement = document.fullscreenElement as HTMLElement | null;
    const container = this._containerElement;
    if (!container) {
      return;
    }
    if (fullscreenElement && container.parentElement !== fullscreenElement) {
      fullscreenElement.appendChild(container);
      this._fullscreenElement = fullscreenElement;
    } else if (!fullscreenElement && this._fullscreenElement) {
      document.body.appendChild(container);
      this._fullscreenElement = null;
    }
  };
}

/** 默认容器单例。 */
export const overlayContainer = new OverlayContainer();
