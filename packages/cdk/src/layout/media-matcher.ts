import {Platform, platform} from '../platform';

/** `MediaMatcher` 构造选项，便于 SSR、CSP 与测试环境注入平台能力。 */
export interface MediaMatcherOptions {
  /** 平台快照；缺省使用 platform 模块的全局实例。 */
  platform?: Platform;
  /** 动态兼容样式的 CSP nonce。 */
  nonce?: string | null;
  /** 自定义 matchMedia 实现；SSR 测试或非 Window 宿主可注入。 */
  matchMedia?: (query: string) => MediaQueryList;
}

const registeredCompatibilityQueries = new Set<string>();
let compatibilityStyleNode: HTMLStyleElement | undefined;

/** SSR 下的只读 `matchMedia` 替代实现；空查询与 `all` 按 CSS 语义匹配。 */
function noopMatchMedia(query: string): MediaQueryList {
  return {
    matches: query === '' || query === 'all',
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  };
}

/**
 * 为 WebKit/Blink 注册空媒体规则，规避没有实际 CSS 规则时变更事件不触发的问题。
 * 查询中的花括号会被移除，避免将不可信输入突破 `@media` 规则边界。
 */
function registerCompatibilityRule(query: string, nonce?: string | null): void {
  if (registeredCompatibilityQueries.has(query) || typeof document === 'undefined') return;

  try {
    if (!compatibilityStyleNode) {
      compatibilityStyleNode = document.createElement('style');
      compatibilityStyleNode.type = 'text/css';
      if (nonce) compatibilityStyleNode.setAttribute('nonce', nonce);
      document.head.appendChild(compatibilityStyleNode);
    }
    compatibilityStyleNode.sheet?.insertRule(`@media ${query.replace(/[{}]/g, '')} {body{ }}`, 0);
    registeredCompatibilityQueries.add(query);
  } catch (error) {
    // 非法媒体查询或严格 CSP 可能拒绝插入；matchMedia 本身仍可正常使用。
    console.error(error);
  }
}

/** 对齐 Angular CDK 的媒体查询适配器，浏览器与 SSR 环境均可安全调用。 */
export class MediaMatcher {
  private readonly _platform: Platform;
  private readonly _nonce?: string | null;
  private readonly _matchMedia: (query: string) => MediaQueryList;

  /** 创建适配器；注入的 matchMedia 必须保持原生 `MediaQueryList` 契约。 */
  constructor(options: MediaMatcherOptions = {}) {
    this._platform = options.platform ?? platform;
    this._nonce = options.nonce;
    this._matchMedia =
      options.matchMedia ??
      (this._platform.isBrowser && typeof window.matchMedia === 'function'
        ? window.matchMedia.bind(window)
        : noopMatchMedia);
  }

  /** 计算媒体查询并返回原生兼容的 `MediaQueryList`。 */
  matchMedia(query: string): MediaQueryList {
    if (this._platform.WEBKIT || this._platform.BLINK) {
      registerCompatibilityRule(query, this._nonce);
    }
    return this._matchMedia(query);
  }
}

