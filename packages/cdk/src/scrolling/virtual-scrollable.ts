/**
 * 虚拟滚动滚动容器抽象，对应 Angular CDK 的 CdkVirtualScrollable。
 * 在 Scrollable 基础上补充视口尺寸与带滚动偏移的边界测量能力。
 */

import type {InjectionKey} from 'vue';
import {Scrollable, type ScrollableTarget} from './scrollable';

/** 注入键：向虚拟滚动视口提供外部滚动容器。 */
export const VIRTUAL_SCROLLABLE: InjectionKey<VirtualScrollable> = Symbol('vcdk-virtual-scrollable');

/** 可作为虚拟滚动滚动容器的对象。 */
export abstract class VirtualScrollable extends Scrollable {
  constructor(element: ScrollableTarget) {
    super(element);
  }

  /**
   * 按方向测量滚动容器可见尺寸。
   * @param orientation 水平取 clientWidth，垂直取 clientHeight。
   */
  measureViewportSize(orientation: 'horizontal' | 'vertical'): number {
    const el = this.getElement();
    return orientation === 'horizontal' ? el.clientWidth : el.clientHeight;
  }

  /**
   * 测量滚动容器指定边的文档坐标（含滚动偏移修正）。
   * @param from 测量边。
   */
  abstract measureBoundingClientRectWithScrollOffset(
    from: 'left' | 'top' | 'right' | 'bottom',
  ): number;
}
