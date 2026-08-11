/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：Platform 服务 → isBrowser() 探测；DOM 类名/标记使用 vcdk-* 前缀。
 */

/**
 * 元素交互性检查工具，移植自 Angular CDK 的 InteractivityChecker。
 *
 * 该实现参考 ally.js 的辅助方法，仅覆盖受支持浏览器下的常见边界情况，
 * 不做完整规范实现（例如被 overflow 裁剪或移出视口的元素仍视为可见）。
 */

import {isBrowser} from '../../platform';

/** isFocusable 的配置项。 */
export class IsFocusableConfig {
  /** 即使元素当前不可见，也按可聚焦处理。 */
  ignoreVisibility = false;
}

/** 检查元素的 disabled 状态（仅覆盖常见场景）。 */
export class InteractivityChecker {
  /**
   * 元素是否带 disabled 属性。
   * 不覆盖"非表单控件带 disabled 属性"或"表单控件处于禁用表单内"等特殊情况。
   */
  isDisabled(element: HTMLElement): boolean {
    return element.hasAttribute('disabled');
  }

  /**
   * 元素是否可见：要求有几何尺寸且 computed visibility 为 visible。
   * 不覆盖被父级 overflow 裁剪或位于视口外的情况。
   */
  isVisible(element: HTMLElement): boolean {
    return hasGeometry(element) && getComputedStyle(element).visibility === 'visible';
  }

  /**
   * 元素是否可通过 Tab 键到达。
   * 前置条件：调用方应先用 isFocusable 判断（本方法不再重复可见性检查）。
   */
  isTabbable(element: HTMLElement): boolean {
    // 服务端无 Tab 概念，直接返回 false。
    if (!isBrowser()) {
      return false;
    }

    const frameElement = getFrameElement(getWindow(element));

    if (frameElement) {
      // frame 元素会把自身 tabindex 继承给所有子元素。
      if (getTabIndexValue(frameElement) === -1) {
        return false;
      }

      // 浏览器不允许聚焦到不可见 frame 内部的元素。
      if (!this.isVisible(frameElement)) {
        return false;
      }
    }

    const nodeName = element.nodeName.toLowerCase();
    const tabIndexValue = getTabIndexValue(element);

    if (element.hasAttribute('contenteditable')) {
      return tabIndexValue !== -1;
    }

    if (nodeName === 'iframe' || nodeName === 'object') {
      // frame/object 的内容是否可聚焦取决于其内部实现，无法可靠探测，一律视为不可 Tab。
      return false;
    }

    // iOS 下浏览器只把特定元素视为可 Tab。
    if (isIos() && !isPotentiallyTabbableIOS(element)) {
      return false;
    }

    if (nodeName === 'audio') {
      // 无 controls 的 audio 永远不可 Tab，无论 tabindex 如何设置。
      if (!element.hasAttribute('controls')) {
        return false;
      }
      // 有 controls 的 audio 默认可 Tab，除非显式 tabindex="-1"。
      return tabIndexValue !== -1;
    }

    if (nodeName === 'video') {
      // 显式 tabindex="-1" 时不可 Tab。
      if (tabIndexValue === -1) {
        return false;
      }
      // 显式设置了非 -1 的 tabindex 时总是可 Tab。
      if (tabIndexValue !== null) {
        return true;
      }
      // 未设置 tabindex 时，video 仅在 Firefox 或带 controls 时可 Tab。
      return isFirefox() || element.hasAttribute('controls');
    }

    return element.tabIndex >= 0;
  }

  /**
   * 元素是否可被用户聚焦（按开销从低到高依次检查）。
   * 注意：naive 实现，不覆盖所有浏览器怪癖。
   */
  isFocusable(element: HTMLElement, config?: IsFocusableConfig): boolean {
    return (
      isPotentiallyFocusable(element) &&
      !this.isDisabled(element) &&
      (config?.ignoreVisibility || this.isVisible(element))
    );
  }
}

