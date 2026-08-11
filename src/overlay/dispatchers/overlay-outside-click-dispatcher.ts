import {BaseOverlayDispatcher} from './base-overlay-dispatcher';
import {getEventTarget, isBrowser} from '../../platform';
import type {OverlayRef} from '../overlay-ref';

/**
 * 外部点击分发器：捕获 body 上的 pointerdown/click/auxclick/contextmenu，
 * 将“落在 overlay 面板之外”的事件按栈序派发给对应 overlay。
 *
 * pointerdown 与 click 配对使用，保证“在面板内按下、面板外释放”
 * 不会被误判为外部点击。
 *
 * pointerdown/contextmenu 的“手势记录”监听器在模块加载时即挂载，而不是
 * 等第一个 overlay attach 后才挂载。原因是：macOS 右键（双指轻点、双指
 * 点按、Control+点击）会在 contextmenu 之后补发 click/auxclick，它们与
 * “打开菜单的这次手势”共享同一次 pointerdown；若等 overlay 挂载后再开始
 * 监听，手势起点（pointerdown/contextmenu）已经错过，补发事件会被当成
 * 外部点击，立刻关闭刚打开的菜单。
 */
export class OverlayOutsideClickDispatcher extends BaseOverlayDispatcher {
  private _cleanups: (() => void)[] | undefined;
  private _pointerDownTarget: HTMLElement | null = null;
  /** 是否在最近一次 pointerdown 之后出现过 contextmenu（表示正在执行右键手势）。 */
  private _contextMenuSincePointerDown = false;

  constructor() {
    super();
    if (isBrowser()) {
      // 记录监听器与 dispatch 监听器分离：前者常驻，后者按需挂载。
      // 这里必须不依赖 document.body 已存在（同步脚本可能先于 body 执行），
      // 因此回退到 documentElement；capture 阶段两者都在页面内容处理器之前。
      const options = {capture: true};
      const listenTarget = document.body ?? document.documentElement;
      listenTarget?.addEventListener('pointerdown', this._pointerDownListener, options);
      listenTarget?.addEventListener('contextmenu', this._contextMenuListener, options);
    }
  }

  override add(overlayRef: OverlayRef): void {
    super.add(overlayRef);
    if (!this._isAttached && isBrowser()) {
      const options = {capture: true};
      document.body.addEventListener('click', this._clickListener, options);
      document.body.addEventListener('auxclick', this._clickListener, options);
      this._cleanups = [
        () => document.body.removeEventListener('click', this._clickListener, options),
        () => document.body.removeEventListener('auxclick', this._clickListener, options),
      ];
      this._isAttached = true;
    }
  }

  protected detach(): void {
    if (this._isAttached) {
      this._cleanups?.forEach(cleanup => cleanup());
      this._cleanups = undefined;
      this._isAttached = false;
    }
  }

  private _pointerDownListener = (event: PointerEvent): void => {
    this._pointerDownTarget = getEventTarget(event);
    this._contextMenuSincePointerDown = false;
  };

  private _contextMenuListener = (event: MouseEvent): void => {
    // 记录手势：同一手势补发的 click/auxclick 需要据此识别。
    // contextmenu 本身对已打开的 overlay 就是外部点击，需要正常派发；
    // 保留 pointerDownTarget，供补发事件作为 click 的 origin 使用。
    this._contextMenuSincePointerDown = true;
    this._dispatchOutsideEvent(event, getEventTarget(event));
  };

  private _clickListener = (event: MouseEvent): void => {
    const target = getEventTarget(event);

    // macOS 双指轻点等右键手势：浏览器会在 contextmenu 之后补发 click/auxclick。
    // 该补发事件与“打开菜单”共享同一次 pointerdown，若按外部点击处理，
    // 会把刚打开的上下文菜单立即关闭，因此必须跳过分发。
    if (this._contextMenuSincePointerDown && this._pointerDownTarget) {
      this._pointerDownTarget = null;
      this._contextMenuSincePointerDown = false;
      return;
    }

    // 指针设备产生的 click 前必有 pointerdown；程序化 click 直接用当前 target。
    const origin = event.type === 'click' && this._pointerDownTarget ? this._pointerDownTarget : target;
    this._pointerDownTarget = null;
    this._contextMenuSincePointerDown = false;

    this._dispatchOutsideEvent(event, origin);
  };

  /**
   * 按栈序将事件派发给命中“面板外”的 overlay。
   *
   * @param event 待派发的鼠标事件。
   * @param origin 该手势按下时的目标（click 用 pointerdown 目标，其余事件用当前目标）。
   */
  private _dispatchOutsideEvent(event: MouseEvent, origin: HTMLElement | null): void {
    const target = getEventTarget(event);
    const overlays = this._attachedOverlays.slice();
    for (let i = overlays.length - 1; i > -1; i--) {
      const overlayRef = overlays[i];
      const stream = overlayRef._outsidePointerEvents;
      if (!overlayRef.hasAttached() || !this.canReceiveEvent(overlayRef, event, stream)) {
        continue;
      }

      // 点击命中面板内部时停止派发；否则视为外部点击，继续检查更下层的 overlay。
      if (
        containsPierceShadowDom(overlayRef.overlayElement, target) ||
        containsPierceShadowDom(overlayRef.overlayElement, origin)
      ) {
        break;
      }
      stream.next(event);
    }
  }
}

/** 穿透 Shadow DOM 边界判断 parent 是否包含 child。 */
function containsPierceShadowDom(parent: HTMLElement, child: HTMLElement | null): boolean {
  const supportsShadowRoot = typeof ShadowRoot !== 'undefined' && Boolean(ShadowRoot);
  let current: Node | null = child;
  while (current) {
    if (current === parent) {
      return true;
    }
    current =
      supportsShadowRoot && current instanceof ShadowRoot
        ? current.host
        : current.parentNode;
  }
  return false;
}

/** 默认外部点击分发器单例。 */
export const overlayOutsideClickDispatcher = new OverlayOutsideClickDispatcher();
