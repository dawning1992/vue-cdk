import dialogCss from './styles/dialog.css?inline';

let injected = false;
let cleanup: (() => void) | undefined;

/**
 * 将 dialog 结构样式注入页面（幂等）。
 *
 * 与 Angular CDK 样式加载器语义一致：使用者无需显式引入 css 即可正常工作；
 * 若通过 bundler 引入 `vue-cdk/dialog/style.css`，重复注入由浏览器按相同
 * 样式文本去重，不会产生副作用。
 */
export function injectDialogStyles(): void {
  if (injected || typeof document === 'undefined') {
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-vcdk-dialog', '');
  style.textContent = dialogCss;
  document.head.appendChild(style);
  injected = true;
  cleanup = () => style.remove();
}

/** 移除注入的样式（主要供测试与热更新场景使用）。 */
export function removeInjectedDialogStyles(): void {
  cleanup?.();
  injected = false;
  cleanup = undefined;
}

/** 导出的样式字符串，便于需要手动注入的使用场景。 */
export {dialogCss as vcdkDialogStyles};
