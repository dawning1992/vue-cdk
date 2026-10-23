import type {ApiGroup} from '../api';

/** overlay 模块 API 分组：按功能领域拆分全部对外导出。 */
const apiGroupsZh: readonly ApiGroup[] = [
  {
    title: '组合式函数与服务', titleEn: 'Composables and services',
    rows: [
      {
        name: 'useOverlay',
        signature: 'useOverlay(): { create, position, scrollStrategies }',
        description:
          'Vue 组合式 API 入口，对应 Angular 的 Overlay 服务。在组件 setup 中调用会捕获应用上下文，使命令式渲染内容可访问 app 级 provide。返回 create(config?)、position()（定位构建器）与 scrollStrategies（滚动策略工厂）。',
      },
      {
        name: 'createOverlayRef',
        signature: 'createOverlayRef(config?: OverlayConfig, options?: CreateOverlayRefOptions): OverlayRef',
        description:
          '命令式创建 OverlayRef：合并默认配置（方向、Popover 能力降级），创建 pane 与 host 并插入容器，自动注入结构样式。',
      },
      {
        name: 'CreateOverlayRefOptions',
        signature: 'interface CreateOverlayRefOptions { appContext?: AppContext | null; container?: OverlayContainer | HTMLElement }',
        description:
          'createOverlayRef 的附加选项：appContext 为命令式渲染内容提供 provide/inject 通道（缺省回退全局上下文）；container 支持 OverlayContainer 实例或任意 HTML 元素（默认使用全局单例容器），可把浮层限制渲染到指定区域。',
      },
    ],
  },
  {
    title: '配置与引用', titleEn: 'Configuration and references',
    rows: [
      {
        name: 'OverlayConfig',
        signature: 'class OverlayConfig',
        default: '—',
        description:
          '创建配置（字段与默认值对齐 Angular CDK 的 OverlayConfig）：positionStrategy 定位策略，不提供时 overlay 不主动定位；scrollStrategy 滚动策略，默认 noop；panelClass 面板自定义类（字符串或数组，默认空）；hasBackdrop 是否启用遮罩，默认 false；backdropClass 遮罩自定义类，默认 vcdk-overlay-dark-backdrop；disableAnimations 禁用内置动画（遮罩淡入淡出）；width/height/minWidth/minHeight/maxWidth/maxHeight 面板尺寸（数字按像素）；direction 文本方向，不设置时回退 html 根元素 dir；disposeOnNavigation 路由导航时自动销毁，默认 false；usePopover 以原生 Popover 元素渲染（不支持时自动降级），默认 true；eventPredicate 事件谓词，决定 overlay 是否接收分发器派发的特定事件。',
      },
      {
        name: 'OverlayRef',
        signature: 'class OverlayRef',
        default: '—',
        description:
          '浮层操作句柄：attach(content?)/detach()/dispose()/hasAttached()；updatePosition()/updateSize()/setDirection()；addPanelClass()/removePanelClass()；属性 overlayElement/hostElement/backdropElement；事件流 attachments()/detachments()/backdropClick()/keydownEvents()/outsidePointerEvents()（订阅返回退订函数，dispose 时 complete）。',
      },
      {
        name: 'OverlayContent',
        signature: 'type OverlayContent = VNode | (() => VNode | VNode[] | null) | Portal<any>',
        description:
          '可挂载到 overlay 的内容：VNode / 渲染函数（返回归一化 VNode）或 Portal（返回挂载引用）。overlay 内容挂载基于 vue-cdk/portal 实现。',
      },
      {
        name: 'OverlayRefDeps',
        signature: 'interface OverlayRefDeps { document; keyboardDispatcher; outsideClickDispatcher; container; animationsDisabled?; appContext? }',
        description:
          'OverlayRef 的依赖集合，由 createOverlayRef 注入：document 为渲染文档；keyboardDispatcher/outsideClickDispatcher 为全局事件分发器；container 为浮层容器；animationsDisabled 关闭动画；appContext 为命令式渲染保留调用方 provide/inject 能力。',
      },
      {
        name: 'OverlaySizeConfig',
        signature: 'interface OverlaySizeConfig { width?; height?; minWidth?; minHeight?; maxWidth?; maxHeight? }',
        description:
          'updateSize 的尺寸参数：width/height 设置面板宽高，minWidth/minHeight/maxWidth/maxHeight 设置最小/最大尺寸；所有字段均为 number | string，数字按像素处理。',
      },
      {
        name: 'BackdropRef',
        signature: 'class BackdropRef',
        description:
          '遮罩引用：封装遮罩元素创建、淡入淡出销毁。detach() 开始淡出（transitionend 或 500ms 兜底定时器），dispose() 立即销毁并清理监听。',
      },
    ],
  },
  {
    title: '容器', titleEn: 'Containers',
    rows: [
      {
        name: 'OverlayContainer',
        signature: 'class OverlayContainer',
        description: '浮层容器：可传入自定义宿主元素（new OverlayContainer(element)），getContainerElement() 惰性返回该元素并自动补齐 .vcdk-overlay-container 类；不传时自建元素并挂到 body。dispose() 只清理库自建容器，不移除调用方元素。',
      },
      {
        name: 'FullscreenOverlayContainer',
        signature: 'class FullscreenOverlayContainer extends OverlayContainer',
        description: '全屏容器：覆盖全视口并显示在顶层，适用于需要全屏浮层的场景。',
      },
      {
        name: 'overlayContainer',
        signature: 'const overlayContainer = new OverlayContainer()',
        description: '模块级单例容器，createOverlayRef 的默认容器。',
      },
    ],
  },
  {
    title: '事件分发器', titleEn: 'Event dispatchers',
    rows: [
      {
        name: 'OverlayKeyboardDispatcher',
        signature: 'class OverlayKeyboardDispatcher extends BaseOverlayDispatcher',
        description: '全局键盘分发器：按打开顺序把 keydown 事件派发给可见 overlay。',
      },
      {
        name: 'overlayKeyboardDispatcher',
        signature: 'const overlayKeyboardDispatcher = new OverlayKeyboardDispatcher()',
        description: '键盘分发器模块级单例。',
      },
      {
        name: 'OverlayOutsideClickDispatcher',
        signature: 'class OverlayOutsideClickDispatcher extends BaseOverlayDispatcher',
        description: '全局外部点击分发器：点击 overlay 外区域时向 overlay 派发事件，配合 eventPredicate 过滤。',
      },
      {
        name: 'overlayOutsideClickDispatcher',
        signature: 'const overlayOutsideClickDispatcher = new OverlayOutsideClickDispatcher()',
        description: '外部点击分发器模块级单例。',
      },
    ],
  },
  {
    title: '定位策略', titleEn: 'Position strategies',
    rows: [
      {
        name: 'PositionStrategy',
        signature: 'interface PositionStrategy',
        description: '定位策略接口：attach(overlayRef) 绑定、apply() 应用定位、detach()/dispose() 释放。',
      },
      {
        name: 'GlobalPositionStrategy',
        signature: 'class GlobalPositionStrategy implements PositionStrategy',
        description:
          '全局定位：top/bottom/left/right/start/end（值默认空串）、width/height、centerHorizontally(offset?)/centerVertically(offset?)，链式调用后 apply()。',
      },
      {
        name: 'createGlobalPositionStrategy',
        signature: 'createGlobalPositionStrategy(): GlobalPositionStrategy',
        description: '创建全局定位策略的工厂函数。',
      },
      {
        name: 'FlexibleConnectedPositionStrategy',
        signature: 'class FlexibleConnectedPositionStrategy implements PositionStrategy',
        description:
          '连接定位策略：候选位置自动选优，放不下自动翻转、flexible 尺寸约束、push 回屏、位置锁定、RTL 支持。链式方法：setOrigin/withPositions/withViewportMargin/withFlexibleDimensions/withGrowAfterOpen/withPush/withLockedPosition/withDefaultOffsetX/Y/withTransformOriginOn/withScrollableContainers/withPopoverLocation/reapplyLastPosition，属性 positionChanges。',
      },
      {
        name: 'OverlayPositionBuilder',
        signature: 'class OverlayPositionBuilder',
        description: '定位构建器：global() 返回全局策略；flexibleConnectedTo(origin) 返回连接策略。',
      },
      {
        name: 'overlayPositionBuilder',
        signature: 'const overlayPositionBuilder = new OverlayPositionBuilder()',
        description: '定位构建器模块级单例，useOverlay().position() 返回它。',
      },
      {
        name: 'STANDARD_DROPDOWN_BELOW_POSITIONS',
        signature: 'const STANDARD_DROPDOWN_BELOW_POSITIONS: ConnectedPosition[]',
        description: '标准下拉位置常量：元素下方左对齐、下方右对齐（RTL 自动适配），用于下拉菜单默认定位。',
      },
      {
        name: 'STANDARD_DROPDOWN_ADJACENT_POSITIONS',
        signature: 'const STANDARD_DROPDOWN_ADJACENT_POSITIONS: ConnectedPosition[]',
        description: '标准下拉相邻位置常量：元素右侧上方、右侧下方，用于菜单展开方向在侧边的场景。',
      },
      {
        name: 'FlexibleConnectedPositionStrategyOrigin',
        signature: 'type FlexibleConnectedPositionStrategyOrigin = HTMLElement | Point | Ref<HTMLElement | Point | null | undefined> | (() => HTMLElement | Point | null)',
        description: '连接定位的 origin 输入：元素、坐标点、ref 或延迟解析函数。',
      },
      {
        name: 'FlexibleOverlayPopoverLocation',
        signature: "type FlexibleOverlayPopoverLocation = 'global' | 'inline' | {type: 'parent'; element: Element}",
        description:
          'Popover API 定位信息，供 withPopoverLocation 指定浏览器原生的锚点位置：global 插入 body 顶层、inline 插入锚点元素内部、{type: "parent"; element} 插入指定父元素。',
      },
      {
        name: 'Point',
        signature: 'interface Point { x: number; y: number }',
        description: '坐标点，可作为连接定位的 origin。',
      },
      {
        name: 'ScrollableContainer',
        signature: 'type ScrollableContainer = HTMLElement | { element: HTMLElement }',
        description: '参与滚动监听的可滚动容器输入。',
      },
      {
        name: 'FlexibleConnectedPositionStrategyDeps',
        signature: 'interface FlexibleConnectedPositionStrategyDeps',
        description:
          '连接策略的依赖集合：viewportRuler 视口测量工具、document 渲染文档、overlayContainer 浮层容器；均缺省时回退模块级默认实例，一般由库内自动注入。',
      },
    ],
  },
  {
    title: '连接位置类型与校验', titleEn: 'Connected position types and validation',
    rows: [
      {
        name: 'ConnectedPosition',
        signature:
          'interface ConnectedPosition { originX; originY; overlayX; overlayY; weight?; offsetX?; offsetY?; panelClass? }',
        description:
          '一组连接位置：originX/originY 与 overlayX/overlayY 分别指定 origin 与 overlay 在水平（start/center/end）与垂直（top/center/bottom）上的对齐方式；weight 候选位置优先级权重；offsetX/offsetY 偏移像素；panelClass 命中该位置时附加到面板的类。',
      },
      {
        name: 'OriginConnectionPosition',
        signature: 'interface OriginConnectionPosition { originX: HorizontalConnectionPos; originY: VerticalConnectionPos }',
        description: 'origin 一侧的连接位置。',
      },
      {
        name: 'OverlayConnectionPosition',
        signature: 'interface OverlayConnectionPosition { overlayX: HorizontalConnectionPos; overlayY: VerticalConnectionPos }',
        description: 'overlay 一侧的连接位置。',
      },
      {
        name: 'ConnectionPositionPair',
        signature: 'class ConnectionPositionPair',
        description: '连接位置对：组合 origin 与 overlay 位置（含 RTL 起始点映射与 offset 支持）。',
      },
      {
        name: 'ScrollingVisibility',
        signature: 'class ScrollingVisibility',
        description:
          '描述连接位置在视口内的可见性：isOriginClipped/isOriginOutsideView 与 isOverlayClipped/isOverlayOutsideView 分别表示 origin/overlay 被裁剪或完全移出视口。',
      },
      {
        name: 'ConnectedOverlayPositionChange',
        signature: 'class ConnectedOverlayPositionChange',
        description: '位置变化事件负载：包含新连接位置与连接对。',
      },
      {
        name: 'Direction',
        signature: "type Direction = 'ltr' | 'rtl'",
        description: '文本方向。',
      },
      {
        name: 'HorizontalConnectionPos',
        signature: "type HorizontalConnectionPos = 'start' | 'center' | 'end'",
        description: '水平连接位置。',
      },
      {
        name: 'VerticalConnectionPos',
        signature: "type VerticalConnectionPos = 'top' | 'center' | 'bottom'",
        description: '垂直连接位置。',
      },
      {
        name: 'ViewportMargin',
        signature: 'type ViewportMargin = number | { top?: number; right?: number; bottom?: number; left?: number }',
        description: '浮层与视口边缘的最小间距，可整体或分方向设置。',
      },
      {
        name: 'validateHorizontalPosition',
        signature: 'validateHorizontalPosition(value: string): void',
        description: '校验水平位置值是否合法，非法时抛出异常。',
      },
      {
        name: 'validateVerticalPosition',
        signature: 'validateVerticalPosition(value: string): void',
        description: '校验垂直位置值是否合法，非法时抛出异常。',
      },
    ],
  },
  {
    title: '滚动策略', titleEn: 'Scroll strategies',
    rows: [
      {
        name: 'ScrollStrategy',
        signature: 'interface ScrollStrategy',
        description: '滚动策略接口：attach(overlayRef) 监听、enable()/disable() 切换、detach() 释放。',
      },
      {
        name: 'scrollStrategies',
        signature: 'const scrollStrategies = { noop(), close(config?), block(), reposition(config?) }',
        description: '滚动策略工厂集合，useOverlay().scrollStrategies 返回它：noop 不处理；close 滚动时关闭浮层；block 锁定页面滚动；reposition 滚动时重新定位。',
      },
      {
        name: 'NoopScrollStrategy',
        signature: 'class NoopScrollStrategy implements ScrollStrategy',
        description: '空操作滚动策略，不监听也不干预滚动。',
      },
      {
        name: 'createNoopScrollStrategy',
        signature: 'createNoopScrollStrategy(): NoopScrollStrategy',
        description: '创建空操作策略的工厂函数。',
      },
      {
        name: 'CloseScrollStrategy',
        signature: 'class CloseScrollStrategy implements ScrollStrategy',
        description: '滚动发生时关闭浮层的策略（ESC 语义一致）。',
      },
      {
        name: 'createCloseScrollStrategy',
        signature: 'createCloseScrollStrategy(config?: CloseScrollStrategyConfig): CloseScrollStrategy',
        description: '创建滚动关闭策略的工厂函数。',
      },
      {
        name: 'CloseScrollStrategyConfig',
        signature: 'interface CloseScrollStrategyConfig { threshold? }',
        description: '滚动关闭策略配置：threshold 为触发关闭的最小滚动距离（像素）。',
      },
      {
        name: 'BlockScrollStrategy',
        signature: 'class BlockScrollStrategy implements ScrollStrategy',
        description: '启用期间锁定页面滚动（禁用 html/body 滚动并缓存恢复）。',
      },
      {
        name: 'createBlockScrollStrategy',
        signature: 'createBlockScrollStrategy(): BlockScrollStrategy',
        description: '创建滚动锁定策略的工厂函数。',
      },
      {
        name: 'RepositionScrollStrategy',
        signature: 'class RepositionScrollStrategy implements ScrollStrategy',
        description: '滚动期间按节流间隔重新计算浮层位置，避免跟随滚动错位。',
      },
      {
        name: 'createRepositionScrollStrategy',
        signature: 'createRepositionScrollStrategy(config?: RepositionScrollStrategyConfig): RepositionScrollStrategy',
        description: '创建重定位策略的工厂函数。',
      },
      {
        name: 'RepositionScrollStrategyConfig',
        signature: 'interface RepositionScrollStrategyConfig { scrollThrottle?: number }',
        description: '重定位策略配置：scrollThrottle 为滚动重定位的节流毫秒数。',
      },
      {
        name: 'getScrollStrategyAlreadyAttachedError',
        signature: 'getScrollStrategyAlreadyAttachedError(): Error',
        description: '同一滚动策略重复绑定到多个 overlay 时抛出的错误工厂。',
      },
    ],
  },
  {
    title: '滚动裁剪检测', titleEn: 'Scroll clipping detection',
    rows: [
      {
        name: 'isElementScrolledOutsideView',
        signature: 'isElementScrolledOutsideView(element: HTMLElement, containers?: ScrollableContainer[]): boolean',
        description: '判断元素是否被滚出视口或指定滚动容器之外。',
      },
      {
        name: 'isElementClippedByScrolling',
        signature: 'isElementClippedByScrolling(element: HTMLElement, containers?: ScrollableContainer[]): boolean',
        description: '判断元素是否被滚动容器裁剪（部分或全部不可见）。',
      },
      {
        name: 'Dimensions',
        signature: "type Dimensions = Omit<DOMRect, 'x' | 'y' | 'toJSON'>",
        description: 'DOMRect 的简化形态，仅保留定位算法所需的几何字段（top/left/right/bottom/width/height）。',
      },
    ],
  },
  {
    title: '声明式组件与样式', titleEn: 'Declarative components and styling',
    rows: [
      {
        name: 'VOverlayOrigin',
        signature: 'component VOverlayOrigin',
        description: '声明式 origin 容器：通过 provide 向内部 VConnectedOverlay 传递锚点元素；亦可直接使用 v-slot 暴露的 origin 函数。',
      },
      {
        name: 'OVERLAY_ORIGIN_KEY',
        signature: 'const OVERLAY_ORIGIN_KEY: InjectionKey',
        description: 'origin 注入键，VConnectedOverlay 据此读取最近的 VOverlayOrigin。',
      },
      {
        name: 'VConnectedOverlay',
        signature: 'component VConnectedOverlay',
        default: '—',
        description:
          '声明式连接浮层组件。props：open、origin、positions、positionStrategy、offsetX/offsetY、width/height 与 min/max 尺寸、backdropClass、panelClass、viewportMargin、scrollStrategy、disableClose、transformOriginSelector、hasBackdrop、lockPosition、flexibleDimensions、growAfterOpen、push、disposeOnNavigation、usePopover、matchWidth、direction。emits：backdropClick、positionChange、attach、detach、overlayKeydown、overlayOutsideClick、update:open。',
      },
      {
        name: 'injectOverlayStyles',
        signature: 'injectOverlayStyles(): void',
        description: '向 document 注入 overlay 结构样式（幂等，重复调用去重）。',
      },
      {
        name: 'removeInjectedOverlayStyles',
        signature: 'removeInjectedOverlayStyles(): void',
        description: '移除已注入的 overlay 结构样式。',
      },
      {
        name: 'vcdkOverlayStyles',
        signature: 'const vcdkOverlayStyles: string',
        description: 'overlay 结构样式源码，供需要手动控制的场景使用。',
      },
    ],
  },
  {
    title: '事件发射器（重导出）', titleEn: 'Event emitter (re-export)',
    rows: [
      {
        name: 'Emitter',
        signature: 'class Emitter<T = void>',
        description: 'overlay 入口重导出 vue-cdk/emitter 的类型化事件发射器，订阅返回退订函数。',
      },
    ],
  },
];

