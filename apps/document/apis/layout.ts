import type {ApiGroup} from '../api';

/** layout 模块 API：Angular 兼容服务、Vue 组合式入口与公开类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '组合式 API',
    titleEn: 'Composition API',
    rows: [
      {
        name: 'useBreakpoints',
        signature: 'useBreakpoints(value, observer?): UseBreakpointsReturn',
        description: '观察一个查询、逗号组合查询或查询数组，返回 matches、breakpoints、state 三个只读 ref 与 stop。setup/effectScope 中自动退订；作用域外必须调用 stop。',
        descriptionEn: 'Observes one query, a comma-separated query, or an array of queries. Returns read-only matches, breakpoints, and state refs plus stop. Unsubscribes automatically in setup/effectScope; call stop outside a scope.',
      },
      {
        name: 'UseBreakpointsReturn',
        signature: '{ matches: Readonly<Ref<boolean>>; breakpoints: Readonly<Ref<Record<string, boolean>>>; state: Readonly<Ref<BreakpointState>>; stop(): void }',
        description: 'Composition API 返回类型。matches 表示任一查询命中，breakpoints 保留逐项状态。',
        descriptionEn: 'Return type for the Composition API. matches is true when any query matches; breakpoints retains the result for each query.',
      },
      {
        name: 'useBreakpointObserver / provideBreakpointObserver',
        signature: 'useBreakpointObserver(): BreakpointObserver / provideBreakpointObserver(instance?): BreakpointObserver',
        description: 'Vue 依赖注入入口。provide 缺省创建实例并随当前作用域销毁；传入外部实例时由调用方管理生命周期。适合局部覆盖、SSR 每请求实例和测试替身；use 未找到注入时回退全局单例。',
        descriptionEn: 'Vue dependency-injection entry points. provide creates an instance by default and destroys it with the current scope; externally supplied instances remain caller-managed. Useful for local overrides, per-request SSR instances, and test doubles. use falls back to the global singleton when no provider is found.',
      },
      {
        name: 'CDK_BREAKPOINT_OBSERVER / breakpointObserver',
        signature: 'InjectionKey<BreakpointObserver> / BreakpointObserver',
        description: '应用级注入键与全局服务单例。SSR 应避免跨请求共享状态，建议每个应用实例单独 provide。',
        descriptionEn: 'App-level injection key and global service singleton. In SSR, avoid sharing state across requests; provide a separate instance for each app.',
      },
    ],
  },
  {
    title: '断点观察服务',
    titleEn: 'Breakpoint observation service',
    rows: [
      {
        name: 'BreakpointObserver',
        signature: 'class BreakpointObserver(mediaMatcher?: MediaMatcher)',
        description: '缓存并复用 MediaQueryList；首个状态同步发出，后续同一任务内的多查询变更合并到一个微任务。destroy/ngOnDestroy 会移除原生监听并完成活动流。',
        descriptionEn: 'Caches and reuses MediaQueryList instances. Emits the initial state synchronously, then batches multiple query changes in the same task into one microtask. destroy/ngOnDestroy removes native listeners and completes active streams.',
      },
      {
        name: 'BreakpointObserver.isMatched',
        signature: 'isMatched(value: string | readonly string[]): boolean',
        description: '同步判断任一查询是否匹配；逗号分隔的组合查询会按 Angular CDK 语义拆分。',
        descriptionEn: 'Synchronously checks whether any query matches. Comma-separated queries are split using Angular CDK semantics.',
      },
      {
        name: 'BreakpointObserver.observe',
        signature: 'observe(value): BreakpointStream',
        description: '返回可 subscribe 的只读事件流。subscribe 接收回调或 {next, complete}，并返回带 closed 与 unsubscribe 的幂等句柄。该轻量流不包含 RxJS pipe 操作符。',
        descriptionEn: 'Returns a read-only stream with subscribe(). subscribe accepts a callback or {next, complete} and returns an idempotent handle with closed and unsubscribe. This lightweight stream does not include RxJS pipe operators.',
      },
      {
        name: 'BreakpointState',
        signature: '{ matches: boolean; breakpoints: Record<string, boolean> }',
        description: '合并状态；matches 为逐项状态的逻辑或，breakpoints 的键是拆分、去空白后的查询文本。',
        descriptionEn: 'Combined state: matches is the logical OR of the individual results, and breakpoints is keyed by each trimmed query after splitting.',
      },
      {
        name: 'BreakpointStream / BreakpointSubscription / BreakpointStateObserver',
        signature: '事件流、订阅句柄与对象观察者类型',
        description: '零 RxJS 依赖的最小可订阅契约。需要操作符时可在项目中桥接到所用事件库。',
        descriptionEn: 'Minimal subscribable contracts with no RxJS dependency. Bridge to your event library if operators are needed.',
      },
    ],
  },
  {
    title: '媒体匹配与预设',
    titleEn: 'Media matching and presets',
    rows: [
      {
        name: 'Breakpoints',
        signature: 'Readonly<{ XSmall; Small; Medium; Large; XLarge; Handset; Tablet; Web; ... }>',
        description: '与 Angular CDK 完全一致的 Material Design 像素和方向断点常量。',
        descriptionEn: 'Material Design pixel-width and orientation breakpoint constants matching Angular CDK.',
      },
      {
        name: 'MediaMatcher',
        signature: 'class MediaMatcher(options?: MediaMatcherOptions)',
        description: '统一调用 matchMedia；SSR 返回安全空实现，WebKit/Blink 自动注入兼容空规则，支持 CSP nonce。',
        descriptionEn: 'Provides a unified matchMedia call. SSR returns a safe empty implementation; WebKit/Blink receive an injected compatibility rule. Supports a CSP nonce.',
      },
      {
        name: 'MediaMatcher.matchMedia',
        signature: 'matchMedia(query: string): MediaQueryList',
        description: '返回原生兼容 MediaQueryList。非法查询的行为由宿主 matchMedia 决定。',
        descriptionEn: 'Returns a native-compatible MediaQueryList. Invalid-query behavior is determined by the host matchMedia implementation.',
      },
      {
        name: 'MediaMatcherOptions',
        signature: '{ platform?: Platform; nonce?: string | null; matchMedia?: (query) => MediaQueryList }',
        description: '平台、CSP nonce 和自定义匹配器注入选项，主要用于 SSR、多宿主与单元测试。',
        descriptionEn: 'Options for injecting a platform, CSP nonce, and custom matcher, primarily for SSR, multiple hosts, and unit tests.',
      },
      {
        name: 'splitQueries',
        signature: 'splitQueries(value: string | readonly string[]): readonly string[]',
        description: '将数组中的逗号组合查询拆分、去除首尾空白并按首次出现顺序去重。',
        descriptionEn: 'Splits comma-separated queries in an array, trims surrounding whitespace, and removes duplicates while preserving first-seen order.',
      },
    ],
  },
  {
    title: 'Breakpoints 内置断点',
    titleEn: 'Built-in Breakpoints',
    rows: [
      {
        name: 'Breakpoints.XSmall',
        signature: "'(max-width: 599.98px)'",
        description: '超小屏幕，视口宽度小于 600px。',
        descriptionEn: 'Extra-small screens with a viewport narrower than 600px.',
      },
      {
        name: 'Breakpoints.Small',
        signature: "'(min-width: 600px) and (max-width: 959.98px)'",
        description: '小屏幕，视口宽度为 600px 至 959.98px。',
        descriptionEn: 'Small screens with a viewport from 600px to 959.98px wide.',
      },
      {
        name: 'Breakpoints.Medium',
        signature: "'(min-width: 960px) and (max-width: 1279.98px)'",
        description: '中等屏幕，视口宽度为 960px 至 1279.98px。',
        descriptionEn: 'Medium screens with a viewport from 960px to 1279.98px wide.',
      },
      {
        name: 'Breakpoints.Large',
        signature: "'(min-width: 1280px) and (max-width: 1919.98px)'",
        description: '大屏幕，视口宽度为 1280px 至 1919.98px。',
        descriptionEn: 'Large screens with a viewport from 1280px to 1919.98px wide.',
      },
      {
        name: 'Breakpoints.XLarge',
        signature: "'(min-width: 1920px)'",
        description: '超大屏幕，视口宽度不小于 1920px。',
        descriptionEn: 'Extra-large screens with a viewport at least 1920px wide.',
      },
      {
        name: 'Breakpoints.Handset',
        signature: "'(max-width: 599.98px) and (orientation: portrait), (max-width: 959.98px) and (orientation: landscape)'",
        description: '手持设备：竖屏宽度小于 600px，或横屏宽度小于 960px。逗号表示两个媒体查询满足任意一个即可。',
        descriptionEn: 'Handset devices: portrait width below 600px or landscape width below 960px. The comma means either media query may match.',
      },
      {
        name: 'Breakpoints.Tablet',
        signature: "'(min-width: 600px) and (max-width: 839.98px) and (orientation: portrait), (min-width: 960px) and (max-width: 1279.98px) and (orientation: landscape)'",
        description: '平板设备：竖屏宽度为 600px 至 839.98px，或横屏宽度为 960px 至 1279.98px。',
        descriptionEn: 'Tablet devices: portrait width from 600px to 839.98px, or landscape width from 960px to 1279.98px.',
      },
      {
        name: 'Breakpoints.Web',
        signature: "'(min-width: 840px) and (orientation: portrait), (min-width: 1280px) and (orientation: landscape)'",
        description: 'Web/桌面设备：竖屏宽度不小于 840px，或横屏宽度不小于 1280px。',
        descriptionEn: 'Web/desktop devices: portrait width of at least 840px or landscape width of at least 1280px.',
      },
      {
        name: 'Breakpoints.HandsetPortrait',
        signature: "'(max-width: 599.98px) and (orientation: portrait)'",
        description: '竖屏手持设备，宽度小于 600px。',
        descriptionEn: 'Portrait handset devices narrower than 600px.',
      },
      {
        name: 'Breakpoints.TabletPortrait',
        signature: "'(min-width: 600px) and (max-width: 839.98px) and (orientation: portrait)'",
        description: '竖屏平板设备，宽度为 600px 至 839.98px。',
        descriptionEn: 'Portrait tablet devices from 600px to 839.98px wide.',
      },
      {
        name: 'Breakpoints.WebPortrait',
        signature: "'(min-width: 840px) and (orientation: portrait)'",
        description: '竖屏 Web/桌面设备，宽度不小于 840px。',
        descriptionEn: 'Portrait Web/desktop devices at least 840px wide.',
      },
      {
        name: 'Breakpoints.HandsetLandscape',
        signature: "'(max-width: 959.98px) and (orientation: landscape)'",
        description: '横屏手持设备，宽度小于 960px。',
        descriptionEn: 'Landscape handset devices narrower than 960px.',
      },
      {
        name: 'Breakpoints.TabletLandscape',
        signature: "'(min-width: 960px) and (max-width: 1279.98px) and (orientation: landscape)'",
        description: '横屏平板设备，宽度为 960px 至 1279.98px。',
        descriptionEn: 'Landscape tablet devices from 960px to 1279.98px wide.',
      },
      {
        name: 'Breakpoints.WebLandscape',
        signature: "'(min-width: 1280px) and (orientation: landscape)'",
        description: '横屏 Web/桌面设备，宽度不小于 1280px。',
        descriptionEn: 'Landscape Web/desktop devices at least 1280px wide.',
      },
    ],
  },
];
