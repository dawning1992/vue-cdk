import {inject, onScopeDispose, provide, type InjectionKey} from 'vue';
import {MediaMatcher} from './media-matcher';

/** 一个或多个媒体查询的当前合并状态。 */
export interface BreakpointState {
  /** 任一查询是否匹配。 */
  matches: boolean;
  /** 以规范化查询字符串为键的逐项匹配状态。 */
  breakpoints: Record<string, boolean>;
}

/** 订阅句柄；重复调用 `unsubscribe` 不产生副作用。 */
export interface BreakpointSubscription {
  readonly closed: boolean;
  unsubscribe(): void;
}

/** 观察者对象形式，便于从 Angular Observable 调用方式平滑迁移。 */
export interface BreakpointStateObserver {
  next?(state: BreakpointState): void;
  complete?(): void;
}

/** BreakpointObserver.observe 返回的轻量只读事件流。 */
export interface BreakpointStream {
  subscribe(
    observer: ((state: BreakpointState) => void) | BreakpointStateObserver,
  ): BreakpointSubscription;
}

interface QueryRegistration {
  mql: MediaQueryList;
  listeners: Set<() => void>;
  handler: (event: MediaQueryListEvent) => void;
}

/** 将逗号组合查询拆分并去重，与 Angular CDK 的监听粒度保持一致。 */
export function splitQueries(value: string | readonly string[]): readonly string[] {
  const values = typeof value === 'string' ? [value] : value;
  return [...new Set(values.flatMap(query => query.split(',')).map(query => query.trim()))];
}

/**
 * 媒体断点观察服务。
 *
 * 同一查询在实例内只创建一个 `MediaQueryList` 与一个原生监听器；多个消费流共享该注册。
 * 首次订阅同步派发快照，后续同一任务内的多项变化合并到一个微任务，避免布局抖动。
 */
export class BreakpointObserver {
  private readonly _queries = new Map<string, QueryRegistration>();
  private readonly _streams = new Set<{complete: () => void}>();
  private _destroyed = false;

  constructor(private readonly _mediaMatcher: MediaMatcher = new MediaMatcher()) {}

  /** 判断一个或多个媒体查询是否至少有一项匹配。 */
  isMatched(value: string | readonly string[]): boolean {
    return splitQueries(value).some(query => this._registerQuery(query).mql.matches);
  }

  /**
   * 观察查询状态。返回值保留 Angular `observe(...).subscribe(...)` 的调用形态；
   * 调用方必须在不再使用时退订，或在组件中优先使用 `useBreakpoints` 自动清理。
   */
  observe(value: string | readonly string[]): BreakpointStream {
    const queries = splitQueries(value);
    queries.forEach(query => this._registerQuery(query));

    return {
      subscribe: observer => this._subscribe(queries, observer),
    };
  }

  /** 销毁服务、移除全部原生监听器并完成活动事件流；销毁后不会再派发。 */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    for (const registration of this._queries.values()) {
      this._removeNativeListener(registration);
    }
    this._queries.clear();
    for (const stream of [...this._streams]) stream.complete();
    this._streams.clear();
  }

  /** Angular 生命周期命名兼容入口。 */
  ngOnDestroy(): void {
    this.destroy();
  }

  private _subscribe(
    queries: readonly string[],
    observer: ((state: BreakpointState) => void) | BreakpointStateObserver,
  ): BreakpointSubscription {
    let closed = this._destroyed;
    let scheduled = false;
    const next = typeof observer === 'function' ? observer : observer.next?.bind(observer);
    const complete = typeof observer === 'function' ? undefined : observer.complete?.bind(observer);
    const stream = {
      complete: () => {
        if (closed) return;
        closed = true;
        complete?.();
      },
    };

    const emit = () => {
      scheduled = false;
      if (!closed && !this._destroyed) next?.(this._createState(queries));
    };
    const schedule = () => {
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(emit);
      }
    };

    if (!closed) {
      this._streams.add(stream);
      queries.forEach(query => this._queries.get(query)!.listeners.add(schedule));
      next?.(this._createState(queries));
    } else {
      complete?.();
    }

    const subscription: BreakpointSubscription = {
      get closed() {
        return closed;
      },
      unsubscribe: () => {
        if (closed) return;
        closed = true;
        this._streams.delete(stream);
        queries.forEach(query => this._queries.get(query)?.listeners.delete(schedule));
      },
    };
    return subscription;
  }

  private _createState(queries: readonly string[]): BreakpointState {
    const breakpoints: Record<string, boolean> = {};
    for (const query of queries) breakpoints[query] = this._queries.get(query)?.mql.matches ?? false;
    return {matches: Object.values(breakpoints).some(Boolean), breakpoints};
  }

  private _registerQuery(query: string): QueryRegistration {
    const existing = this._queries.get(query);
    if (existing) return existing;
    const mql = this._mediaMatcher.matchMedia(query);
    const registration: QueryRegistration = {
      mql,
      listeners: new Set(),
      handler: () => {
        for (const listener of [...registration.listeners]) listener();
      },
    };
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', registration.handler);
    else mql.addListener(registration.handler);
    this._queries.set(query, registration);
    return registration;
  }

  private _removeNativeListener(registration: QueryRegistration): void {
    if (typeof registration.mql.removeEventListener === 'function') {
      registration.mql.removeEventListener('change', registration.handler);
    } else {
      registration.mql.removeListener(registration.handler);
    }
    registration.listeners.clear();
  }
}

/** Vue 依赖注入键；应用级可通过 `app.provide` 覆盖服务实例。 */
export const CDK_BREAKPOINT_OBSERVER: InjectionKey<BreakpointObserver> = Symbol(
  'CDK_BREAKPOINT_OBSERVER',
);

export const breakpointObserver = new BreakpointObserver();

/**
 * 在组件作用域向后代提供断点服务。
 * 未传实例时由当前作用域创建并自动销毁；外部传入实例的所有权仍归调用方。
 */
export function provideBreakpointObserver(instance?: BreakpointObserver): BreakpointObserver {
  const provided = instance ?? new BreakpointObserver();
  provide(CDK_BREAKPOINT_OBSERVER, provided);
  if (!instance) onScopeDispose(() => provided.destroy());
  return provided;
}

/** 获取当前注入作用域的断点服务；未注入时回退到全局单例。 */
export function useBreakpointObserver(): BreakpointObserver {
  return inject(CDK_BREAKPOINT_OBSERVER, breakpointObserver);
}
