/**
 * Scrollable 滚动容器能力，对应 Angular CDK 的 CdkScrollable。
 * RTL 归一化逻辑移植自 Angular CDK scrolling（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 提供三种使用方式：
 * - `useScrollable(target)` 组合式：在组件 setup 中绑定任意元素/ref；
 * - `vScrollable` 指令：声明式绑定，随元素挂载/卸载自动注册与清理；
 * - 直接实例化 `new Scrollable(el)` 供虚拟滚动等内部场景复用。
 *
 * RTL 归一化逻辑（scrollTo / measureScrollOffset）与 Angular 逐行对齐：
 * start/end 按方向映射到 left/right，left/right 始终指容器左右两侧，
 * 并兼容 NORMAL / NEGATED / INVERTED 三种 RTL 滚动轴类型。
 */

import {
  onBeforeUnmount,
  onMounted,
  unref,
  type Directive,
  type Ref,
} from 'vue';
import {Emitter} from '../emitter';
import {
  getRtlScrollAxisType,
  RtlScrollAxisType,
  supportsScrollBehavior,
} from '../platform';
import {getDirection} from './directionality';
import {addListener} from './listen';
import {
  scrollDispatcher,
  type ScrollDispatcher,
  type ScrollDispatcherTarget,
} from './scroll-dispatcher';

/** 互斥类型工具：仅允许同时出现 T、U 中的一组字段。 */
export type _Without<T> = {[P in keyof T]?: never};
export type _XOR<T, U> = (_Without<T> & U) | (_Without<U> & T);
export type _Top = {top?: number};
export type _Bottom = {bottom?: number};
export type _Left = {left?: number};
export type _Right = {right?: number};
export type _Start = {start?: number};
export type _End = {end?: number};
export type _XAxis = _XOR<_XOR<_Left, _Right>, _XOR<_Start, _End>>;
export type _YAxis = _XOR<_Top, _Bottom>;

/**
 * 扩展版 ScrollToOptions：除 top/left 外，还允许相对容器 bottom/right/start/end 表达偏移。
 * 注意 top/bottom 互斥，left/right/start/end 互斥（与 Angular 一致）。
 */
export type ExtendedScrollToOptions = _XAxis & _YAxis & ScrollOptions;

/** 可解析为滚动元素的输入：元素、元素 ref 或延迟解析函数。 */
export type ScrollableTarget =
  | HTMLElement
  | Ref<HTMLElement | null | undefined>
  | (() => HTMLElement | null);

/** 解析滚动元素；元素尚不存在时抛出异常，避免后续测量静默失效。 */
function resolveElement(target: ScrollableTarget): HTMLElement {
  const element = typeof target === 'function' ? target() : unref(target);
  if (!element) {
    throw new Error('Scrollable: 目标元素尚未挂载或不存在。');
  }
  return element;
}

/**
 * 可注册到 ScrollDispatcher 的滚动容器。
 *
 * 生命周期约定：`attach()` 后开始监听并注册；`destroy()` 后停止监听、
 * 结束事件流并从分发器注销。两者均幂等。
 */
export class Scrollable implements ScrollDispatcherTarget {
  /** 滚动监听的目标（默认与元素相同；窗口模式为 document）。 */
  protected _scrollElement: EventTarget | undefined;

  private readonly _elementScrolled = new Emitter<Event>();
  private _cleanupScroll: (() => void) | undefined;
  private _attached = false;

  constructor(
    protected readonly _element: ScrollableTarget,
    protected readonly _dispatcher: ScrollDispatcher = scrollDispatcher,
  ) {}

  /** 开始监听元素滚动并注册到分发器；重复调用为空操作。 */
  attach(): void {
    if (this._attached) {
      return;
    }
    this._scrollElement ??= this.getElement();
    this._cleanupScroll = addListener(this._scrollElement, 'scroll', event =>
      this._elementScrolled.next(event),
    );
    this._dispatcher.register(this);
    this._attached = true;
  }

  /** 停止监听、结束事件流并从分发器注销；重复调用为空操作。 */
  destroy(): void {
    if (!this._attached) {
      return;
    }
    this._cleanupScroll?.();
    this._cleanupScroll = undefined;
    this._elementScrolled.complete();
    this._dispatcher.deregister(this);
    this._attached = false;
  }

  /** 元素自身滚动时派发的事件流。 */
  elementScrolled(): Emitter<Event> {
    return this._elementScrolled;
  }

  /** 返回滚动元素引用，形状与 Angular ElementRef 一致。 */
  getElementRef(): {nativeElement: HTMLElement} {
    return {nativeElement: this.getElement()};
  }

  /** 返回滚动元素本身。 */
  getElement(): HTMLElement {
    return resolveElement(this._element);
  }

