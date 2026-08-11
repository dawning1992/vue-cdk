import focusTrapCss from './styles/focus-trap.css?inline';

let injected = false;
let cleanup: (() => void) | undefined;

/**
 * 将 a11y 结构样式注入页面（幂等）。
 * 若使用者通过 bundler 引入 `vue-cdk/a11y/style.css`，重复注入由浏览器
 * 按相同样式文本去重，不会产生副作用。
 */
export function injectFocusTrapStyles(): void {
  if (injected || typeof document === 'undefined') {
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-vcdk-a11y', '');
  style.textContent = focusTrapCss;
  document.head.appendChild(style);
  injected = true;
  cleanup = () => style.remove();
}

/** 移除注入的样式（主要供测试与热更新场景使用）。 */
export function removeInjectedFocusTrapStyles(): void {
  cleanup?.();
  injected = false;
  cleanup = undefined;
}

/** 导出的样式字符串，便于需要手动注入的使用场景。 */
export {focusTrapCss as vcdkFocusTrapStyles};