const descriptionEn: Record<string, string> = {
  useOverlay: 'Composable entry point matching Angular Overlay. In component setup it captures app context for imperative content and returns create(), position(), and scrollStrategies.',
  createOverlayRef: 'Imperatively creates an OverlayRef, merges default direction and Popover fallback settings, creates and inserts the pane and host, and injects structural styles.',
  CreateOverlayRefOptions: 'Additional createOverlayRef options: appContext preserves provide/inject for imperative content; container accepts an OverlayContainer or HTMLElement and defaults to the global singleton.',
  OverlayConfig: 'Creation settings for position and scroll strategies, panel and backdrop classes, dimensions, direction, navigation disposal, native Popover fallback, animations, and event filtering; defaults align with Angular CDK.',
  OverlayRef: 'Overlay handle for attach/detach/dispose, position and size updates, direction changes, panel classes, element references, and attachment, backdrop, keyboard, and outside-pointer event streams.',
  OverlayContent: 'Content mountable in an overlay: VNode, render function returning normalized VNodes, or Portal with a mount reference; mounting uses vue-cdk/portal.',
  OverlayRefDeps: 'Dependencies injected into OverlayRef: document, global keyboard and outside-click dispatchers, container, animation setting, and app context for provide/inject.',
  OverlaySizeConfig: 'Size options for updateSize: width, height, min/max width, and min/max height; every field accepts number or string, with numbers interpreted as pixels.',
  BackdropRef: 'Backdrop handle that creates and fades out the backdrop; detach waits for transitionend or a 500 ms fallback, while dispose removes it immediately and cleans listeners.',
  OverlayContainer: 'Overlay container that can use a custom host element; getContainerElement() lazily adds the vcdk-overlay-container class. Without a host it creates one under body, and dispose removes only library-owned containers.',
  FullscreenOverlayContainer: 'Full-viewport container rendered at the top level for overlays that need to cover the entire viewport.',
  overlayContainer: 'Module-level singleton container used by createOverlayRef by default.',
  OverlayKeyboardDispatcher: 'Global keyboard dispatcher that sends keydown events to visible overlays in opening order.',
  overlayKeyboardDispatcher: 'Module-level singleton keyboard dispatcher.',
  OverlayOutsideClickDispatcher: 'Global outside-click dispatcher that sends events to overlays when the pointer is outside, with eventPredicate filtering.',
  overlayOutsideClickDispatcher: 'Module-level singleton outside-click dispatcher.',
  PositionStrategy: 'Position strategy contract: attach an overlay reference, apply positioning, and release resources with detach or dispose.',
  GlobalPositionStrategy: 'Global positioning with top/bottom/left/right/start/end, width/height, and centered horizontal or vertical offsets; chain calls before apply().',
  createGlobalPositionStrategy: 'Factory for a global position strategy.',
  FlexibleConnectedPositionStrategy: 'Connected positioning with automatic candidate selection, flipping, flexible dimensions, viewport push, locked position, RTL support, and a chainable configuration API.',
  OverlayPositionBuilder: 'Position builder whose global() returns a global strategy and flexibleConnectedTo(origin) returns a connected strategy.',
  overlayPositionBuilder: 'Module-level position builder singleton returned by useOverlay().position().',
  STANDARD_DROPDOWN_BELOW_POSITIONS: 'Standard dropdown positions below the origin with start/end alignment and RTL adaptation.',
  STANDARD_DROPDOWN_ADJACENT_POSITIONS: 'Standard adjacent dropdown positions to the right of the origin, above or below, for side-opening menus.',
  FlexibleConnectedPositionStrategyOrigin: 'Connected-position origin input: an element, point, ref, or lazily evaluated function.',
  FlexibleOverlayPopoverLocation: 'Popover placement for withPopoverLocation: global inserts into the top-level body container, inline inserts inside the origin, and parent inserts into a specified parent element.',
  Point: 'Viewport coordinate point that can be used as a connected-position origin.',
  ScrollableContainer: 'Scrollable container input used for scroll observation: an HTMLElement or an object containing one.',
  FlexibleConnectedPositionStrategyDeps: 'Connected strategy dependencies: viewport measurement, document, and overlay container; omitted values use module-level defaults.',
  ConnectedPosition: 'Origin and overlay horizontal/vertical alignment pair with optional candidate weight, pixel offsets, and a panel class for the selected position.',
  OriginConnectionPosition: 'Horizontal and vertical connection position on the origin side.',
  OverlayConnectionPosition: 'Horizontal and vertical connection position on the overlay side.',
  ConnectionPositionPair: 'Pair combining origin and overlay positions, including RTL start mapping and offsets.',
  ScrollingVisibility: 'Visibility state for a connected position: whether the origin or overlay is clipped or fully outside the viewport.',
  ConnectedOverlayPositionChange: 'Position-change event payload containing the new connected position and position pair.',
  Direction: 'Text direction, either ltr or rtl.',
  HorizontalConnectionPos: 'Horizontal connection position: start, center, or end.',
  VerticalConnectionPos: 'Vertical connection position: top, center, or bottom.',
  ViewportMargin: 'Minimum gap between the overlay and viewport edges, specified as one number or per side.',
  validateHorizontalPosition: 'Validates a horizontal position value and throws for invalid input.',
  validateVerticalPosition: 'Validates a vertical position value and throws for invalid input.',
  ScrollStrategy: 'Scroll strategy contract: attach listeners, enable or disable behavior, and release with detach.',
  scrollStrategies: 'Scroll strategy factories returned by useOverlay().scrollStrategies: noop, close, block, and reposition.',
  NoopScrollStrategy: 'No-op scroll strategy that neither observes nor changes scrolling.',
  createNoopScrollStrategy: 'Factory for a no-op scroll strategy.',
  CloseScrollStrategy: 'Closes the overlay when scrolling occurs, matching Escape-style dismissal semantics.',
  createCloseScrollStrategy: 'Factory for a close-on-scroll strategy.',
  CloseScrollStrategyConfig: 'Close-on-scroll configuration; threshold is the minimum scroll distance that triggers closing.',
  BlockScrollStrategy: 'Locks page scrolling while enabled by disabling html/body scrolling and caching restoration state.',
  createBlockScrollStrategy: 'Factory for a scroll-locking strategy.',
  RepositionScrollStrategy: 'Recalculates overlay position during scrolling at a throttled interval to prevent drift.',
  createRepositionScrollStrategy: 'Factory for a reposition-on-scroll strategy.',
  RepositionScrollStrategyConfig: 'Reposition configuration; scrollThrottle is the throttling interval in milliseconds.',
  getScrollStrategyAlreadyAttachedError: 'Error factory for attempting to attach one scroll strategy to multiple overlays.',
  isElementScrolledOutsideView: 'Checks whether an element has scrolled outside the viewport or specified scroll containers.',
  isElementClippedByScrolling: 'Checks whether scrolling containers clip an element partially or completely.',
  Dimensions: 'Simplified DOMRect shape retaining the geometry needed by positioning: top, left, right, bottom, width, and height.',
  VOverlayOrigin: 'Declarative origin container that provides its anchor element to nested VConnectedOverlay; it also exposes an origin function through its slot.',
  OVERLAY_ORIGIN_KEY: 'Injection key used by VConnectedOverlay to read the nearest VOverlayOrigin.',
  VConnectedOverlay: 'Declarative connected-overlay component with open state, origin and positions, dimensions, classes, scroll and close behavior, Popover options, direction, and attach/detach/position events.',
  injectOverlayStyles: 'Idempotently injects overlay structural styles into the document and deduplicates repeated calls.',
  removeInjectedOverlayStyles: 'Removes previously injected overlay structural styles.',
  vcdkOverlayStyles: 'Overlay structural style source for scenarios that require manual control.',
  Emitter: 'Re-export of the typed event emitter from vue-cdk/emitter; subscribe returns an unsubscribe function.',
};

/** API 表格使用独立英文映射，避免把中文契约误当作英文翻译。 */
export const apiGroups: readonly ApiGroup[] = apiGroupsZh.map(group => ({
  ...group,
      rows: group.rows.map(row => ({...row, descriptionEn: descriptionEn[row.name] ?? 'English description unavailable'})),
}));
