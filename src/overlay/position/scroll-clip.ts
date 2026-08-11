/** `DOMRect` 的简化形态，仅保留定位算法所需的几何字段。 */
export type Dimensions = Omit<DOMRect, 'x' | 'y' | 'toJSON'>;

/** 判断元素是否被任一滚动容器完全滚出视口（无任何重叠）。 */
export function isElementScrolledOutsideView(
  element: Dimensions,
  scrollContainers: Dimensions[],
): boolean {
  return scrollContainers.some(containerBounds => {
    const outsideAbove = element.bottom < containerBounds.top;
    const outsideBelow = element.top > containerBounds.bottom;
    const outsideLeft = element.right < containerBounds.left;
    const outsideRight = element.left > containerBounds.right;
    return outsideAbove || outsideBelow || outsideLeft || outsideRight;
  });
}

/** 判断元素是否被任一滚动容器裁剪（部分越界即视为裁剪）。 */
export function isElementClippedByScrolling(
  element: Dimensions,
  scrollContainers: Dimensions[],
): boolean {
  return scrollContainers.some(scrollContainerRect => {
    const clippedAbove = element.top < scrollContainerRect.top;
    const clippedBelow = element.bottom > scrollContainerRect.bottom;
    const clippedLeft = element.left < scrollContainerRect.left;
    const clippedRight = element.right > scrollContainerRect.right;
    return clippedAbove || clippedBelow || clippedLeft || clippedRight;
  });
}
