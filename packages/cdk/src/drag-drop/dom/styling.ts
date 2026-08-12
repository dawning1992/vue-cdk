/**
 * 拖拽相关样式工具，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 */

/** 扩展版 CSSStyleDeclaration，包含拖拽相关但 TS 类型缺失的属性。 */
export interface DragCSSStyleDeclaration extends CSSStyleDeclaration {
  msScrollSnapType: string;
  scrollSnapType: string;
  webkitTapHighlightColor: string;
}

/**
 * 浅扩展样式：source 的键需为连字符命名；值为空时移除该属性。
 * importantProperties 中的属性以 !important 写入。
 */
export function extendStyles(
  dest: CSSStyleDeclaration,
  source: Record<string, string>,
  importantProperties?: Set<string>,
) {
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      const value = source[key];

      if (value) {
        dest.setProperty(key, value, importantProperties?.has(key) ? 'important' : '');
      } else {
        dest.removeProperty(key);
      }
    }
  }

  return dest;
}

/** 切换元素的原生拖拽交互（user-select / touch-action / 拖拽手势）。 */
export function toggleNativeDragInteractions(element: HTMLElement, enable: boolean) {
  const userSelect = enable ? '' : 'none';

  extendStyles(element.style, {
    'touch-action': enable ? '' : 'none',
    '-webkit-user-drag': enable ? '' : 'none',
    '-webkit-tap-highlight-color': enable ? '' : 'transparent',
    'user-select': userSelect,
    '-ms-user-select': userSelect,
    '-webkit-user-select': userSelect,
    '-moz-user-select': userSelect,
  });
}

/** 切换元素可见性（保留尺寸），用于拖拽期间把原条目移出视觉。 */
export function toggleVisibility(
  element: HTMLElement,
  enable: boolean,
  importantProperties?: Set<string>,
) {
  extendStyles(
    element.style,
    {
      position: enable ? '' : 'fixed',
      top: enable ? '' : '0',
      opacity: enable ? '' : '0',
      left: enable ? '' : '-999em',
    },
    importantProperties,
  );
}

/** 拼接本次 transform 与元素原有 transform（none 视为无）。 */
export function combineTransforms(transform: string, initialTransform?: string): string {
  return initialTransform && initialTransform != 'none'
    ? transform + ' ' + initialTransform
    : transform;
}

/** 把目标元素尺寸对齐源矩形，并定位到源矩形左上角。 */
export function matchElementSize(target: HTMLElement, sourceRect: DOMRect): void {
  target.style.width = `${sourceRect.width}px`;
  target.style.height = `${sourceRect.height}px`;
  target.style.transform = getTransform(sourceRect.left, sourceRect.top);
}

/** 生成 translate3d 变换（四舍五入避免子像素模糊）。 */
export function getTransform(x: number, y: number): string {
  return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}
