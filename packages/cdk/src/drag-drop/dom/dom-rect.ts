/**
 * DOM 矩形工具，移植自 Angular CDK drag-drop（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 */

/** 获取元素包围盒的可修改副本（DOMRect 字段只读且非自有属性）。 */
export function getMutableClientRect(element: Element): DOMRect {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  } as DOMRect;
}

/** 坐标是否落在矩形内（含边界）。 */
export function isInsideClientRect(clientRect: DOMRect, x: number, y: number) {
  const {top, bottom, left, right} = clientRect;
  return y >= top && y <= bottom && x >= left && x <= right;
}

/** 子元素是否在任一方向上溢出父元素。 */
export function isOverflowingParent(parentRect: DOMRect, childRect: DOMRect): boolean {
  const isLeftOverflowing = childRect.left < parentRect.left;
  const isRightOverflowing = childRect.left + childRect.width > parentRect.right;
  const isTopOverflowing = childRect.top < parentRect.top;
  const isBottomOverflowing = childRect.top + childRect.height > parentRect.bottom;

  return isLeftOverflowing || isRightOverflowing || isTopOverflowing || isBottomOverflowing;
}

/**
 * 按差值更新矩形的 top/left 并同步派生 bottom/right。
 * @param domRect 待更新的矩形。
 * @param top 纵向滚动差值。
 * @param left 横向滚动差值。
 */
export function adjustDomRect(
  domRect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  },
  top: number,
  left: number,
) {
  domRect.top += top;
  domRect.bottom = domRect.top + domRect.height;

  domRect.left += left;
  domRect.right = domRect.left + domRect.width;
}

/**
 * 指针是否靠近矩形边缘（阈值按矩形宽高的比例计算）。
 * 用于自动滚动与排序触发的边缘检测。
 */
export function isPointerNearDomRect(
  rect: DOMRect,
  threshold: number,
  pointerX: number,
  pointerY: number,
): boolean {
  const {top, right, bottom, left, width, height} = rect;
  const xThreshold = width * threshold;
  const yThreshold = height * threshold;

  return (
    pointerY > top - yThreshold &&
    pointerY < bottom + yThreshold &&
    pointerX > left - xThreshold &&
    pointerX < right + xThreshold
  );
}
