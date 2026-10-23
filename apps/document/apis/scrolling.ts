import type {ApiGroup} from '../api';

/** scrolling 模块 API 分组：滚动分发、视口测量、滚动容器与虚拟滚动。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '滚动分发',
    titleEn: 'Scroll dispatching',
    rows: [
      {
        name: 'ScrollDispatcher',
        signature: 'class ScrollDispatcher',
        default: '—',
        description:
          '全局滚动分发器：register/deregister 管理滚动目标（幂等）；scrolled(auditTimeInMs=20) 返回全局滚动流；ancestorScrolled(element) 返回祖先滚动流；getAncestorScrollContainers(element) 返回祖先滚动容器。',
        descriptionEn: 'Global scroll dispatcher. register/deregister manage scroll targets idempotently; scrolled(auditTimeInMs=20) returns the global scroll stream; ancestorScrolled(element) returns an ancestor stream; getAncestorScrollContainers(element) lists ancestor scroll containers.',
      },
      {
        name: 'scrollDispatcher',
        signature: 'const scrollDispatcher = new ScrollDispatcher()',
        description: '滚动分发器模块级单例。',
        descriptionEn: 'Module-level ScrollDispatcher singleton.',
      },
      {
        name: 'DEFAULT_SCROLL_TIME',
        signature: 'const DEFAULT_SCROLL_TIME = 20',
        description: '默认滚动节流间隔（毫秒），与 Angular 一致。',
        descriptionEn: 'Default scroll throttling interval in milliseconds, matching Angular.',
      },
      {
        name: 'ScrollDispatcherTarget',
        signature: 'interface ScrollDispatcherTarget { elementScrolled(): Emitter<Event>; getElementRef(): { nativeElement: HTMLElement } }',
        description: '可注册到分发器的滚动目标契约，Scrollable 即实现该接口。',
        descriptionEn: 'Contract for scroll targets that can be registered with the dispatcher. Scrollable implements this interface.',
      },
    ],
  },
  {
    title: '视口测量',
    titleEn: 'Viewport measurement',
    rows: [
      {
        name: 'ViewportRuler',
        signature: 'class ViewportRuler',
        description:
          '视口几何信息工具：getViewportSize()（缓存到下次变化）、getViewportRect()、getViewportScrollPosition()；viewportChange 事件流覆盖 resize 与 orientationchange。',
        descriptionEn: 'Viewport geometry utilities: getViewportSize() is cached until the next change; getViewportRect() and getViewportScrollPosition() return current measurements. The viewportChange stream covers resize and orientationchange.',
      },
      {
        name: 'viewportRuler',
        signature: 'const viewportRuler = new ViewportRuler()',
        description: '视口测量工具模块级单例。',
        descriptionEn: 'Module-level ViewportRuler singleton.',
      },
      {
        name: 'DEFAULT_RESIZE_TIME',
        signature: 'const DEFAULT_RESIZE_TIME = 20',
        description: '默认视口变化节流间隔（毫秒）。',
        descriptionEn: 'Default viewport-change throttling interval in milliseconds.',
      },
      {
        name: 'ViewportScrollPosition',
        signature: 'interface ViewportScrollPosition { top: number; left: number }',
        description: '视口滚动位置。',
        descriptionEn: 'Viewport scroll position.',
      },
    ],
  },
  {
    title: '滚动容器',
    titleEn: 'Scrollable containers',
    rows: [
      {
        name: 'Scrollable',
        signature: 'class Scrollable implements ScrollDispatcherTarget',
        description:
          '滚动容器能力：attach() 开始监听并注册到分发器、destroy() 停止并注销（均幂等）；elementScrolled() 返回滚动流；scrollTo(options) 支持 top/bottom/left/right/start/end 互斥组；measureScrollOffset(from) 做 RTL 归一化测量。',
        descriptionEn: 'Scrollable container API. attach() starts listening and registers with the dispatcher; destroy() stops and deregisters (both are idempotent). elementScrolled() returns a stream; scrollTo(options) supports mutually exclusive top/bottom and left/right/start/end groups; measureScrollOffset(from) normalizes RTL measurements.',
      },
      {
        name: 'useScrollable',
        signature: 'useScrollable(target: ScrollableTarget, dispatcher?: ScrollDispatcher): Scrollable',
        description: '组合式绑定滚动容器：在组件 setup 中传入元素/ref/解析函数，组件卸载时自动注销。',
        descriptionEn: 'Composable scroll-container binding. Pass an element, ref, or resolver during component setup; it deregisters automatically when the component unmounts.',
      },
      {
        name: 'vScrollable',
        signature: 'directive vScrollable',
        description: '声明式滚动容器指令，对应 Angular cdkScrollable：挂载时自动注册到分发器，卸载时自动清理。',
        descriptionEn: 'Declarative scroll-container directive corresponding to Angular cdkScrollable. Registers with the dispatcher on mount and cleans up on unmount.',
      },
      {
        name: 'ScrollableTarget',
        signature: 'type ScrollableTarget = HTMLElement | Ref<HTMLElement | null | undefined> | (() => HTMLElement | null)',
        description: '可解析为滚动元素的输入。',
        descriptionEn: 'Input that can be resolved to a scroll element.',
      },
      {
        name: 'ExtendedScrollToOptions',
        signature: 'type ExtendedScrollToOptions = _XAxis & _YAxis & ScrollOptions',
        description: '扩展版 ScrollToOptions：top/bottom 互斥、left/right/start/end 互斥，start/end 按方向映射（RTL 兼容）。',
        descriptionEn: 'Extended ScrollToOptions. top/bottom are mutually exclusive, as are left/right/start/end; start/end map according to direction, including RTL.',
      },
      {
        name: '_XAxis',
        signature: 'type _XAxis = _XOR<_XOR<_Left, _Right>, _XOR<_Start, _End>>',
        description: '水平滚动轴选项：left/right/start/end 中至多一个生效（互斥组合）。',
        descriptionEn: 'Horizontal-axis options: at most one of left/right/start/end may be provided.',
      },
      {
        name: '_YAxis',
        signature: 'type _YAxis = _XOR<_Top, _Bottom>',
        description: '垂直滚动轴选项：top/bottom 互斥。',
        descriptionEn: 'Vertical-axis options, where top and bottom are mutually exclusive.',
      },
      {
        name: '_XOR',
        signature: 'type _XOR<T, U> = (_Without<T> & U) | (_Without<U> & T)',
        description: '互斥联合类型工具：只允许 T 或 U 中的一侧提供字段，另一侧必须缺省。',
        descriptionEn: 'Exclusive-union type helper: fields may be provided by either T or U, while the other side must be omitted.',
      },
      {
        name: '_Without',
        signature: 'type _Without<T> = {[P in keyof T]?: never}',
        description: '把 T 的全部字段置为「可选且永不允许」，配合 _XOR 实现字段互斥。',
        descriptionEn: 'Makes every field in T optional but forbidden, and is used by _XOR to enforce mutually exclusive fields.',
      },
      {
        name: '_Top',
        signature: 'type _Top = {top?: number}',
        description: 'top 滚动偏移选项。',
        descriptionEn: 'Scroll offset option from the top edge.',
      },
      {
        name: '_Bottom',
        signature: 'type _Bottom = {bottom?: number}',
        description: 'bottom 滚动偏移选项（相对容器底部的偏移）。',
        descriptionEn: 'Scroll offset option relative to the container bottom edge.',
      },
      {
        name: '_Left',
        signature: 'type _Left = {left?: number}',
        description: 'left 滚动偏移选项。',
        descriptionEn: 'Scroll offset option from the left edge.',
      },
      {
        name: '_Right',
        signature: 'type _Right = {right?: number}',
        description: 'right 滚动偏移选项（相对容器右侧的偏移）。',
        descriptionEn: 'Scroll offset option relative to the container right edge.',
      },
      {
        name: '_Start',
        signature: 'type _Start = {start?: number}',
        description: 'start 滚动偏移选项：LTR 下等同 left，RTL 下等同 right。',
        descriptionEn: 'Scroll offset from the start edge: equivalent to left in LTR and right in RTL.',
      },
      {
        name: '_End',
        signature: 'type _End = {end?: number}',
        description: 'end 滚动偏移选项：LTR 下等同 right，RTL 下等同 left。',
        descriptionEn: 'Scroll offset from the end edge: equivalent to right in LTR and left in RTL.',
      },
    ],
  },
  {
    title: '虚拟滚动（组件）',
    titleEn: 'Virtual scrolling (components)',
    rows: [
      {
        name: 'VVirtualScrollViewport',
        signature: 'component VVirtualScrollViewport',
        default: '—',
        description:
          '虚拟滚动视口。props：orientation、appendOnly、scrollWindow、itemSize、autosize、estimatedItemSize（默认 50）、minBufferPx（默认 100）、maxBufferPx（默认 200）。autosize 与 itemSize 互斥且首版仅支持纵向；emits：scrolledIndexChange。模板 ref 暴露 scrollToIndex/scrollToOffset。',
        descriptionEn: 'Virtual scrolling viewport. Props: orientation, appendOnly, scrollWindow, itemSize, autosize, estimatedItemSize (default 50), minBufferPx (default 100), and maxBufferPx (default 200). autosize and itemSize are mutually exclusive; the initial autosize release supports vertical scrolling only. Emits scrolledIndexChange. The template ref exposes scrollToIndex/scrollToOffset.',
      },
      {
        name: 'VVirtualFor',
        signature: 'component VVirtualFor',
        default: '—',
        description:
          '虚拟列表渲染组件，须位于 VVirtualScrollViewport 内。props：of（数组/Ref/DataSource，必填）、trackBy、templateCacheSize。插槽上下文：item/$implicit/of/index/count/first/last/even/odd。',
        descriptionEn: 'Virtual-list repeater that must be placed inside VVirtualScrollViewport. Props: required of (array/Ref/DataSource), trackBy, and templateCacheSize. Slot context: item/$implicit/of/index/count/first/last/even/odd.',
      },
      {
        name: 'VirtualForContext',
        signature: 'interface VirtualForContext<T = unknown>',
        description:
          'VVirtualFor 单个渲染项的插槽上下文，字段语义与 Angular cdkVirtualFor 一致：item/$implicit 为当前条目、of 为传入 :of 的原始数据源、index 为完整数据中的索引、count 为数据总条数、first/last/even/odd 为位置标记。',
        descriptionEn: 'Slot context for one VVirtualFor item, with fields matching Angular cdkVirtualFor: item/$implicit is the current item; of is the original :of source; index is its position in the full data set; count is the total item count; first/last/even/odd are positional flags.',
      },
      {
        name: 'VirtualForSource',
        signature: 'type VirtualForSource<T> = DataSource<T> | readonly T[] | Ref<readonly T[]>',
        description: 'VVirtualFor 支持的数据源形态。',
        descriptionEn: 'Supported data-source shapes for VVirtualFor.',
      },
      {
        name: 'VirtualForTrackBy',
        signature: 'type VirtualForTrackBy<T> = (index: number, item: T) => unknown',
        description: 'trackBy 函数：以索引与条目计算稳定身份，用于复用渲染实例。',
        descriptionEn: 'trackBy callback that derives a stable identity from the index and item so rendered instances can be reused.',
      },
      {
        name: 'VirtualScrollViewportApi',
        signature: 'interface VirtualScrollViewportApi { attachRepeater; detachRepeater; renderedRangeStream }',
        description: '视口对外暴露的 API 契约，供 VVirtualFor 注册重复器并订阅渲染区间。',
        descriptionEn: 'Public viewport contract used by VVirtualFor to register its repeater and subscribe to rendered ranges.',
      },
      {
        name: 'CDK_VIRTUAL_SCROLL_VIEWPORT',
        signature: 'const CDK_VIRTUAL_SCROLL_VIEWPORT: InjectionKey<VirtualScrollViewportApi>',
        description: '视口注入键，VVirtualFor 据此获取所属视口。',
        descriptionEn: 'Viewport injection key used by VVirtualFor to find its containing viewport.',
      },
    ],
  },
  {
    title: '虚拟滚动（策略与适配）',
    titleEn: 'Virtual scrolling (strategies and adapters)',
    rows: [
      {
        name: 'FixedSizeVirtualScrollStrategy',
        signature: 'class FixedSizeVirtualScrollStrategy implements VirtualScrollStrategy',
        description: '固定尺寸虚拟滚动策略：constructor(itemSize, minBufferPx, maxBufferPx)，按固定条目尺寸计算渲染区间。',
        descriptionEn: 'Fixed-size virtual scrolling strategy. constructor(itemSize, minBufferPx, maxBufferPx) calculates the rendered range using a constant item size.',
      },
      {
        name: 'AutoSizeVirtualScrollStrategy',
        signature: 'class AutoSizeVirtualScrollStrategy implements VirtualScrollStrategy',
        description: '不定高度策略：缓存已见条目尺寸，未知条目使用平均估值；普通位置追加保持当前可见锚点，位于最底部时向顶部追加继续吸底。向底部追加不会自动吸底，可由业务层显式调用 scrollToIndex。通过 ResizeObserver 响应运行时高度变化。constructor(minBufferPx?, maxBufferPx?, averager?)。',
        descriptionEn: 'Variable-height strategy that caches measured item sizes and estimates unseen items using an average. Appending away from the bottom preserves the visible anchor; prepending while at the bottom keeps the viewport pinned there. Appending to the bottom does not auto-pin; call scrollToIndex from application logic if needed. ResizeObserver tracks runtime size changes. constructor(minBufferPx?, maxBufferPx?, averager?).',
      },
      {
        name: 'ItemSizeAverager',
        signature: 'class ItemSizeAverager',
        description: '未知条目尺寸估算器；constructor(defaultItemSize = 50)，根据当前有效逐项样本计算平均尺寸。',
        descriptionEn: 'Estimates sizes for unseen items. constructor(defaultItemSize = 50) calculates an average from currently valid per-item samples.',
      },
      {
        name: 'provideAutoSizeVirtualScrollStrategy',
        signature: 'provideAutoSizeVirtualScrollStrategy(options?: AutoSizeVirtualScrollOptions)',
        description: 'Vue Composition API：在父组件 setup 中提供 autosize 策略。options 包含 minBufferPx、maxBufferPx、estimatedItemSize；后代视口不再声明 itemSize/autosize。',
        descriptionEn: 'Vue Composition API entry point for providing an autosize strategy from a parent component setup. options includes minBufferPx, maxBufferPx, and estimatedItemSize; descendant viewports then omit itemSize/autosize.',
      },
      {
        name: 'AutoSizeVirtualScrollOptions',
        signature: 'interface AutoSizeVirtualScrollOptions { minBufferPx?; maxBufferPx?; estimatedItemSize? }',
        description: 'autosize 策略配置。ResizeObserver 不可用时仍执行首次 DOM 测量；需要持续响应异步高度变化的旧环境应由应用提供标准 ResizeObserver polyfill。',
        descriptionEn: 'Autosize strategy options. An initial DOM measurement still runs when ResizeObserver is unavailable; older environments that need to track later asynchronous size changes must provide a standard ResizeObserver polyfill.',
      },
      {
        name: 'VirtualScrollStrategy',
        signature: 'interface VirtualScrollStrategy',
        description: '虚拟滚动策略接口：attached(viewport)/detach()、onContentRendered/onContentScrolled/onDataLengthChanged/scrollToIndex。',
        descriptionEn: 'Virtual scrolling strategy contract: attached(viewport)/detach() and onContentRendered/onContentScrolled/onDataLengthChanged/scrollToIndex callbacks.',
      },
      {
        name: 'VIRTUAL_SCROLL_STRATEGY',
        signature: 'const VIRTUAL_SCROLL_STRATEGY: InjectionKey<VirtualScrollStrategy>',
        description: '自定义策略注入键：父级 provide 策略后，视口在未提供 itemSize 时使用注入策略。',
        descriptionEn: 'Injection key for custom strategies. After a parent provides a strategy, the viewport uses it when itemSize is not specified.',
      },
      {
        name: 'VirtualScrollViewportAdapter',
        signature: 'interface VirtualScrollViewportAdapter',
        description:
          '策略与视口交互的适配器契约（隐藏组件实现细节）：getDataLength/getViewportSize 读取数据长度与可见尺寸；getRenderedRange/setRenderedRange 读写渲染区间；measureScrollOffset 测量滚动偏移；setTotalContentSize/setRenderedContentOffset 撑出滚动条并定位内容；scrollToOffset 滚动视口。',
        descriptionEn: 'Adapter contract between a strategy and viewport that hides component internals. getDataLength/getViewportSize read the data length and visible size; getRenderedRange/setRenderedRange access the rendered range; measureScrollOffset reads the scroll offset; setTotalContentSize/setRenderedContentOffset size the scrollable content and position rendered items; scrollToOffset scrolls the viewport.',
      },
      {
        name: 'VirtualScrollableElement',
        signature: 'class VirtualScrollableElement extends VirtualScrollable',
        description: '元素虚拟滚动容器：作为祖先滚动容器使用，测量时减去滚动偏移以得到布局坐标。',
        descriptionEn: 'Element-based virtual scroll container used as an ancestor scroll container. Measurements subtract the scroll offset to produce layout coordinates.',
      },
      {
        name: 'vVirtualScrollableElement',
        signature: 'directive vVirtualScrollableElement',
        description: '外部滚动容器指令，对应 Angular cdkVirtualScrollingElement：挂载后注册到分发器，供后代视口发现使用。',
        descriptionEn: 'Directive for an external scroll container, corresponding to Angular cdkVirtualScrollingElement. Registers with the dispatcher on mount so descendant viewports can discover it.',
      },
      {
        name: 'findVirtualScrollableElement',
        signature: 'findVirtualScrollableElement(element: HTMLElement | null): VirtualScrollableElement | null',
        description: '沿父链查找最近的 vVirtualScrollableElement 容器，找不到返回 null。',
        descriptionEn: 'Walks up the parent chain to find the nearest vVirtualScrollableElement container, or returns null when none exists.',
      },
      {
        name: 'VirtualScrollableWindow',
        signature: 'class VirtualScrollableWindow extends VirtualScrollable',
        description: '窗口虚拟滚动容器（scrollWindow 模式），以 document 为滚动载体。',
        descriptionEn: 'Window-based virtual scroll container for scrollWindow mode, using document as the scroll host.',
      },
      {
        name: 'CdkVirtualScrollRepeater',
        signature: 'interface CdkVirtualScrollRepeater<T>',
        description: '虚拟滚动重复器契约：提供数据长度与渲染区间管理，VVirtualFor 实现该接口。',
        descriptionEn: 'Virtual-scroll repeater contract for data length and rendered-range management. VVirtualFor implements this interface.',
      },
    ],
  },
  {
    title: '样式',
    titleEn: 'Styles',
    rows: [
      {
        name: 'injectVirtualScrollStyles',
        signature: 'injectVirtualScrollStyles(): void',
        description: '向 document 注入虚拟滚动结构样式（幂等）。',
        descriptionEn: 'Injects the structural virtual-scroll styles into document. Safe to call repeatedly.',
      },
      {
        name: 'removeInjectedVirtualScrollStyles',
        signature: 'removeInjectedVirtualScrollStyles(): void',
        description: '移除已注入的虚拟滚动结构样式。',
        descriptionEn: 'Removes structural virtual-scroll styles previously injected into document.',
      },
    ],
  },
];
