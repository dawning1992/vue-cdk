/**
 * 拖拽结构样式注入（幂等），模式与 a11y / scrolling 模块一致。
 */

import dragDropCss from './styles/drag-drop.css?inline';

let injected = false;
let cleanup: (() => void) | undefined;

/** 将拖拽结构样式注入页面（幂等）。 */
export function injectDragDropStyles(): void {
  if (injected || typeof document === 'undefined') {
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-vcdk-drag-drop', '');
  style.textContent = dragDropCss;
  document.head.appendChild(style);
  injected = true;
  cleanup = () => style.remove();
}

/** 移除注入的样式（主要供测试与热更新场景使用）。 */
export function removeInjectedDragDropStyles(): void {
  cleanup?.();
  injected = false;
  cleanup = undefined;
}

/** 导出的样式字符串，便于需要手动注入的使用场景。 */
export {dragDropCss as vcdkDragDropStyles};
