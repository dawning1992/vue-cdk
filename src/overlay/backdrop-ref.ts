/**
 * Backdrop 引用：封装遮罩元素的创建、淡入与淡出销毁。
 *
 * 淡出依赖 `transitionend` 事件；为兼容 transition 缺失或事件丢失的场景，
 * 额外提供 500ms 兜底定时器，保证遮罩最终一定会被移除。
 */
export class BackdropRef {
  readonly element: HTMLElement;
  private _cleanupClick: (() => void) | undefined;
  private _cleanupTransitionEnd: (() => void) | undefined;
  private _fallbackTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(documentRef: Document, onClick: (event: MouseEvent) => void) {
    this.element = documentRef.createElement('div');
    this.element.classList.add('vcdk-overlay-backdrop');
    this.element.addEventListener('click', onClick);
    this._cleanupClick = () => this.element.removeEventListener('click', onClick);
  }

  /** 开始淡出：禁用点击、移除 showing 类，等待 transitionend 或兜底定时器。 */
  detach(): void {
    const element = this.element;
    clearTimeout(this._fallbackTimeout);
    this._cleanupTransitionEnd?.();
    this._cleanupTransitionEnd = () => element.removeEventListener('transitionend', this.dispose);
    element.addEventListener('transitionend', this.dispose);
    this._fallbackTimeout = setTimeout(this.dispose, 500);

    // 无 transition 时 transitionend 不会触发，先禁用点击并延时移除。
    element.style.pointerEvents = 'none';
    element.classList.remove('vcdk-overlay-backdrop-showing');
  }

  /** 立即销毁遮罩元素并清理所有监听。 */
  dispose = (): void => {
    clearTimeout(this._fallbackTimeout);
    this._cleanupClick?.();
    this._cleanupClick = undefined;
    this._cleanupTransitionEnd?.();
    this._cleanupTransitionEnd = undefined;
    this._fallbackTimeout = undefined;
    this.element.remove();
  };
}
