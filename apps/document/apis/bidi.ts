import type {ApiGroup} from '../api';

/** bidi 模块 API：方向上下文、局部容器、组合式入口与解析工具。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '组件', titleEn: 'Components',
    rows: [
      {
        name: 'VDir / Dir',
        signature: 'Component<{dir?: string; as?: string | Component}>',
        default: 'dir="ltr", as="div"',
        description: '局部方向容器。原样写入 dir 属性，并向后代提供归一化 Directionality；Dir 是贴近 Angular API 的别名。自定义 as 组件必须透传 dir 属性。',
        descriptionEn: 'Local direction container. Writes the dir attribute as provided and supplies normalized Directionality to descendants; Dir is an Angular-compatible alias. Custom as components must forward dir.',
      },
      {
        name: 'VDir dirChange',
        signature: '(direction: Direction) => void',
        description: '初始渲染不触发；之后仅在归一化方向真实变化时同步触发。',
        descriptionEn: 'Does not fire during initial rendering; afterward it fires only when the normalized direction actually changes.',
      },
      {
        name: 'VDir default slot',
        signature: '{direction: Direction; directionality: Directionality}',
        description: '默认插槽获得当前方向和完整上下文；组件公开实例同样暴露 Directionality 契约。',
        descriptionEn: 'The default slot receives the current direction and full context; the public component instance exposes the same Directionality contract.',
      },
    ],
  },
  {
    title: 'Composition API', titleEn: 'Composition API',
    rows: [
      {
        name: 'useDirectionality',
        signature: 'useDirectionality(): Directionality',
        description: '在 setup 中读取最近 provider；没有 provider 时读取 DIR_DOCUMENT，按 body.dir、html.dir、ltr 回退。回退实例不会自动观察 document 属性。',
        descriptionEn: 'Reads the nearest provider in setup. Without one, reads DIR_DOCUMENT and falls back through body.dir, html.dir, and ltr. The fallback instance does not observe document attributes automatically.',
      },
      {
        name: 'provideDirectionality',
        signature: 'provideDirectionality(direction: MaybeRefOrGetter<string | null | undefined>): Directionality',
        description: '提供响应式方向上下文，支持 Ref、computed、getter 或普通值，并在当前 Vue 作用域销毁时自动完成事件流。',
        descriptionEn: 'Provides reactive direction context from a Ref, computed value, getter, or plain value, and completes its event stream when the current Vue scope is disposed.',
      },
      {
        name: 'CDK_DIRECTIONALITY',
        signature: 'InjectionKey<Directionality>',
        description: '最近方向上下文注入键，可用于 app.provide 或高级自定义容器。',
        descriptionEn: 'Injection key for the nearest direction context, usable with app.provide or advanced custom containers.',
      },
      {
        name: 'DIR_DOCUMENT',
        signature: 'InjectionKey<Document | null>',
        description: '覆盖默认 document，适用于 iframe、测试和 SSR；null 会稳定回退 ltr。',
        descriptionEn: 'Overrides the default document for iframes, tests, and SSR; null consistently falls back to ltr.',
      },
    ],
  },
  {
    title: '类与工具', titleEn: 'Classes and utilities',
    rows: [
      {
        name: 'Directionality',
        signature: 'new Directionality(documentRef?: Document | null, initialValue?: string | null)',
        description: '方向上下文。公开 value、只读 valueSignal、change Emitter、setDirection() 与幂等 destroy()；destroy 后忽略更新。',
        descriptionEn: 'Direction context exposing value, read-only valueSignal, change Emitter, setDirection(), and idempotent destroy(); updates are ignored after destroy.',
      },
      {
        name: 'resolveDirectionality',
        signature: 'resolveDirectionality(rawValue, navigatorLanguage?): Direction',
        description: '大小写不敏感；rtl 返回 rtl，auto 按浏览器语言匹配 RTL locale，其余输入返回 ltr。不根据文本内容推断。',
        descriptionEn: 'Case-insensitive: rtl returns rtl, auto matches the browser language against RTL locales, and all other inputs return ltr. It does not infer direction from text content.',
      },
      {
        name: 'getDirection',
        signature: 'getDirection(element?: HTMLElement | null): Direction',
        description: '即时读取元素最近 dir 祖先，再按 body、html、ltr 回退；供 DOM 测量和事件处理使用，SSR 安全。',
        descriptionEn: 'Immediately reads the nearest dir ancestor, then falls back through body, html, and ltr. Safe for DOM measurement, event handling, and SSR.',
      },
      {name: 'Direction', signature: "'ltr' | 'rtl'", description: '归一化布局方向。', descriptionEn: 'Normalized layout direction.'},
      {name: 'DirectionInput', signature: "Direction | 'auto'", description: '标准方向输入类型；组件运行时仍容忍非法字符串并回退 ltr。', descriptionEn: 'Standard direction input type; components still tolerate invalid strings at runtime and fall back to ltr.'},
    ],
  },
];
