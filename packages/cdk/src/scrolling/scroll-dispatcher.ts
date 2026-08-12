/**
 * 全局滚动分发器，对齐 Angular CDK 的 ScrollDispatcher。
 *
 * 设计要点：
 * - `register/deregister` 管理显式注册的滚动目标（vScrollable 指令、虚拟滚动视口等）；
 * - 在 document 捕获阶段监听滚动，把窗口/文档滚动作为全局事件（void）派发；
 *   元素自身的滚动由注册目标通过 `elementScrolled` 转发，避免面板内滚动误触发全局事件；
 * - 与 Angular 的差异：事件流使用自研 Emitter（subscribe 返回退订函数），
 *   节流语义为「窗口首事件立即派发 + 窗口结束时补发最后一次事件」，
 *   与 Angular 的 auditTime（仅尾部派发）略有不同，与仓库既有 overlay 策略行为保持一致。
 */

import {unref, type Ref} from 'vue';
import {Emitter} from '../emitter';
import {isBrowser} from '../platform';
import {addListener} from './listen';

/** 默认滚动节流间隔（毫秒），与 Angular 的 DEFAULT_SCROLL_TIME 一致。 */
export const DEFAULT_SCROLL_TIME = 20;

/** 可注册到 ScrollDispatcher 的滚动目标。 */
export interface ScrollDispatcherTarget {
  /** 元素自身滚动时派发的事件流。 */
  elementScrolled(): Emitter<Event>;

  /** 返回滚动元素引用，形状与 Angular ElementRef 一致。 */
  getElementRef(): {nativeElement: HTMLElement};
}

/**
 * 判断事件目标是否为全局滚动载体（window / document / html / body）。
 *
 * 不直接与全局 window/document 做身份比较：测试环境（如 vitest 的 jsdom）
 * 中事件 target 可能是另一 realm 的原始对象，身份比较会误判失败。
 */
function isGlobalScrollTarget(target: EventTarget | null): boolean {
  if (!target) {
    return false;
  }

  // window 的特征：window.self === window 或 window.window === window。
  const windowLike = target as Window & {self?: unknown; window?: unknown};
  if (windowLike.window === target || windowLike.self === target) {
    return true;
  }

  const documentLike = target as Document;
  if (documentLike.nodeType === 9) {
    return true;
  }

  const element = target as HTMLElement;
  if (element.nodeType === 1 && element.ownerDocument) {
    const {documentElement, body} = element.ownerDocument;
    return element === documentElement || element === body;
  }

  return false;
}

/**
 * 全局滚动分发器。
 *
 * 幂等性：register 重复注册同一目标不产生副作用；deregister 未注册目标为空操作。
 */
export class ScrollDispatcher {
  /** 所有已注册滚动目标及其对应的退订函数。 */
  readonly scrollContainers: Map<ScrollDispatcherTarget, () => void> = new Map();

  private readonly _scrolled = new Emitter<ScrollDispatcherTarget | void>();
  private _attached = false;
  private _disposed = false;
  /** 同一物理滚动会在 window 与 document 上同步各派发一次，用该标志去重。 */
  private _inGlobalDispatch = false;
  private _cleanupGlobal: (() => void) | undefined;
  private _cleanupWindow: (() => void) | undefined;

  /**
   * 注册滚动目标：订阅其 elementScrolled 流，滚动时以目标身份派发全局事件。
   * 重复注册同一目标为空操作。
   */
  register(target: ScrollDispatcherTarget): void {
    if (this.scrollContainers.has(target)) {
      return;
    }

    const unsubscribe = target.elementScrolled().subscribe(() => this._scrolled.next(target));
    this.scrollContainers.set(target, unsubscribe);
  }

  /** 注销滚动目标并退订其事件流；未注册的目标为空操作。 */
  deregister(target: ScrollDispatcherTarget): void {
    const unsubscribe = this.scrollContainers.get(target);
    if (unsubscribe) {
      unsubscribe();
      this.scrollContainers.delete(target);
    }
  }

  /**
   * 订阅任意已注册滚动目标或窗口/文档的滚动事件。
   * @param auditTimeInMs 节流间隔（毫秒），0 表示不节流，默认 DEFAULT_SCROLL_TIME。
   * @returns Emitter：首个订阅者挂载全局监听，全部退订后自动卸载。
   */
  scrolled(auditTimeInMs: number = DEFAULT_SCROLL_TIME): Emitter<ScrollDispatcherTarget | void> {
    // 非浏览器环境（SSR）与销毁后的分发器返回永不派发的空流，语义与 Angular 的 of() 对齐。
    if (!isBrowser() || this._disposed) {
      return new Emitter();
    }

    const output = new Emitter<ScrollDispatcherTarget | void>();
    const originalSubscribe = output.subscribe.bind(output);
    let subscribers = 0;
    let forward: (() => void) | undefined;

    // 覆写实例 subscribe：首个订阅者连接内部滚动流并挂载全局监听，
    // 最后一个订阅者退订时释放连接，避免长期空挂全局监听。
    output.subscribe = listener => {
      if (subscribers === 0) {
        forward = this._connect(auditTimeInMs, output);
        this._attach();
      }
      subscribers++;

      const unsubscribe = originalSubscribe(listener);
      return () => {
        unsubscribe();
        subscribers--;
        if (subscribers === 0) {
          forward?.();
          forward = undefined;
          this._detach();
        }
      };
    };

    return output;
  }

