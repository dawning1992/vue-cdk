/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/**
 * 屏幕阅读器伪造事件识别，移植自 Angular CDK。
 *
 * 屏幕阅读器在激活可点击元素时会派发伪造的 mousedown / touchstart，
 * 这些事件应归类为键盘输入，而不是鼠标/触摸输入。
 */

/** 事件是否可能是屏幕阅读器伪造的 mousedown。 */
export function isFakeMousedownFromScreenReader(event: MouseEvent): boolean {
  // event.buttons 在 Firefox 有效但 Chrome 无效；event.detail 相反，
  // 两者任一为零即可判定为伪造事件。
  return event.buttons === 0 || event.detail === 0;
}

/** 事件是否可能是屏幕阅读器伪造的 touchstart。 */
export function isFakeTouchstartFromScreenReader(event: TouchEvent): boolean {
  const touch: Touch | undefined =
    (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);

  // 真实设备 touch.identifier 通常 >= 0，屏幕阅读器为 -1，且 radius 为默认值 1。
  return (
    !!touch &&
    touch.identifier === -1 &&
    (touch.radiusX == null || touch.radiusX === 1) &&
    (touch.radiusY == null || touch.radiusY === 1)
  );
}
