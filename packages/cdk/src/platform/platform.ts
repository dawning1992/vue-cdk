/**
 * 平台能力检测与事件目标提取，供 SSR 环境下的安全判断使用。
 */

import {inject, provide, type InjectionKey} from 'vue';

/** 是否运行在浏览器环境中。 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** 是否支持原生 Popover API（`showPopover` 存在即可判定）。 */
export function supportsPopover(): boolean {
  return isBrowser() && typeof document.body?.showPopover === 'function';
}

/** 从事件中提取目标元素，兼容 `Event` 与合成事件对象。 */
export function getEventTarget(event: Event): HTMLElement | null {
  return event.target as HTMLElement | null;
}

/** 修饰键名称，用于按名称判断按键状态。 */
export type ModifierKey = 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey';

/**
 * 判断事件是否按下了修饰键，签名与 Angular CDK keycodes 一致：
 * 不传修饰键时任意修饰键按下即为 true；传入时仅当其中至少一个按下才为 true。
 * 原有单参调用行为不变，属于非破坏性扩展。
 */
export function hasModifierKey(event: KeyboardEvent, ...modifiers: ModifierKey[]): boolean {
  if (modifiers.length) {
    return modifiers.some(modifier => event[modifier]);
  }

  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

let shadowDomIsSupported: boolean | undefined;

/** 当前浏览器是否支持 Shadow DOM（结果缓存，避免重复探测）。 */
export function supportsShadowDom(): boolean {
  if (shadowDomIsSupported == null) {
    const head = typeof document !== 'undefined' ? document.head : null;
    shadowDomIsSupported = !!(
      head &&
      ((head as unknown as {createShadowRoot?: unknown}).createShadowRoot || head.attachShadow)
    );
  }

  return shadowDomIsSupported;
}

/** 获取元素所在的 ShadowRoot；元素不在 Shadow DOM 中时返回 null。 */
export function getShadowRoot(element: HTMLElement): ShadowRoot | null {
  if (!supportsShadowDom()) {
    return null;
  }

  const rootNode = element.getRootNode ? element.getRootNode() : null;

  // supportsShadowDom 已挡掉不支持的环境，这里再兜底一次防止 polyfill 不一致。
  if (typeof ShadowRoot !== 'undefined' && ShadowRoot && rootNode instanceof ShadowRoot) {
    return rootNode;
  }

  return null;
}

/** 获取当前聚焦元素，并穿透 Shadow DOM 边界逐层下钻。 */
export function getFocusedElementPierceShadowDom(): HTMLElement | null {
  let activeElement =
    typeof document !== 'undefined' && document
      ? (document.activeElement as HTMLElement | null)
      : null;

  while (activeElement && activeElement.shadowRoot) {
    const nextActiveElement = activeElement.shadowRoot.activeElement as HTMLElement | null;
    if (nextActiveElement === activeElement) {
      break;
    }
    activeElement = nextActiveElement;
  }

  return activeElement;
}

/**
 * 从事件中提取目标元素，优先使用 composedPath 以穿透 Shadow DOM。
 * composedPath 在事件重放等场景可能抛错，此时回退到 event.target。
 */
export function getEventTargetPierceShadowDom<T extends EventTarget>(event: Event): T | null {
  if (event.composedPath) {
    try {
      const path = event.composedPath();
      // jsdom 等环境中 composedPath 可能返回空数组，此时回退到 event.target。
      if (path.length) {
        return path[0] as T | null;
      }
    } catch {
      // 事件重放期间调用可能抛错，按 Angular CDK 的处理回退。
    }
  }

  return event.target as T | null;
}

let supportsPassiveEvents: boolean | undefined;

/** 当前浏览器是否支持 passive 事件监听器（结果缓存）。 */
export function supportsPassiveEventListeners(): boolean {
  if (supportsPassiveEvents == null && typeof window !== 'undefined') {
    try {
      window.addEventListener(
        'test',
        null!,
        Object.defineProperty({}, 'passive', {
          get: () => (supportsPassiveEvents = true),
        }),
      );
    } finally {
      supportsPassiveEvents = supportsPassiveEvents || false;
    }
  }

  return supportsPassiveEvents === true;
}

/**
 * 归一化事件监听选项：不支持 passive 的浏览器退回布尔 capture，
 * 避免在不支持 options 参数的环境中抛错。
 */
export function normalizePassiveListenerOptions(
  options: AddEventListenerOptions,
): AddEventListenerOptions | boolean {
  return supportsPassiveEventListeners() ? options : !!options.capture;
}

/** Platform 构造选项。 */
export interface PlatformOptions {
  /**
   * 覆盖浏览器识别使用的 User-Agent 字符串。
   * 非浏览器环境（SSR）或单测中可显式注入，避免依赖 navigator.userAgent。
   */
  userAgent?: string;
}

/**
 * V8 Break Iterator 能力标记，用于 BLINK 引擎检测。
 *
 * 访问 `Intl` 必须放在 try/catch 中：部分旧版 IE 在应用提供 polyfill 的 Map 时，
 * 访问 Intl 会直接抛错。参见 Angular 的同类处理：
 * https://github.com/Microsoft/ChakraCore/issues/3189
 * https://github.com/angular/components/issues/15687
 */
function hasV8BreakIterator(): boolean {
  try {
    return (
      typeof Intl !== 'undefined' &&
      !!(Intl as unknown as {v8BreakIterator?: unknown}).v8BreakIterator
    );
  } catch {
    return false;
  }
}

/**
 * 平台检测服务，对应 Angular CDK 的 `Platform`。
 *
 * 所有标志在构造时对当前环境做一次快照，之后不再变化（与 Angular 一致）；
 * 需要响应式追踪时由调用方自行用 `reactive()` 包装。非浏览器环境下
 * `isBrowser` 为 false，且所有浏览器/引擎标志均为 false。
 */
export class Platform {
  /** 是否运行在浏览器环境（window 与 document 均存在）。 */
  readonly isBrowser: boolean;

  /** 当前浏览器是否为 Microsoft Edge。 */
  readonly EDGE: boolean;

  /** 当前渲染引擎是否为 Microsoft Trident（旧版 IE）。 */
  readonly TRIDENT: boolean;

  /** 当前渲染引擎是否为 Blink（Chrome/Chromium 系）；EdgeHTML 与 Trident 排除在外。 */
  readonly BLINK: boolean;

  /** 当前渲染引擎是否为 WebKit；仅当独立运行时成立，不作为 Blink/EdgeHTML/Trident 的基础。 */
  readonly WEBKIT: boolean;

  /** 当前平台是否为 Apple iOS（iPad/iPhone/iPod，且排除模拟 MSStream 的伪装环境）。 */
  readonly IOS: boolean;

  /** 当前浏览器是否为 Firefox（含 Minefield 预发布版本）。 */
  readonly FIREFOX: boolean;

  /** 当前平台是否为 Android；Trident 移动版会在 UA 中伪造 android 以绕过检测，需排除。 */
  readonly ANDROID: boolean;

  /** 当前浏览器是否为 Safari；必须同时命中 Safari 关键字与 WebKit 引擎。 */
  readonly SAFARI: boolean;

  /**
   * 构造平台实例。
   * @param options.userAgent 用于识别的 User-Agent；缺省时浏览器环境下读取
   *   `navigator.userAgent`，非浏览器环境视为空字符串。
   */
  constructor(options: PlatformOptions = {}) {
    this.isBrowser = isBrowser();

    const userAgent =
      options.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');

    this.EDGE = this.isBrowser && /(edge)/i.test(userAgent);
    this.TRIDENT = this.isBrowser && /(msie|trident)/i.test(userAgent);
    this.BLINK =
      this.isBrowser &&
      !!((window as Window & {chrome?: unknown}).chrome || hasV8BreakIterator()) &&
      typeof CSS !== 'undefined' &&
      !this.EDGE &&
      !this.TRIDENT;
    this.WEBKIT =
      this.isBrowser &&
      /AppleWebKit/i.test(userAgent) &&
      !this.BLINK &&
      !this.EDGE &&
      !this.TRIDENT;
    this.IOS =
      this.isBrowser &&
      /iPad|iPhone|iPod/.test(userAgent) &&
      !('MSStream' in window);
    this.FIREFOX = this.isBrowser && /(firefox|minefield)/i.test(userAgent);
    this.ANDROID = this.isBrowser && /android/i.test(userAgent) && !this.TRIDENT;
    this.SAFARI = this.isBrowser && /safari/i.test(userAgent) && this.WEBKIT;
  }
}

/** 创建平台实例；SSR 或单测中可传入固定 UA 覆盖检测结果。 */
export function createPlatform(options?: PlatformOptions): Platform {
  return new Platform(options);
}

/**
 * 全局平台单例，模块导入时按当前环境构建。
 * 需要在 SSR 环境下覆盖检测结果时，请改用 `createPlatform` + `providePlatform` 注入。
 */
export const platform: Platform = createPlatform();

/**
 * Platform 实例的注入键，对应 Angular `PlatformModule` 的依赖提供语义。
 * App 级提供：`app.provide(CDK_PLATFORM, platform)`。
 */
export const CDK_PLATFORM: InjectionKey<Platform> = Symbol('CDK_PLATFORM');

/**
 * 在组件 setup 中向下提供 Platform 实例。
 * @param instance 提供的实例；缺省为全局单例。传入 `createPlatform` 实例可覆盖
 *   UA 检测结果（如 iframe、SSR 注入）。
 * @returns 实际提供的实例。
 */
export function providePlatform(instance: Platform = platform): Platform {
  provide(CDK_PLATFORM, instance);
  return instance;
}

/**
 * 获取当前作用域下的 Platform 实例（组合式入口）。
 * 必须在组件 setup 期间调用；组件链上未 provide 时回退全局单例。
 * setup 之外的场景请直接使用导出的 `platform` 单例。
 */
export function usePlatform(): Platform {
  return inject(CDK_PLATFORM, null) ?? platform;
}
