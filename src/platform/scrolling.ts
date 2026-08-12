/**
 * 平台滚动能力检测，对齐 Angular CDK 的 `@angular/cdk/platform` features/scrolling。
 *
 * RTL 环境下 `scrollLeft` 的行为在各浏览器间不一致，虚拟滚动与 Scrollable 的
 * 归一化测量/滚动都依赖这里的结果，因此检测结果会被缓存。
 */

import {isBrowser} from './platform';

/** 浏览器在 RTL 模式下处理水平滚动轴的可能方式。 */
export enum RtlScrollAxisType {
  /**
   * scrollLeft 在完全滚到左侧时为 0，完全滚到右侧时为 (scrollWidth - clientWidth)。
   * 当前 Chrome 属于此类型。
   */
  NORMAL,
  /**
   * scrollLeft 在完全滚到左侧时为 -(scrollWidth - clientWidth)，完全滚到右侧时为 0。
   * 当前 Firefox 与 Safari 属于此类型。
   */
  NEGATED,
  /**
   * scrollLeft 在完全滚到左侧时为 (scrollWidth - clientWidth)，完全滚到右侧时为 0。
   * 旧版 IE/Edge 属于此类型。
   */
  INVERTED,
}

/** RTL 滚动轴类型检测结果缓存；null 表示尚未探测。 */
let rtlScrollAxisType: RtlScrollAxisType | undefined;

/** scroll-behavior 支持检测结果缓存；undefined 表示尚未探测。 */
let scrollBehaviorSupported: boolean | undefined;

/**
 * 当前浏览器是否支持 `scrollTo` 的 `behavior` 选项。
 * 结果按浏览器进程缓存，避免反复探测。
 */
export function supportsScrollBehavior(): boolean {
  if (scrollBehaviorSupported == null) {
    // 非浏览器环境无法探测，直接判定不支持。
    if (!isBrowser()) {
      scrollBehaviorSupported = false;
      return scrollBehaviorSupported;
    }

    // 元素样式支持 scrollBehavior 说明原生能力存在。
    if (document.documentElement?.style && 'scrollBehavior' in document.documentElement.style) {
      scrollBehaviorSupported = true;
    } else {
      const scrollToFunction: Function | undefined = Element.prototype.scrollTo;

      if (scrollToFunction) {
        // 原生实现 toString 会包含 [native code]；被 polyfill 覆盖时没有该标记，
        // 视为支持 scroll behavior（polyfill 通常实现了平滑滚动）。
        scrollBehaviorSupported = !/\{\s*\[native code\]\s*\}/.test(scrollToFunction.toString());
      } else {
        scrollBehaviorSupported = false;
      }
    }
  }

  return scrollBehaviorSupported;
}

/**
 * 探测当前浏览器使用的 RTL 滚动轴类型，结果按浏览器进程缓存。
 *
 * 探测方式：创建一个 1px 宽、dir=rtl 的隐藏滚动容器，内部放 2px 宽内容。
 * RTL 下初始 scrollLeft 应为 1（NORMAL）；为 0 时再尝试写入 1，
 * 写后仍为 0 说明是 NEGATED（越界被钳制），否则为 INVERTED。
 */
export function getRtlScrollAxisType(): RtlScrollAxisType {
  // 非浏览器环境无法探测，按 Angular 的约定假定为 NORMAL。
  if (!isBrowser()) {
    return RtlScrollAxisType.NORMAL;
  }

  if (rtlScrollAxisType == null) {
    const scrollContainer = document.createElement('div');
    const containerStyle = scrollContainer.style;
    scrollContainer.dir = 'rtl';
    containerStyle.width = '1px';
    containerStyle.overflow = 'auto';
    containerStyle.visibility = 'hidden';
    containerStyle.pointerEvents = 'none';
    containerStyle.position = 'absolute';

    const content = document.createElement('div');
    const contentStyle = content.style;
    contentStyle.width = '2px';
    contentStyle.height = '1px';

    scrollContainer.appendChild(content);
    document.body.appendChild(scrollContainer);

    rtlScrollAxisType = RtlScrollAxisType.NORMAL;

    // RTL 视口初始滚到最右侧：NORMAL 浏览器 scrollLeft 应为 1；
    // 为 0 说明属于 NEGATED 或 INVERTED 之一，再写入 1 加以区分。
    if (scrollContainer.scrollLeft === 0) {
      scrollContainer.scrollLeft = 1;
      rtlScrollAxisType =
        scrollContainer.scrollLeft === 0 ? RtlScrollAxisType.NEGATED : RtlScrollAxisType.INVERTED;
    }

    scrollContainer.remove();
  }

  return rtlScrollAxisType;
}
