/**
 * 视口几何信息工具，对齐 Angular CDK 的 ViewportRuler。
 *
 * 与 Angular 的差异：事件流使用自研 Emitter；尺寸缓存失效直接在本类
 * 的原始监听回调中完成，不依赖内部订阅。
 */

import {Emitter} from '../emitter';
import {isBrowser} from '../platform';
import {addListener} from './listen';

/** 默认视口变化节流间隔（毫秒），与 Angular 的 DEFAULT_RESIZE_TIME 一致。 */
export const DEFAULT_RESIZE_TIME = 20;

/** 当前视口滚动位置。 */
export interface ViewportScrollPosition {
  top: number;
  left: number;
}

/**
 * 视口几何信息工具：滚动位置、视口尺寸与 resize/orientationchange 事件流。
 * 库内以模块级单例形式使用，测试中可替换为自定义实例。
 */
export class ViewportRuler {
  private readonly _change = new Emitter<Event>();
  private _listeners: (() => void)[] | undefined;

  /** 缓存视口尺寸；变化事件触发后置空，下次读取时重新测量。 */
  private _viewportSize: {width: number; height: number} | null = null;
  private _disposed = false;

  constructor() {
    // 监听在构造时挂载（与 Angular 一致）；SSR 环境下跳过。
    if (isBrowser()) {
      const changeListener = (event: Event) => {
        // 尺寸缓存失效，下一次读取时重新测量。
        this._viewportSize = null;
        this._change.next(event);
      };
      this._listeners = [
        addListener(window, 'resize', changeListener),
        addListener(window, 'orientationchange', changeListener),
      ];
    }
  }

  /** 返回视口尺寸（innerWidth/innerHeight），结果缓存到下次视口变化。 */
  getViewportSize(): Readonly<{width: number; height: number}> {
    if (!this._viewportSize) {
      this._updateViewportSize();
    }

    const output = {width: this._viewportSize!.width, height: this._viewportSize!.height};

    // 非浏览器环境不缓存，避免把 SSR 阶段的模拟值留在内存中。
    if (!isBrowser()) {
      this._viewportSize = null;
    }

    return output;
  }

  /** 返回视口边界矩形（含滚动偏移的文档坐标）。 */
  getViewportRect(): {
    top: number;
    left: number;
    bottom: number;
    right: number;
    height: number;
    width: number;
  } {
    const scrollPosition = this.getViewportScrollPosition();
    const {width, height} = this.getViewportSize();

    return {
      top: scrollPosition.top,
      left: scrollPosition.left,
      bottom: scrollPosition.top + height,
      right: scrollPosition.left + width,
      height,
      width,
    };
  }

  /** 返回当前窗口滚动位置（pageYOffset 优先，退化到 documentElement）。 */
  getViewportScrollPosition(): ViewportScrollPosition {
    if (!isBrowser()) {
      return {top: 0, left: 0};
    }

    return {
      top: window.pageYOffset ?? document.documentElement.scrollTop,
      left: window.pageXOffset ?? document.documentElement.scrollLeft,
    };
  }

  /**
   * 订阅视口尺寸变化（resize / orientationchange）。
   * @param throttleTime 节流间隔（毫秒），0 表示不节流，默认 DEFAULT_RESIZE_TIME。
   */
  change(throttleTime: number = DEFAULT_RESIZE_TIME): Emitter<Event> {
    if (this._disposed) {
      return new Emitter();
    }
    if (throttleTime <= 0) {
      return this._change;
    }

    const output = new Emitter<Event>();
    const originalSubscribe = output.subscribe.bind(output);
    let subscribers = 0;
    let forward: (() => void) | undefined;

    output.subscribe = listener => {
      if (subscribers === 0) {
        forward = throttleForward(this._change, throttleTime, output);
      }
      subscribers++;
      const unsubscribe = originalSubscribe(listener);
      return () => {
        unsubscribe();
        subscribers--;
        if (subscribers === 0) {
          forward?.();
          forward = undefined;
        }
      };
    };

    return output;
  }

  /** 销毁实例：移除全局监听并结束事件流。 */
  dispose(): void {
    this._listeners?.forEach(cleanup => cleanup());
    this._listeners = undefined;
    this._change.complete();
    this._disposed = true;
    this._viewportSize = null;
  }

  private _updateViewportSize(): void {
    this._viewportSize = isBrowser()
      ? {width: window.innerWidth, height: window.innerHeight}
      : {width: 0, height: 0};
  }
}

/**
 * 节流转发：窗口内首个事件立即派发，窗口结束时补发最后一次事件。
 * 语义与 ScrollDispatcher 的节流一致，避免 resize 高频触发测量。
 */
function throttleForward<T>(source: Emitter<T>, ms: number, target: Emitter<T>): () => void {
  let lastInvoke = 0;
  let pending = false;
  let pendingValue: T | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribe = source.subscribe(value => {
    const now = Date.now();
    if (now - lastInvoke >= ms) {
      lastInvoke = now;
      target.next(value);
    } else if (!pending) {
      pending = true;
      pendingValue = value;
      timer = setTimeout(() => {
        pending = false;
        lastInvoke = Date.now();
        target.next(pendingValue as T);
      }, ms - (now - lastInvoke));
    } else {
      pendingValue = value;
    }
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}

/** 默认视口工具实例。 */
export const viewportRuler = new ViewportRuler();
