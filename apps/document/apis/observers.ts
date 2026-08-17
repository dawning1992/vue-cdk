import type {ApiGroup} from '../api';

/** observers 模块 API：服务、Composition API、指令及依赖注入扩展点。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '内容观察服务',
    rows: [
      {
        name: 'ContentObserver',
        signature: 'class ContentObserver（constructor(factory?: MutationObserverFactory)）',
        description:
          '对应 Angular CDK ContentObserver。同一 Element 的多个订阅共享一个原生 MutationObserver；最后一个订阅取消时断开。destroy()/ngOnDestroy() 会完成活动流并释放全部 DOM 引用。',
      },
      {
        name: 'ContentObserver.observe',
        signature: 'observe(element: Element): ContentObserverStream',
        description:
          '观察 characterData、childList 和 subtree，过滤仅由 Comment 节点造成的变化。返回流需调用 subscribe；非组件场景下调用方必须保存订阅并 unsubscribe。',
      },
      {
        name: 'ContentObserverStream',
        signature: 'subscribe(callback | {next?, complete?}): ContentObserverSubscription',
        description:
          '零 RxJS 的轻量只读流，保留 Angular observe(...).subscribe(...) 调用形态。回调接收 MutationRecord[]。',
      },
      {
        name: 'ContentObserverSubscription',
        signature: '{readonly closed: boolean; unsubscribe(): void}',
        description: '幂等订阅句柄；服务销毁或主动退订后 closed 为 true。',
      },
      {
        name: 'contentObserver',
        signature: 'const contentObserver: ContentObserver',
        description: '模块级默认单例，供指令及组件外命令式代码复用。',
      },
    ],
  },
  {
    title: 'Composition API',
    rows: [
      {
        name: 'useObserveContent',
        signature:
          'useObserveContent(target, callback, options?: UseObserveContentOptions): ObserveContentRef',
        description:
          '观察 Element 的 Ref/getter；target、disabled 或 debounce 变化时自动切换订阅，并在组件 effect scope 销毁时自动清理。scope 外调用必须执行返回值 stop()。',
      },
      {
        name: 'UseObserveContentOptions',
        signature: '{disabled?: MaybeRefOrGetter<boolean>; debounce?: MaybeRefOrGetter<number>; observer?: ContentObserver}',
        description:
          '响应式配置。debounce 单位毫秒，负数与非有限值按 0；observer 可覆盖注入及默认服务。',
      },
      {
        name: 'ObserveContentRef',
        signature: '{stop(): void}',
        description: '命令式停止句柄；stop() 会取消订阅和待执行的防抖回调，且可重复调用。',
      },
      {
        name: 'useContentObserver',
        signature: 'useContentObserver(): ContentObserver',
        description: '读取当前组件注入作用域的服务，未提供时回退到 contentObserver 单例。',
      },
    ],
  },
  {
    title: 'cdkObserveContent 指令',
    rows: [
      {
        name: 'vCdkObserveContent / cdkObserveContent',
        signature: 'Directive<Element, CdkObserveContentValue>',
        description:
          '对应 Angular cdkObserveContent，Vue 模板名为 v-cdk-observe-content。可直接绑定回调，或绑定 {callback, disabled, debounce, observer}；卸载时自动释放。cdkObserveContent 是同一指令的 Angular 风格导出别名。',
      },
      {
        name: 'CdkObserveContentValue',
        signature: '((records: MutationRecord[]) => void) | CdkObserveContentOptions',
        description: '指令绑定值类型；函数形式适合默认行为，对象形式支持暂停、防抖及服务覆盖。',
      },
      {
        name: 'CdkObserveContentOptions',
        signature: '{callback; disabled?: boolean; debounce?: number; observer?: ContentObserver}',
        description: '指令完整配置；disabled 会真正退订并在重新启用时重新连接底层观察器。',
      },
    ],
  },
  {
    title: '依赖注入与扩展',
    rows: [
      {
        name: 'MutationObserverFactory',
        signature: 'class MutationObserverFactory {create(callback): MutationObserver | null}',
        description:
          '原生观察器工厂。无 MutationObserver 的 SSR 环境返回 null；测试、iframe 或兼容层可传入自定义工厂。',
      },
      {
        name: 'CDK_CONTENT_OBSERVER',
        signature: 'InjectionKey<ContentObserver>',
        description: '应用级或组件树级 ContentObserver 注入键，useObserveContent 与未显式传 observer 的指令都会读取。',
      },
      {
        name: 'provideContentObserver',
        signature: 'provideContentObserver(instance?: ContentObserver): ContentObserver',
        description:
          '在 setup 中向后代提供服务；不传实例时创建并随当前 scope 自动销毁，传入实例时生命周期仍归调用方。',
      },
      {
        name: 'shouldIgnoreContentMutation',
        signature: 'shouldIgnoreContentMutation(record: MutationRecord): boolean',
        description: '公开的过滤判定工具：仅注释节点变化返回 true，便于自定义观察管线保持同样语义。',
      },
    ],
  },
];
