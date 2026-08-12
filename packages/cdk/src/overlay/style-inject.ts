import overlayCss from './styles/overlay.css?inline';

let injected = false;
let cleanup: (() => void) | undefined;

/**
 * 将结构样式注入到页面（幂等）。
 *
 * 与 Angular CDK 的样式加载器语义一致：使用者无需显式引入 css 即可正常工作；
 * 若使用者通过 bundler 引入 `vue-cdk/overlay/style.css`，此处重复注入会被样式去重逻辑
 * （浏览器按相同文本去重）自动忽略。
 */
export function injectOverlayStyles(): void {
  if (injected || typeof document === 'undefined') {
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-vcdk-overlay', '');
  style.textContent = overlayCss;
  document.head.appendChild(style);
  injected = true;
  cleanup = () => style.remove();
}

/** 移除注入的样式（主要供测试与热更新场景使用）。 */
export function removeInjectedOverlayStyles(): void {
  cleanup?.();
  injected = false;
  cleanup = undefined;
}

/** 导出的样式字符串，便于需要手动注入的使用场景。 */
export {overlayCss as vcdkOverlayStyles};
