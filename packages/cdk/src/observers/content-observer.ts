import {inject, onScopeDispose, provide, type InjectionKey} from 'vue';

/** 原生 MutationObserver 的可替换工厂，便于测试、SSR 与特殊运行环境注入实现。 */
export class MutationObserverFactory {
  /** 创建原生观察器；当前环境不支持 MutationObserver 时返回 null。 */
  create(callback: MutationCallback): MutationObserver | null {
    return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
  }
}

/** 内容变更流的观察者形式，与 Angular Observable 的 subscribe 调用习惯保持一致。 */
export interface ContentObserverStreamObserver {
  /** 收到一批有效 DOM 变更时调用。 */
  next?(records: MutationRecord[]): void;
  /** ContentObserver 销毁导致流结束时调用。 */
  complete?(): void;
}

/** 内容变更订阅；unsubscribe 幂等，closed 表示订阅是否已经结束。 */
export interface ContentObserverSubscription {
  readonly closed: boolean;
  unsubscribe(): void;
}

/** ContentObserver.observe 返回的轻量事件流，不要求使用者安装 RxJS。 */
export interface ContentObserverStream {
  subscribe(
    observer: ((records: MutationRecord[]) => void) | ContentObserverStreamObserver,
  ): ContentObserverSubscription;
}

interface ElementRegistration {
  observer: MutationObserver | null;
  subscribers: Set<{
    observer: ContentObserverStreamObserver;
    complete(): void;
  }>;
}

/**
 * 判断变更是否只涉及注释节点。
 *
 * Vue 与 Angular 都会使用注释节点表示 Fragment、条件分支或 Teleport 锚点；忽略这类变更
 * 可以避免框架内部渲染细节形成无意义通知，且与 Angular CDK observers 的行为一致。
 */
export function shouldIgnoreContentMutation(record: MutationRecord): boolean {
  if (record.type === 'characterData' && record.target.nodeType === Node.COMMENT_NODE) return true;
  if (record.type !== 'childList') return false;
  return [...record.addedNodes, ...record.removedNodes].every(
    node => node.nodeType === Node.COMMENT_NODE,
  );
}

/**
 * 可共享的 DOM 内容观察服务，对应 Angular CDK ContentObserver。
 *
 * 同一元素的所有订阅共享一个原生 MutationObserver；最后一个订阅结束时自动 disconnect。
 * destroy 会同步断开全部观察器并完成活动订阅，方法可重复调用。实例仅操作调用方传入的元素，
 * 不保留已取消订阅的 DOM 引用。SSR 中可以构造和订阅，但不会产生变更事件。
 */
export class ContentObserver {
  private readonly observedElements = new Map<Element, ElementRegistration>();
  private destroyed = false;

  constructor(private readonly mutationObserverFactory = new MutationObserverFactory()) {}

  /**
   * 观察元素的 characterData、childList 与 subtree 变化。
   * 返回冷订阅外观：只有 subscribe 后才注册；调用方必须 unsubscribe 或使用 useObserveContent。
   */
  observe(element: Element): ContentObserverStream {
    return {
      subscribe: observer => this.subscribe(element, observer),
    };
  }

  /** 断开所有原生观察器并完成全部活动订阅；销毁后的新订阅会立即完成。 */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const [element, registration] of this.observedElements) {
      registration.observer?.disconnect();
      for (const subscriber of registration.subscribers) subscriber.complete();
      registration.subscribers.clear();
      this.observedElements.delete(element);
    }
  }

  /** Angular 生命周期命名兼容入口。 */
  ngOnDestroy(): void {
    this.destroy();
  }

  private subscribe(
    element: Element,
    observer: ((records: MutationRecord[]) => void) | ContentObserverStreamObserver,
  ): ContentObserverSubscription {
    const streamObserver = typeof observer === 'function' ? {next: observer} : observer;
    let closed = this.destroyed;
    const subscriber = {
      observer: streamObserver,
      complete: () => {
        if (closed) return;
        closed = true;
        streamObserver.complete?.();
      },
    };

    if (closed) {
      streamObserver.complete?.();
    } else {
      let registration = this.observedElements.get(element);
      if (!registration) {
        registration = this.createRegistration(element);
        this.observedElements.set(element, registration);
      }
      registration.subscribers.add(subscriber);
    }

    return {
      get closed() {
        return closed;
      },
      unsubscribe: () => {
        if (closed) return;
        closed = true;
        const registration = this.observedElements.get(element);
        registration?.subscribers.delete(subscriber);
        if (registration && registration.subscribers.size === 0) {
          registration.observer?.disconnect();
          this.observedElements.delete(element);
        }
      },
    };
  }

  private createRegistration(element: Element): ElementRegistration {
    const registration: ElementRegistration = {observer: null, subscribers: new Set()};
    registration.observer = this.mutationObserverFactory.create(records => {
      const relevantRecords = records.filter(record => !shouldIgnoreContentMutation(record));
      if (!relevantRecords.length || this.destroyed) return;
      for (const subscriber of [...registration.subscribers]) {
        subscriber.observer.next?.(relevantRecords);
      }
    });
    registration.observer?.observe(element, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    return registration;
  }
}

/** Vue 依赖注入键；应用级可通过 app.provide 替换默认 ContentObserver。 */
export const CDK_CONTENT_OBSERVER: InjectionKey<ContentObserver> = Symbol('CDK_CONTENT_OBSERVER');

/** 默认内容观察服务单例。 */
export const contentObserver = new ContentObserver();

/**
 * 在组件作用域向后代提供 ContentObserver。
 * 未传实例时创建的服务会随当前作用域销毁；外部传入实例仍由调用方管理生命周期。
 */
export function provideContentObserver(instance?: ContentObserver): ContentObserver {
  const provided = instance ?? new ContentObserver();
  provide(CDK_CONTENT_OBSERVER, provided);
  if (!instance) onScopeDispose(() => provided.destroy());
  return provided;
}

/** 获取当前注入作用域中的 ContentObserver；未提供时回退到默认单例。 */
export function useContentObserver(): ContentObserver {
  return inject(CDK_CONTENT_OBSERVER, contentObserver);
}
