import type {ApiGroup} from '../api';

/** observers 模块 API：服务、Composition API、指令及依赖注入扩展点。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '内容观察服务', titleEn: 'Content observation service',
    rows: [
      {
        name: 'ContentObserver',
        signature: 'class ContentObserver（constructor(factory?: MutationObserverFactory)）',
        description:
          '对应 Angular CDK ContentObserver。同一 Element 的多个订阅共享一个原生 MutationObserver；最后一个订阅取消时断开。destroy()/ngOnDestroy() 会完成活动流并释放全部 DOM 引用。',
        descriptionEn: 'Counterpart to Angular CDK ContentObserver. Multiple subscriptions for one Element share a native MutationObserver; it disconnects when the last subscription is removed. destroy()/ngOnDestroy() completes active streams and releases all DOM references.',
      },
      {
        name: 'ContentObserver.observe',
        signature: 'observe(element: Element): ContentObserverStream',
        description:
          '观察 characterData、childList 和 subtree，过滤仅由 Comment 节点造成的变化。返回流需调用 subscribe；非组件场景下调用方必须保存订阅并 unsubscribe。',
        descriptionEn: 'Observes characterData, childList, and subtree changes while filtering mutations caused only by Comment nodes. Call subscribe on the returned stream; outside a component, callers must retain the subscription and unsubscribe.',
      },
      {
        name: 'ContentObserverStream',
        signature: 'subscribe(callback | {next?, complete?}): ContentObserverSubscription',
        description:
          '零 RxJS 的轻量只读流，保留 Angular observe(...).subscribe(...) 调用形态。回调接收 MutationRecord[]。',
        descriptionEn: 'Lightweight readonly stream with no RxJS dependency, preserving the Angular observe(...).subscribe(...) call shape. The callback receives MutationRecord[].',
      },
      {
        name: 'ContentObserverSubscription',
        signature: '{readonly closed: boolean; unsubscribe(): void}',
        description: '幂等订阅句柄；服务销毁或主动退订后 closed 为 true。',
        descriptionEn: 'Idempotent subscription handle; closed becomes true after service destruction or explicit unsubscription.',
      },
      {
        name: 'contentObserver',
        signature: 'const contentObserver: ContentObserver',
        description: '模块级默认单例，供指令及组件外命令式代码复用。',
        descriptionEn: 'Module-level default singleton shared by the directive and imperative code outside components.',
      },
    ],
  },
  {
    title: 'Composition API', titleEn: 'Composition API',
    rows: [
      {
        name: 'useObserveContent',
        signature:
          'useObserveContent(target, callback, options?: UseObserveContentOptions): ObserveContentRef',
        description:
          '观察 Element 的 Ref/getter；target、disabled 或 debounce 变化时自动切换订阅，并在组件 effect scope 销毁时自动清理。scope 外调用必须执行返回值 stop()。',
        descriptionEn: 'Observes an Element Ref/getter. Automatically switches subscriptions when target, disabled, or debounce changes and cleans up when the component effect scope is disposed. Outside a scope, call stop() on the returned handle.',
      },
      {
        name: 'UseObserveContentOptions',
        signature: '{disabled?: MaybeRefOrGetter<boolean>; debounce?: MaybeRefOrGetter<number>; observer?: ContentObserver}',
        description:
          '响应式配置。debounce 单位毫秒，负数与非有限值按 0；observer 可覆盖注入及默认服务。',
        descriptionEn: 'Reactive options. debounce is measured in milliseconds; negative and non-finite values are treated as 0. observer overrides the injected and default services.',
      },
      {
        name: 'ObserveContentRef',
        signature: '{stop(): void}',
        description: '命令式停止句柄；stop() 会取消订阅和待执行的防抖回调，且可重复调用。',
        descriptionEn: 'Imperative stop handle. stop() cancels the subscription and any pending debounced callback, and may be called repeatedly.',
      },
      {
        name: 'useContentObserver',
        signature: 'useContentObserver(): ContentObserver',
        description: '读取当前组件注入作用域的服务，未提供时回退到 contentObserver 单例。',
        descriptionEn: 'Returns the service from the current component injection scope, falling back to the contentObserver singleton when none is provided.',
      },
    ],
  },
  {
    title: 'cdkObserveContent 指令', titleEn: 'cdkObserveContent directive',
    rows: [
      {
        name: 'vCdkObserveContent / cdkObserveContent',
        signature: 'Directive<Element, CdkObserveContentValue>',
        description:
          '对应 Angular cdkObserveContent，Vue 模板名为 v-cdk-observe-content。可直接绑定回调，或绑定 {callback, disabled, debounce, observer}；卸载时自动释放。cdkObserveContent 是同一指令的 Angular 风格导出别名。',
        descriptionEn: 'Counterpart to Angular cdkObserveContent; its Vue template name is v-cdk-observe-content. Bind a callback directly or bind {callback, disabled, debounce, observer}; cleanup runs on unmount. cdkObserveContent is an Angular-style export alias for the same directive.',
      },
      {
        name: 'CdkObserveContentValue',
        signature: '((records: MutationRecord[]) => void) | CdkObserveContentOptions',
        description: '指令绑定值类型；函数形式适合默认行为，对象形式支持暂停、防抖及服务覆盖。',
        descriptionEn: 'Directive binding type. Use the function form for default behavior; the object form supports pausing, debouncing, and service overrides.',
      },
      {
        name: 'CdkObserveContentOptions',
        signature: '{callback; disabled?: boolean; debounce?: number; observer?: ContentObserver}',
        description: '指令完整配置；disabled 会真正退订并在重新启用时重新连接底层观察器。',
        descriptionEn: 'Full directive configuration. disabled unsubscribes from the observer and reconnects it when re-enabled.',
      },
    ],
  },
  {
    title: '依赖注入与扩展', titleEn: 'Dependency injection and extensions',
    rows: [
      {
        name: 'MutationObserverFactory',
        signature: 'class MutationObserverFactory {create(callback): MutationObserver | null}',
        description:
          '原生观察器工厂。无 MutationObserver 的 SSR 环境返回 null；测试、iframe 或兼容层可传入自定义工厂。',
        descriptionEn: 'Factory for native observers. Returns null in SSR environments without MutationObserver; tests, iframes, or compatibility layers can supply a custom factory.',
      },
      {
        name: 'CDK_CONTENT_OBSERVER',
        signature: 'InjectionKey<ContentObserver>',
        description: '应用级或组件树级 ContentObserver 注入键，useObserveContent 与未显式传 observer 的指令都会读取。',
        descriptionEn: 'Application-level or component-tree injection key for ContentObserver. Read by useObserveContent and directives without an explicit observer.',
      },
      {
        name: 'provideContentObserver',
        signature: 'provideContentObserver(instance?: ContentObserver): ContentObserver',
        description:
          '在 setup 中向后代提供服务；不传实例时创建并随当前 scope 自动销毁，传入实例时生命周期仍归调用方。',
        descriptionEn: 'Provides the service to descendants during setup. Without an instance, one is created and destroyed with the current scope; when an instance is supplied, its lifecycle remains the caller’s responsibility.',
      },
      {
        name: 'shouldIgnoreContentMutation',
        signature: 'shouldIgnoreContentMutation(record: MutationRecord): boolean',
        description: '公开的过滤判定工具：仅注释节点变化返回 true，便于自定义观察管线保持同样语义。',
        descriptionEn: 'Public mutation-filter helper that returns true only for changes caused by comment nodes, allowing custom observation pipelines to preserve the same behavior.',
      },
    ],
  },
];