  /**
   * 订阅指定元素的所有滚动祖先（已注册目标）或窗口/文档的滚动事件。
   * @param elementOrRef 目标元素或其响应式引用。
   * @param auditTimeInMs 节流间隔（毫秒）。
   */
  ancestorScrolled(
    elementOrRef: HTMLElement | Ref<HTMLElement | null | undefined>,
    auditTimeInMs?: number,
  ): Emitter<ScrollDispatcherTarget | void> {
    const ancestors = this.getAncestorScrollContainers(elementOrRef);
    const stream = this.scrolled(auditTimeInMs);
    const filtered = new Emitter<ScrollDispatcherTarget | void>();

    const unsubscribe = stream.subscribe(target => {
      // 窗口/文档滚动（void）始终放行；元素滚动仅放行注册过的滚动祖先。
      if (!target || ancestors.includes(target)) {
        filtered.next(target);
      }
    });

    const originalSubscribe = filtered.subscribe.bind(filtered);
    filtered.subscribe = listener => {
      const inner = originalSubscribe(listener);
      return () => {
        inner();
        unsubscribe();
      };
    };

    return filtered;
  }

  /** 返回包含指定元素的所有已注册滚动容器。 */
  getAncestorScrollContainers(
    elementOrRef: HTMLElement | Ref<HTMLElement | null | undefined>,
  ): ScrollDispatcherTarget[] {
    const element = unref(elementOrRef);
    if (!element) {
      return [];
    }

    const result: ScrollDispatcherTarget[] = [];
    this.scrollContainers.forEach((_unsubscribe, target) => {
      if (this._targetContainsElement(target, element)) {
        result.push(target);
      }
    });
    return result;
  }

  /** 销毁分发器：卸载全局监听、注销全部目标并结束事件流。 */
  dispose(): void {
    this._detach();
    this.scrollContainers.forEach((_unsubscribe, target) => this.deregister(target));
    this._scrolled.complete();
    this._disposed = true;
  }

  /** 连接内部滚动流到输出，返回断开函数。 */
  private _connect(
    auditTimeInMs: number,
    output: Emitter<ScrollDispatcherTarget | void>,
  ): () => void {
    if (auditTimeInMs > 0) {
      return throttleForward(this._scrolled, auditTimeInMs, output);
    }
    return this._scrolled.subscribe(value => output.next(value));
  }

  /** 挂载全局滚动监听；已挂载时为幂等操作。 */
  private _attach(): void {
    if (this._attached) {
      return;
    }
    this._cleanupGlobal = addListener(document, 'scroll', this._onGlobalScroll, true);
    this._cleanupWindow = addListener(window, 'scroll', this._onGlobalScroll);
    this._attached = true;
  }

  private _detach(): void {
    this._cleanupGlobal?.();
    this._cleanupWindow?.();
    this._cleanupGlobal = undefined;
    this._cleanupWindow = undefined;
    this._attached = false;
  }

  /** 全局滚动回调：仅把窗口/文档滚动作为 void 事件派发。 */
  private _onGlobalScroll = (event: Event): void => {
    const target = event.target;
    // 同一物理滚动的双派发发生在同一同步调用栈内，直接忽略第二次。
    if (!isGlobalScrollTarget(target) || this._inGlobalDispatch) {
      return;
    }
    this._inGlobalDispatch = true;
    try {
      this._scrolled.next();
    } finally {
      this._inGlobalDispatch = false;
    }
  };

  /** 判断注册目标是否包含指定元素（沿父链查找）。 */
  private _targetContainsElement(target: ScrollDispatcherTarget, element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    const targetElement = target.getElementRef().nativeElement;

    do {
      if (current === targetElement) {
        return true;
      }
    } while ((current = current.parentElement));

    return false;
  }
}

/**
 * 节流转发：窗口内首个事件立即派发，窗口结束时补发最后一次事件。
 * 保证高频滚动下回调次数有限，且不会丢失滚动位置信息。
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
      // 窗口内后续事件只更新待补发的值，避免为每个事件创建定时器。
      pendingValue = value;
    }
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}

/** 默认滚动分发器单例。 */
export const scrollDispatcher = new ScrollDispatcher();
