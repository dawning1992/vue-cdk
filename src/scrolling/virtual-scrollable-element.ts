/**
 * 元素虚拟滚动容器适配，对应 Angular CDK 的 CdkVirtualScrollableElement。
 *
 * 使用方式：在作为滚动容器的祖先元素上挂载 `vVirtualScrollableElement`，
 * 后代 `VVirtualScrollViewport` 会自动发现它并以其为滚动容器，
 * 实现「视口只负责渲染、父容器负责滚动」的分离布局。
 */

import type {Directive} from 'vue';
import {VirtualScrollable} from './virtual-scrollable';

/** 元素虚拟滚动容器。 */
export class VirtualScrollableElement extends VirtualScrollable {
  /**
   * 返回元素文档坐标减去滚动偏移，得到滚动前的布局坐标。
   * 这样视口偏移测量不受容器当前滚动位置影响。
   */
  override measureBoundingClientRectWithScrollOffset(
    from: 'left' | 'top' | 'right' | 'bottom',
  ): number {
    return (
      this.getElement().getBoundingClientRect()[from] - this.measureScrollOffset(from)
    );
  }
}

/** vVirtualScrollableElement 指令在元素上保存的滚动容器实例。 */
const VIRTUAL_SCROLLABLE_STATE = Symbol('vcdk-virtual-scrollable-element');

type ScrollableElement = HTMLElement & {[VIRTUAL_SCROLLABLE_STATE]?: VirtualScrollableElement};

/**
 * 声明式外部滚动容器指令，对应 Angular 的 `cdkVirtualScrollingElement`。
 * 挂载后注册到 ScrollDispatcher，并供后代虚拟滚动视口发现使用。
 */
export const vVirtualScrollableElement: Directive<HTMLElement> = {
  mounted(el: ScrollableElement) {
    const scrollable = new VirtualScrollableElement(() => el);
    scrollable.attach();
    el[VIRTUAL_SCROLLABLE_STATE] = scrollable;
  },
  unmounted(el: ScrollableElement) {
    el[VIRTUAL_SCROLLABLE_STATE]?.destroy();
    delete el[VIRTUAL_SCROLLABLE_STATE];
  },
};

/** 沿父链查找最近的 vVirtualScrollableElement 滚动容器；找不到返回 null。 */
export function findVirtualScrollableElement(
  element: HTMLElement | null,
): VirtualScrollableElement | null {
  let current: HTMLElement | null = element;
  while (current) {
    const scrollable = (current as ScrollableElement)[VIRTUAL_SCROLLABLE_STATE];
    if (scrollable) {
      return scrollable;
    }
    current = current.parentElement;
  }
  return null;
}