let iosPlatform: boolean | undefined;
let firefoxPlatform: boolean | undefined;

/** 是否运行在 iOS（UA 探测，结果缓存）。 */
function isIos(): boolean {
  if (iosPlatform == null) {
    iosPlatform = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }
  return iosPlatform;
}

/** 是否运行在 Firefox（UA 探测，结果缓存）。 */
function isFirefox(): boolean {
  if (firefoxPlatform == null) {
    firefoxPlatform = /Firefox/.test(navigator.userAgent);
  }
  return firefoxPlatform;
}

/**
 * 获取 window.frameElement，跨源访问可能抛错（如 Edge），
 * 因此必须 try/catch 后再使用。
 */
function getFrameElement(window: Window): HTMLElement | null {
  try {
    return window.frameElement as HTMLElement | null;
  } catch {
    return null;
  }
}

/** 元素是否有几何尺寸（沿用 jQuery 的隐藏元素判断逻辑）。 */
function hasGeometry(element: HTMLElement): boolean {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    (typeof element.getClientRects === 'function' && element.getClientRects().length)
  );
}

/** 是否为原生表单元素。 */
function isNativeFormElement(element: Node): boolean {
  const nodeName = element.nodeName.toLowerCase();
  return (
    nodeName === 'input' ||
    nodeName === 'select' ||
    nodeName === 'button' ||
    nodeName === 'textarea'
  );
}

/** 是否为 `<input type="hidden">`。 */
function isHiddenInput(element: HTMLElement): boolean {
  return isInputElement(element) && element.type === 'hidden';
}

/** 是否为带 href 的锚点。 */
function isAnchorWithHref(element: HTMLElement): boolean {
  return isAnchorElement(element) && element.hasAttribute('href');
}

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName.toLowerCase() === 'input';
}

function isAnchorElement(element: HTMLElement): element is HTMLAnchorElement {
  return element.nodeName.toLowerCase() === 'a';
}

/** 是否带合法 tabindex 属性。 */
function hasValidTabIndex(element: HTMLElement): boolean {
  if (!element.hasAttribute('tabindex') || element.tabIndex === undefined) {
    return false;
  }

  const tabIndex = element.getAttribute('tabindex');
  return !!(tabIndex && !isNaN(parseInt(tabIndex, 10)));
}

/**
 * 读取属性中的 tabindex 值（而非浏览器计算后的默认值）。
 * 无合法 tabindex 时返回 null。
 */
function getTabIndexValue(element: HTMLElement): number | null {
  if (!hasValidTabIndex(element)) {
    return null;
  }

  // Gecko 下 parseInt 可能产生异常值，见 https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
  const tabIndex = parseInt(element.getAttribute('tabindex') || '', 10);
  return isNaN(tabIndex) ? -1 : tabIndex;
}

/** iOS 下被认为可 Tab 的元素类型。 */
function isPotentiallyTabbableIOS(element: HTMLElement): boolean {
  const nodeName = element.nodeName.toLowerCase();
  const inputType = nodeName === 'input' && (element as HTMLInputElement).type;

  return (
    inputType === 'text' ||
    inputType === 'password' ||
    nodeName === 'select' ||
    nodeName === 'textarea'
  );
}

/** 不考虑可见/禁用状态时，元素是否潜在可聚焦。 */
function isPotentiallyFocusable(element: HTMLElement): boolean {
  // input 除非 type="hidden"，否则潜在可聚焦。
  if (isHiddenInput(element)) {
    return false;
  }

  return (
    isNativeFormElement(element) ||
    isAnchorWithHref(element) ||
    element.hasAttribute('contenteditable') ||
    hasValidTabIndex(element)
  );
}

/** 获取元素所属窗口（ownerDocument 为空时回退到全局 window）。 */
function getWindow(node: HTMLElement): Window {
  return (node.ownerDocument && node.ownerDocument.defaultView) || window;
}
