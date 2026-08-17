import textFieldCss from './styles/text-field.css?inline';

let injected = false;
let cleanup: (() => void) | undefined;

/** 将 text-field 必需的测量与自动填充探针样式注入当前文档；重复调用不会重复插入。 */
export function injectTextFieldStyles(): void {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-vcdk-text-field', '');
  style.textContent = textFieldCss;
  document.head.appendChild(style);
  injected = true;
  cleanup = () => style.remove();
}

/** 移除自动注入的样式并重置状态，主要用于测试与热更新。 */
export function removeInjectedTextFieldStyles(): void {
  cleanup?.();
  cleanup = undefined;
  injected = false;
}

/** text-field 结构样式源码，供需要自行处理 CSP nonce 的调用方使用。 */
export {textFieldCss as vcdkTextFieldStyles};
