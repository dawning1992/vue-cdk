/**
 * scrolling 模块入口，对齐 Angular CDK 的 `@angular/cdk/scrolling` public-api。
 *
 * 覆盖能力：ScrollDispatcher（全局滚动分发）、ViewportRuler（视口测量）、
 * Scrollable（cdkScrollable 的 Vue 形态：useScrollable / vScrollable）、
 * 虚拟滚动（VVirtualScrollViewport / VVirtualFor / 固定尺寸策略）。
 */

export {
  DEFAULT_SCROLL_TIME,
  ScrollDispatcher,
  scrollDispatcher,
  type ScrollDispatcherTarget,
} from './scroll-dispatcher';
export {
  DEFAULT_RESIZE_TIME,
  ViewportRuler,
  viewportRuler,
  type ViewportScrollPosition,
} from './viewport-ruler';
export {
  Scrollable,
  useScrollable,
  vScrollable,
  type ExtendedScrollToOptions,
  type ScrollableTarget,
} from './scrollable';
export {
  VIRTUAL_SCROLL_STRATEGY,
  type VirtualScrollStrategy,
  type VirtualScrollViewportAdapter,
  type VirtualScrollItemMeasurement,
} from './virtual-scroll-strategy';
export {FixedSizeVirtualScrollStrategy} from './fixed-size-virtual-scroll';
export {
  AutoSizeVirtualScrollStrategy,
  ItemSizeAverager,
  provideAutoSizeVirtualScrollStrategy,
  type AutoSizeVirtualScrollOptions,
} from './auto-size-virtual-scroll';
export {
  CDK_VIRTUAL_SCROLL_VIEWPORT,
  VVirtualScrollViewport,
  type VirtualScrollViewportApi,
} from './virtual-scroll-viewport';
export {
  VVirtualFor,
  type VirtualForContext,
  type VirtualForSource,
  type VirtualForTrackBy,
} from './virtual-for';
export {
  VirtualScrollableElement,
  vVirtualScrollableElement,
  findVirtualScrollableElement,
} from './virtual-scrollable-element';
export {VirtualScrollableWindow} from './virtual-scrollable-window';
export type {CdkVirtualScrollRepeater} from './virtual-scroll-repeater';
export {injectVirtualScrollStyles, removeInjectedVirtualScrollStyles} from './style-inject';
