import type {ApiGroup} from '../api';

/** overlay 模块 API 分组：按功能领域拆分全部对外导出。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '组合式函数与服务',
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
        description: 'createOverlayRef 的附加选项：自定义渲染上下文与容器；container 支持 OverlayContainer 实例或任意 HTML 元素，默认使用全局单例容器。',
      },
    ],
  },
  {
    title: '配置与引用',
    rows: [
      {
        name: 'OverlayConfig',
        signature: 'class OverlayConfig',
        default: '—',
        description:
          '创建配置：positionStrategy、scrollStrategy（默认 noop）、panelClass、hasBackdrop（默认 false）、backdropClass（默认 vcdk-overlay-dark-backdrop）、disableAnimations、width/height/min/max 尺寸（数字按像素）、direction、disposeOnNavigation、usePopover（默认 true）、eventPredicate。',
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
        signature: 'type OverlayContent = VNode | (() => VNode | VNode[] | null)',
        description: '可挂载到 overlay 的内容：VNode 或渲染函数。',
      },
      {
        name: 'OverlayRefDeps',
        signature: 'interface OverlayRefDeps { document; keyboardDispatcher; outsideClickDispatcher; container; animationsDisabled?; appContext? }',
        description: 'OverlayRef 的依赖集合，由 createOverlayRef 注入。',
      },
      {
        name: 'OverlaySizeConfig',
        signature: 'interface OverlaySizeConfig { width?; height?; minWidth?; minHeight?; maxWidth?; maxHeight? }',
        description: 'updateSize 的尺寸参数；数字按像素处理。',
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
    title: '容器',
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
    title: '事件分发器',
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
    title: '定位策略',
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
        signature: 'type FlexibleOverlayPopoverLocation',
        description: 'Popover API 定位信息，供 withPopoverLocation 指定浏览器原生的锚点位置。',
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
        description: '连接策略的依赖集合（document、viewportRuler 等），一般由库内自动注入。',
      },
    ],
  },
  {
    title: '连接位置类型与校验',
    rows: [
      {
        name: 'ConnectedPosition',
        signature: 'interface ConnectedPosition { originX; originY; overlayX; overlayY; offsetX?; offsetY?; panelClass? }',
        description: '一组连接位置：origin 与 overlay 各自在 start/center/end 与 top/center/bottom 上的对齐方式。',
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
        description: '描述连接位置在视口内的可见性：isOriginClipped/isOriginFullyClipped/isOverlayClipped/isOverlayFullyClipped。',
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
    title: '滚动策略',
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
    ],
  },
  {
    title: '滚动裁剪检测',
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
    ],
  },
  {
    title: '声明式组件与样式',
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
    title: '事件发射器（重导出）',
    rows: [
      {
        name: 'Emitter',
        signature: 'class Emitter<T = void>',
        description: 'overlay 入口重导出 vue-cdk/emitter 的类型化事件发射器，订阅返回退订函数。',
      },
    ],
  },
];
