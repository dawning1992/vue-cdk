/**
 * CSS 过渡时长解析工具，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 */

/** 把 CSS 时间值解析为毫秒（s/ms 后缀兼容）。 */
function parseCssTimeUnitsToMs(value: string): number {
  const multiplier = value.toLowerCase().indexOf('ms') > -1 ? 1 : 1000;
  return parseFloat(value) * multiplier;
}

/** 解析多个逗号分隔的 CSS 属性值。 */
function parseCssPropertyValue(computedStyle: CSSStyleDeclaration, name: string): string[] {
  const value = computedStyle.getPropertyValue(name);
  return value.split(',').map(part => part.trim());
}

/**
 * 获取元素 transform 过渡的总时长（时长 + 延迟）。
 * 无 transform 过渡时返回 0，用于判断是否要等待 transitionend。
 */
export function getTransformTransitionDurationInMs(element: HTMLElement): number {
  const computedStyle = getComputedStyle(element);
  const transitionedProperties = parseCssPropertyValue(computedStyle, 'transition-property');
  const property = transitionedProperties.find(prop => prop === 'transform' || prop === 'all');

  if (!property) {
    return 0;
  }

  const propertyIndex = transitionedProperties.indexOf(property);
  const rawDurations = parseCssPropertyValue(computedStyle, 'transition-duration');
  const rawDelays = parseCssPropertyValue(computedStyle, 'transition-delay');

  return (
    parseCssTimeUnitsToMs(rawDurations[propertyIndex]) +
    parseCssTimeUnitsToMs(rawDelays[propertyIndex])
  );
}
