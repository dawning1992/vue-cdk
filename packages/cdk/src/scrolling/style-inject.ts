/**
 * 虚拟滚动结构样式注入（幂等），模式与 a11y 模块一致。
 * 若使用者通过 bundler 引入 `vue-cdk/scrolling/style.css`，
 * 重复注入由浏览器按相同样式文本去重，不会产生副作用。
 */

import virtualScrollCss from './styles/virtual-scroll-viewport.css?inline';

let injected = false;
let cleanup: (() => void) | undefined;

/** 将虚拟滚动结构样式注入页面（幂等）。 */
export function injectVirtualScrollStyles(): void {
  if (injected || typeof document === 'undefined') {
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-vcdk-scrolling', '');
  style.textContent = virtualScrollCss;
  document.head.appendChild(style);
  injected = true;
  cleanup = () => style.remove();
}

/** 移除注入的样式（主要供测试与热更新场景使用）。 */
export function removeInjectedVirtualScrollStyles(): void {
  cleanup?.();
  injected = false;
  cleanup = undefined;
}

/** 导出的样式字符串，便于需要手动注入的使用场景。 */
export {virtualScrollCss as vcdkVirtualScrollStyles};
