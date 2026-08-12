/**
 * 窗口虚拟滚动容器适配，对应 Angular CDK 的 CdkVirtualScrollableWindow。
 * 通过 `VVirtualScrollViewport` 的 `scrollWindow` 属性启用。
 */

import {VirtualScrollable} from './virtual-scrollable';

/** 窗口虚拟滚动容器：以 documentElement 作为测量元素、document 作为滚动监听目标。 */
export class VirtualScrollableWindow extends VirtualScrollable {
  constructor() {
    super(() => document.documentElement);
    // 窗口滚动事件在 document 上派发，监听目标与测量元素分离。
    this._scrollElement = document;
  }

  /** 窗口文档坐标即布局坐标，无需减去滚动偏移。 */
  override measureBoundingClientRectWithScrollOffset(
    from: 'left' | 'top' | 'right' | 'bottom',
  ): number {
    return document.documentElement.getBoundingClientRect()[from];
  }
}
