import type {ApiGroup} from '../api';

/** platform 模块 API 分组：能力检测、事件工具与滚动轴类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '平台服务与注入',
    rows: [
      {
        name: 'usePlatform',
        signature: 'usePlatform(): Platform',
        description:
          '组合式入口，返回当前作用域的 Platform 实例：组件链上存在 providePlatform 或 App 级 CDK_PLATFORM 注入时优先，否则回退全局单例。必须在 setup 期间调用。',
      },
      {
        name: 'providePlatform',
        signature: 'providePlatform(instance?: Platform): Platform',
        description:
          '在组件 setup 中向下提供 Platform 实例并返回该实例；缺省参数提供全局单例。传 createPlatform 实例可覆盖 UA 检测结果（如 iframe、SSR 注入）。',
      },
      {
        name: 'CDK_PLATFORM',
        signature: 'InjectionKey<Platform>',
        description:
          'Platform 注入键，对应 Angular PlatformModule 的依赖提供语义；App 级用法：app.provide(CDK_PLATFORM, platform)。',
      },
      {
        name: 'createPlatform',
        signature: 'createPlatform(options?: PlatformOptions): Platform',
        description:
          '创建平台实例；SSR 或单测中可传 { userAgent } 固定检测结果，不依赖 navigator.userAgent。',
      },
      {
        name: 'platform',
        signature: 'const platform: Platform',
        description:
          '模块级全局单例，导入时按当前环境快照构建；setup 之外的命令式场景直接使用。',
      },
      {
        name: 'Platform',
        signature: 'class Platform（constructor(options?: PlatformOptions)）',
        description:
          '平台检测服务，对齐 Angular CDK Platform：所有浏览器/引擎标志在构造时快照，非响应式；需要响应式追踪时自行用 reactive() 包装。',
      },
      {
        name: 'PlatformOptions',
        signature: 'interface PlatformOptions { userAgent?: string }',
        description:
          'Platform 构造选项；userAgent 用于覆盖浏览器识别所使用的 UA 字符串。',
      },
    ],
  },
  {
    title: '浏览器识别属性（Platform）',
    rows: [
      {
        name: 'Platform.isBrowser',
        signature: 'readonly isBrowser: boolean',
        description: '是否运行在浏览器环境（window 与 document 均存在）；SSR 下为 false。',
      },
      {
        name: 'Platform.EDGE',
        signature: 'readonly EDGE: boolean',
        description:
          '当前浏览器是否为 Microsoft Edge。检测规则与 Angular 一致，仅命中 UA 中完整的 "Edge" 字样（EdgeHTML 时代）。',
      },
      {
        name: 'Platform.TRIDENT',
        signature: 'readonly TRIDENT: boolean',
        description: '当前渲染引擎是否为 Microsoft Trident（旧版 IE，UA 命中 msie/trident）。',
      },
      {
        name: 'Platform.BLINK',
        signature: 'readonly BLINK: boolean',
        description:
          '当前渲染引擎是否为 Blink：window.chrome 或 Intl.v8BreakIterator 存在、CSS 全局可用，且排除 Edge/Trident。',
      },
      {
        name: 'Platform.WEBKIT',
        signature: 'readonly WEBKIT: boolean',
        description:
          '当前渲染引擎是否为 WebKit：UA 命中 AppleWebKit，且不作为 Blink/EdgeHTML/Trident 的基础。',
      },
      {
        name: 'Platform.IOS',
        signature: 'readonly IOS: boolean',
        description: '当前平台是否为 Apple iOS（iPad/iPhone/iPod），且排除 MSStream 伪装环境。',
      },
      {
        name: 'Platform.FIREFOX',
        signature: 'readonly FIREFOX: boolean',
        description: '当前浏览器是否为 Firefox（含 Minefield 预发布版本）。',
      },
      {
        name: 'Platform.ANDROID',
        signature: 'readonly ANDROID: boolean',
        description: '当前平台是否为 Android；Trident 移动版 UA 伪造的 android 会被排除。',
      },
      {
        name: 'Platform.SAFARI',
        signature: 'readonly SAFARI: boolean',
        description: '当前浏览器是否为 Safari：UA 同时命中 safari 关键字与 WebKit 引擎。',
      },
    ],
  },
  {
    title: '环境检测',
    rows: [
      {
        name: 'isBrowser',
        signature: 'isBrowser(): boolean',
        description: '是否运行在浏览器环境（window 与 document 均存在）。SSR 期间调用安全，返回 false。',
      },
      {
        name: 'supportsPopover',
        signature: 'supportsPopover(): boolean',
        description: '是否支持原生 Popover API（以 body.showPopover 是否存在判定）；不支持时 overlay 自动降级为容器渲染。',
      },
      {
        name: 'supportsShadowDom',
        signature: 'supportsShadowDom(): boolean',
        description: '是否支持 Shadow DOM；结果按进程缓存，避免重复探测。',
      },
      {
        name: 'supportsPassiveEventListeners',
        signature: 'supportsPassiveEventListeners(): boolean',
        description: '是否支持 passive 事件监听器（options.passive）；结果缓存。',
      },
      {
        name: 'supportsScrollBehavior',
        signature: 'supportsScrollBehavior(): boolean',
        description: '是否支持 scrollTo 的 behavior 选项；结果缓存。',
      },
      {
        name: 'getSupportedInputTypes',
        signature: 'getSupportedInputTypes(): Set<string>',
        description:
          '返回当前浏览器支持的 <input> type 集合：逐项设置临时 input 的 type 并验证赋值是否生效；结果缓存。SSR 下返回完整候选集（与 Angular 一致）。',
      },
      {
        name: 'isTestEnvironment',
        signature: 'isTestEnvironment(): boolean',
        description:
          '是否运行在测试环境：检测 __karma__ / jasmine / jest / Mocha 全局标记。对应 Angular CDK 的 _isTestEnvironment。',
      },
      {
        name: 'getRtlScrollAxisType',
        signature: 'getRtlScrollAxisType(): RtlScrollAxisType',
        description: '探测当前浏览器在 RTL 模式下处理水平滚动轴的方式（NORMAL/NEGATED/INVERTED），结果缓存，供虚拟滚动与 Scrollable 归一化测量。',
      },
    ],
  },
  {
    title: '事件与焦点工具',
    rows: [
      {
        name: 'getEventTarget',
        signature: 'getEventTarget(event: Event): HTMLElement | null',
        description: '从事件中提取目标元素，兼容原生 Event 与合成事件对象。',
      },
      {
        name: 'getEventTargetPierceShadowDom',
        signature: 'getEventTargetPierceShadowDom<T extends EventTarget>(event: Event): T | null',
        description: '从事件中提取目标元素，优先使用 composedPath 穿透 Shadow DOM；事件重放等场景抛错时回退到 event.target。',
      },
      {
        name: 'getFocusedElementPierceShadowDom',
        signature: 'getFocusedElementPierceShadowDom(): HTMLElement | null',
        description: '获取当前聚焦元素，并穿透 Shadow DOM 边界逐层下钻。',
      },
      {
        name: 'getShadowRoot',
        signature: 'getShadowRoot(element: HTMLElement): ShadowRoot | null',
        description: '获取元素所在的 ShadowRoot；元素不在 Shadow DOM 中或环境不支持时返回 null。',
      },
      {
        name: 'hasModifierKey',
        signature: 'hasModifierKey(event: KeyboardEvent, ...modifiers: ModifierKey[]): boolean',
        description:
          '判断事件是否按下了修饰键：不传修饰键时任意修饰键按下即为 true；传入一个或多个修饰键时，仅当其中至少一个按下才为 true。',
      },
      {
        name: 'normalizePassiveListenerOptions',
        signature: 'normalizePassiveListenerOptions(options: AddEventListenerOptions): AddEventListenerOptions | boolean',
        description: '归一化事件监听选项：不支持 passive 的浏览器退回布尔 capture，避免在不支持 options 参数的环境抛错。',
      },
    ],
  },
  {
    title: '类型与常量',
    rows: [
      {
        name: 'ModifierKey',
        signature: "type ModifierKey = 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey'",
        description: '修饰键名称，用于按名称判断按键状态。',
      },
      {
        name: 'RtlScrollAxisType',
        signature: 'enum RtlScrollAxisType { NORMAL, NEGATED, INVERTED }',
        description:
          'RTL 滚动轴类型枚举：NORMAL 为 Chrome 行为（scrollLeft 0..max），NEGATED 为 Firefox/Safari 行为（负数起始），INVERTED 为旧版 IE/Edge 行为。',
      },
    ],
  },
];