  /**
   * 滚动到指定偏移。left/right 始终指容器左右两侧；start/end 在 RTL 下互换。
   * @param options 偏移与滚动行为配置。
   */
  scrollTo(options: ExtendedScrollToOptions): void {
    const el = this.getElement();
    const isRtl = getDirection(el) === 'rtl';
    // 复制入参，避免像 Angular 那样原地改写调用方对象。
    const opts: Record<string, unknown> = {...options};

    // start/end 按方向改写为 left/right。
    if (opts.left == null) {
      opts.left = isRtl ? opts.end : opts.start;
    }
    if (opts.right == null) {
      opts.right = isRtl ? opts.start : opts.end;
    }

    // bottom 偏移换算为 top 偏移。
    if (opts.bottom != null) {
      opts.top = el.scrollHeight - el.clientHeight - (opts.bottom as number);
    }

    if (isRtl && getRtlScrollAxisType() !== RtlScrollAxisType.NORMAL) {
      // 非 NORMAL 浏览器中 left 语义与滚动轴类型相关，先换算为 right 再归一。
      if (opts.left != null) {
        opts.right = el.scrollWidth - el.clientWidth - (opts.left as number);
      }

      if (getRtlScrollAxisType() === RtlScrollAxisType.INVERTED) {
        opts.left = opts.right;
      } else if (getRtlScrollAxisType() === RtlScrollAxisType.NEGATED) {
        opts.left = opts.right ? -(opts.right as number) : opts.right;
      }
    } else if (opts.right != null) {
      opts.left = el.scrollWidth - el.clientWidth - (opts.right as number);
    }

    this._applyScrollToOptions(el, opts);
  }

  /**
   * 测量相对容器指定边的滚动偏移（归一化，RTL 下语义与 scrollTo 对应）。
   * @param from 测量基准边：top/bottom/left/right 或按方向的 start/end。
   */
  measureScrollOffset(from: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end'): number {
    const el = this.getElement();
    if (from === 'top') {
      return el.scrollTop;
    }
    if (from === 'bottom') {
      return el.scrollHeight - el.clientHeight - el.scrollTop;
    }

    const isRtl = getDirection(el) === 'rtl';
    if (from === 'start') {
      from = isRtl ? 'right' : 'left';
    } else if (from === 'end') {
      from = isRtl ? 'left' : 'right';
    }

    if (isRtl && getRtlScrollAxisType() === RtlScrollAxisType.INVERTED) {
      // INVERTED：完全靠左时 scrollLeft = max，完全靠右时为 0。
      return from === 'left' ? el.scrollWidth - el.clientWidth - el.scrollLeft : el.scrollLeft;
    } else if (isRtl && getRtlScrollAxisType() === RtlScrollAxisType.NEGATED) {
      // NEGATED：完全靠左时 scrollLeft = -max，完全靠右时为 0。
      return from === 'left' ? el.scrollLeft + el.scrollWidth - el.clientWidth : -el.scrollLeft;
    } else {
      // NORMAL 与非 RTL：靠左时 scrollLeft = 0，靠右时为 max。
      return from === 'left' ? el.scrollLeft : el.scrollWidth - el.clientWidth - el.scrollLeft;
    }
  }

  private _applyScrollToOptions(el: HTMLElement, options: Record<string, unknown>): void {
    if (supportsScrollBehavior()) {
      el.scrollTo(options as ScrollToOptions);
    } else {
      if (options.top != null) {
        el.scrollTop = options.top as number;
      }
      if (options.left != null) {
        el.scrollLeft = options.left as number;
      }
    }
  }
}

/**
 * 组合式 API：把指定元素绑定为滚动容器，随组件挂载/卸载自动注册与清理。
 * @param target 元素、元素 ref 或延迟解析函数。
 */
export function useScrollable(target: ScrollableTarget): Scrollable {
  const scrollable = new Scrollable(target);
  onMounted(() => scrollable.attach());
  onBeforeUnmount(() => scrollable.destroy());
  return scrollable;
}

/** vScrollable 指令在元素上保存的实例。 */
const SCROLLABLE_STATE = Symbol('vcdk-scrollable');

type ScrollableElement = HTMLElement & {[SCROLLABLE_STATE]?: Scrollable};

/**
 * 声明式滚动容器指令，对应 Angular 的 `cdkScrollable`：
 * 元素挂载时注册到 ScrollDispatcher，卸载时自动注销。
 */
export const vScrollable: Directive<HTMLElement> = {
  mounted(el: ScrollableElement) {
    const scrollable = new Scrollable(() => el);
    scrollable.attach();
    el[SCROLLABLE_STATE] = scrollable;
  },
  unmounted(el: ScrollableElement) {
    el[SCROLLABLE_STATE]?.destroy();
    delete el[SCROLLABLE_STATE];
  },
};
