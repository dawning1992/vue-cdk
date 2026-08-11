import {isBrowser} from '../platform';

/** 滚动事件来源：窗口或具体元素。 */
export interface ScrollEventSource {
  element: Window | HTMLElement;
}

/**
 * 全局滚动分发器：在 document 上以捕获阶段监听滚动事件。
 *
 * 说明：元素滚动事件不冒泡，但捕获阶段可以在 document 上捕获到任意后代元素的滚动，
 * 因此只需一个全局监听即可覆盖窗口滚动与所有容器滚动，与 Angular 的
 * ScrollDispatcher 行为等价，且避免了逐容器注册的性能开销。
 */
export class ScrollDispatcher {
  private _subscriptions = new Set<{handler: (source: ScrollEventSource) => void}>();
  private _attached = false;

  /**
   * 订阅滚动事件。
   * @param throttleMs 节流间隔（毫秒），0 表示不节流。
   * @param handler 滚动回调，携带滚动来源（窗口或元素）。
   */
  scrolled(throttleMs: number, handler: (source: ScrollEventSource) => void): () => void {
    if (!isBrowser()) {
      return () => undefined;
    }

    const entry: {handler: (source: ScrollEventSource) => void} = {handler};
    this._subscriptions.add(entry);
    this._attach();

    let lastInvoke = 0;
    let pending = false;

    const wrappedHandler = (source: ScrollEventSource) => {
      if (!throttleMs || throttleMs <= 0) {
        handler(source);
        return;
      }
      const now = Date.now();
      if (now - lastInvoke >= throttleMs) {
        lastInvoke = now;
        handler(source);
        pending = false;
      } else if (!pending) {
        pending = true;
        const delay = throttleMs - (now - lastInvoke);
        setTimeout(() => {
          pending = false;
          lastInvoke = Date.now();
          handler(source);
        }, delay);
      }
    };

    // 用新对象包裹带节流逻辑的处理器，同时保留原始 handler 供退订判断。
    this._subscriptions.delete(entry);
    const throttled = {handler: wrappedHandler};
    this._subscriptions.add(throttled);

    return () => {
      this._subscriptions.delete(throttled);
      if (this._subscriptions.size === 0) {
        this._detach();
      }
    };
  }

  private _onScroll = (event: Event): void => {
    const target = event.target;
    const source: ScrollEventSource = {
      element: target === document ? window : (target as HTMLElement),
    };
    for (const {handler} of [...this._subscriptions]) {
      handler(source);
    }
  };

  private _attach(): void {
    if (!this._attached) {
      document.addEventListener('scroll', this._onScroll, true);
      window.addEventListener('scroll', this._onScroll, true);
      this._attached = true;
    }
  }

  private _detach(): void {
    if (this._attached) {
      document.removeEventListener('scroll', this._onScroll, true);
      window.removeEventListener('scroll', this._onScroll, true);
      this._attached = false;
    }
  }
}

/** 默认滚动分发器实例。 */
export const scrollDispatcher = new ScrollDispatcher();
