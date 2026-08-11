/**
 * 平台能力检测与事件目标提取，供 SSR 环境下的安全判断使用。
 */

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
