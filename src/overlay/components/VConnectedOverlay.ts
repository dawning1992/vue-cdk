import {
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  Teleport,
  watch,
  type PropType,
} from 'vue';
import {createOverlayRef} from '../overlay';
import {OverlayConfig} from '../overlay-config';
import type {OverlayRef} from '../overlay-ref';
import type {ConnectedPosition, ViewportMargin} from '../position/connected-position';
import {
  FlexibleConnectedPositionStrategy,
  type FlexibleConnectedPositionStrategyOrigin,
  type FlexibleOverlayPopoverLocation,
} from '../position/flexible-connected-position-strategy';
import type {ScrollStrategy} from '../scroll/scroll-strategy';
import {createRepositionScrollStrategy} from '../scroll/reposition-scroll-strategy';
import {hasModifierKey} from '../../platform';
import {OVERLAY_ORIGIN_KEY} from './VOverlayOrigin';

/** 默认候选位置：优先向下展开，空间不足时向上。 */
const defaultPositionList: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
  {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom'},
];

/**
 * 声明式连接 overlay 组件，对应 Angular 的 CdkConnectedOverlay 指令：
 * 内容通过默认插槽渲染进浮层面板，位置相对 origin 自动选优。
 *
 * 使用方式：
 * ```vue
 * <VOverlayOrigin tag="span">
 *   <button @click="open = !open">触发器</button>
 * </VOverlayOrigin>
 * <VConnectedOverlay :open="open" :positions="positions">
 *   <div class="panel">面板内容</div>
 * </VConnectedOverlay>
 * ```
 */
export const VConnectedOverlay = defineComponent({
  name: 'VConnectedOverlay',
  props: {
    /** 打开状态。 */
    open: {type: Boolean, default: false},
    /** 定位原点：元素、ref 或坐标点；缺省时使用祖先 VOverlayOrigin。 */
    origin: {
      type: [Object, null] as PropType<FlexibleConnectedPositionStrategyOrigin | null>,
      default: null,
    },
    /** 候选位置列表（从优到劣）。 */
    positions: {
      type: Array as PropType<ConnectedPosition[]>,
      default: undefined,
    },
    /** 自定义定位策略（需要自行完成 origin 与 with* 配置）。 */
    positionStrategy: {
      type: Object as PropType<FlexibleConnectedPositionStrategy>,
      default: undefined,
    },
    /** X 轴默认偏移。 */
    offsetX: {type: Number, default: undefined},
    /** Y 轴默认偏移。 */
    offsetY: {type: Number, default: undefined},
    width: {type: [Number, String], default: undefined},
    height: {type: [Number, String], default: undefined},
    minWidth: {type: [Number, String], default: undefined},
    minHeight: {type: [Number, String], default: undefined},
    maxWidth: {type: [Number, String], default: undefined},
    maxHeight: {type: [Number, String], default: undefined},
    backdropClass: {type: [String, Array] as PropType<string | string[]>, default: undefined},
    panelClass: {type: [String, Array] as PropType<string | string[]>, default: undefined},
    viewportMargin: {
      type: [Number, Object] as PropType<ViewportMargin>,
      default: 0,
    },
    scrollStrategy: {type: Object as PropType<ScrollStrategy>, default: undefined},
    /** 是否允许通过用户交互（ESC/外部点击）关闭。 */
    disableClose: {type: Boolean, default: false},
    /** 依据选中位置为匹配选择器的元素设置 transform-origin。 */
    transformOriginSelector: {type: String, default: ''},
    hasBackdrop: {type: Boolean, default: false},
    lockPosition: {type: Boolean, default: false},
    flexibleDimensions: {type: Boolean, default: false},
    growAfterOpen: {type: Boolean, default: false},
    push: {type: Boolean, default: false},
    disposeOnNavigation: {type: Boolean, default: false},
    /**
     * Popover 模式与 DOM 插入位置：'global' | 'inline' | {type:'parent',element}。
     * 传 null 关闭 Popover（使用全局容器渲染）。
     */
    usePopover: {
      type: [String, Object, null] as PropType<FlexibleOverlayPopoverLocation | null>,
      default: undefined,
    },
    /** 面板宽度与 origin 一致（未显式指定 width 时生效）。 */
    matchWidth: {type: Boolean, default: false},
    direction: {type: String as PropType<'ltr' | 'rtl'>, default: undefined},
  },
  emits: {
    backdropClick: (_event: MouseEvent) => true,
    positionChange: (_change: unknown) => true,
    attach: () => true,
    detach: () => true,
    overlayKeydown: (_event: KeyboardEvent) => true,
    overlayOutsideClick: (_event: MouseEvent) => true,
    'update:open': (_value: boolean) => true,
  },
  setup(props, {slots, emit}) {
    const injectedOrigin = inject(OVERLAY_ORIGIN_KEY, null);
    const overlayRef = shallowRef<OverlayRef | null>(null);
    const positionStrategy = shallowRef<FlexibleConnectedPositionStrategy | null>(null);
    const teleportActive = shallowRef(false);
    const cleanups: (() => void)[] = [];

    /** 解析最终 origin：prop 优先，其次祖先 VOverlayOrigin。 */
    function resolveOrigin(): FlexibleConnectedPositionStrategyOrigin {
      const origin = resolveOriginRaw();
      if (!origin) {
        throw Error('VConnectedOverlay: 缺少 origin，请通过 prop 传入或包裹在 VOverlayOrigin 内。');
      }
      return origin;
    }

    /** 获取原始 origin 值（可能为 null），不抛错。 */
    function resolveOriginRaw(): FlexibleConnectedPositionStrategyOrigin | null {
      return props.origin ?? injectedOrigin?.value ?? null;
    }

    /** 解析 origin 对应的 DOM 元素（坐标点返回 null）。 */
    function resolveOriginElement(): HTMLElement | null {
      const origin = props.origin ?? injectedOrigin?.value ?? null;
      if (origin instanceof HTMLElement) {
        return origin;
      }
      if (isVueRef(origin)) {
        return (origin.value ?? null) as HTMLElement | null;
      }
      return null;
    }

    /** 将组件输入应用到定位策略。 */
    function applyStrategyOptions(strategy: FlexibleConnectedPositionStrategy): void {
      strategy
        .setOrigin(resolveOrigin())
        .withPositions(
          props.positions && props.positions.length ? props.positions : defaultPositionList,
        )
        .withFlexibleDimensions(!!props.flexibleDimensions)
        .withPush(!!props.push)
        .withGrowAfterOpen(!!props.growAfterOpen)
        .withViewportMargin(props.viewportMargin)
        .withLockedPosition(!!props.lockPosition)
        .withDefaultOffsetX(props.offsetX ?? 0)
        .withDefaultOffsetY(props.offsetY ?? 0)
        .withTransformOriginOn(props.transformOriginSelector ?? '')
        .withPopoverLocation(props.usePopover == null ? 'global' : props.usePopover);
    }

    function buildStrategy(): FlexibleConnectedPositionStrategy {
      const strategy = new FlexibleConnectedPositionStrategy(resolveOrigin());
      applyStrategyOptions(strategy);
      return strategy;
    }

    function buildConfig(): OverlayConfig {
      const config = new OverlayConfig({
        positionStrategy: positionStrategy.value!,
        scrollStrategy: props.scrollStrategy ?? createRepositionScrollStrategy(),
        hasBackdrop: props.hasBackdrop,
        disposeOnNavigation: props.disposeOnNavigation,
        usePopover: props.usePopover !== null,
        direction: props.direction,
      });
      if (props.height || props.height === 0) {
        config.height = props.height;
      }
      if (props.minWidth || props.minWidth === 0) {
        config.minWidth = props.minWidth;
      }
      if (props.minHeight || props.minHeight === 0) {
        config.minHeight = props.minHeight;
      }
      if (props.maxWidth || props.maxWidth === 0) {
        config.maxWidth = props.maxWidth;
      }
      if (props.maxHeight || props.maxHeight === 0) {
        config.maxHeight = props.maxHeight;
      }
      if (props.backdropClass) {
        config.backdropClass = props.backdropClass;
      }
      if (props.panelClass) {
        config.panelClass = props.panelClass;
      }
      return config;
    }

    /** 面板宽度：显式 width 优先，matchWidth 时取 origin 宽度。 */
    function getWidth(): number | string | undefined {
      if (props.width || props.width === 0) {
        return props.width;
      }
      if (props.matchWidth) {
        return resolveOriginElement()?.getBoundingClientRect().width;
      }
      return undefined;
    }

    /** 订阅 overlay 事件并转发为组件 emits。 */
    function subscribeEvents(ref: OverlayRef): void {
      cleanups.push(ref.attachments().subscribe(() => emit('attach')));
      cleanups.push(ref.detachments().subscribe(() => emit('detach')));
      cleanups.push(ref.backdropClick().subscribe(event => emit('backdropClick', event)));
      cleanups.push(
        ref.keydownEvents().subscribe(event => {
          emit('overlayKeydown', event);
          // ESC 关闭与 Angular 指令行为一致。
          if (event.key === 'Escape' && !props.disableClose && !hasModifierKey(event)) {
            event.preventDefault();
            emit('update:open', false);
            void detachOverlay();
          }
        }),
      );
      cleanups.push(
        ref.outsidePointerEvents().subscribe(event => {
          const origin = resolveOriginElement();
          const target = event.target instanceof Element ? event.target : null;
          // 点击目标在 origin 内部时不视为外部点击。
          if (!origin || (origin !== target && !origin.contains(target))) {
            emit('overlayOutsideClick', event);
          }
        }),
      );
      if (positionStrategy.value) {
        cleanups.push(
          positionStrategy.value.positionChanges.subscribe(change =>
            emit('positionChange', change),
          ),
        );
      }
    }

    async function attachOverlay(): Promise<void> {
      const existing = overlayRef.value;
      if (existing) {
        if (!existing.hasAttached()) {
          applySize(existing);
          teleportActive.value = true;
          existing.attach();
          await nextTick();
          existing.updatePosition();
        }
        return;
      }

      positionStrategy.value = props.positionStrategy ?? buildStrategy();
      const ref = createOverlayRef(buildConfig(), {
        appContext: getCurrentInstance()?.appContext,
      });
      overlayRef.value = ref;
      subscribeEvents(ref);
      applySize(ref);
      teleportActive.value = true;
      ref.attach();
      await nextTick();
      ref.updatePosition();
    }

    /** 将当前尺寸输入同步到 overlay。 */
    function applySize(ref: OverlayRef): void {
      ref.updateSize({
        width: getWidth(),
        height: props.height,
        minWidth: props.minWidth,
        minHeight: props.minHeight,
        maxWidth: props.maxWidth,
        maxHeight: props.maxHeight,
      });
    }

    async function detachOverlay(): Promise<void> {
      teleportActive.value = false;
      // 先移除 Teleport 内容，再卸载 overlay，避免内容解挂与宿主移除竞争。
      await nextTick();
      overlayRef.value?.detach();
    }

    watch(
      () => props.open,
      open => {
        if (open) {
          void attachOverlay().catch(err => console.error(err));
        } else {
          void detachOverlay().catch(err => console.error(err));
        }
      },
      {flush: 'post'},
    );

    // 初始 open 或 origin 延迟可用（如兄弟模板 ref）时，在 origin 就绪后自动打开。
    watch(
      () => resolveOriginRaw(),
      origin => {
        if (origin && props.open && !overlayRef.value) {
          void attachOverlay().catch(err => console.error(err));
        }
      },
      {flush: 'post', immediate: true},
    );

    // 输入变化时更新策略与面板尺寸。
    watch(
      () => [
        props.origin,
        props.positions,
        props.offsetX,
        props.offsetY,
        props.viewportMargin,
        props.lockPosition,
        props.flexibleDimensions,
        props.growAfterOpen,
        props.push,
        props.transformOriginSelector,
        props.usePopover,
        props.positionStrategy,
      ],
      () => {
        const ref = overlayRef.value;
        const strategy = positionStrategy.value;
        if (!ref || !strategy) {
          return;
        }
        if (props.positionStrategy && props.positionStrategy !== strategy) {
          // 用户替换了自定义策略：切换并重新订阅位置事件。
          ref.updatePositionStrategy(props.positionStrategy);
          positionStrategy.value = props.positionStrategy;
          cleanups.forEach(cleanup => cleanup());
          cleanups.length = 0;
          subscribeEvents(ref);
        } else if (!props.positionStrategy) {
          applyStrategyOptions(strategy);
        }
        ref.updateSize({
          width: getWidth(),
          height: props.height,
          minWidth: props.minWidth,
          minHeight: props.minHeight,
          maxWidth: props.maxWidth,
          maxHeight: props.maxHeight,
        });
        if (ref.hasAttached()) {
          ref.updatePosition();
        }
      },
    );

    onBeforeUnmount(() => {
      cleanups.forEach(cleanup => cleanup());
      cleanups.length = 0;
      overlayRef.value?.dispose();
    });

    return () => {
      const ref = overlayRef.value;
      if (!teleportActive.value || !ref) {
        return null;
      }
      // Teleport 为特殊内置组件，类型定义与 h() 不完全兼容，此处显式断言。
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return h(Teleport as any, {to: ref.overlayElement}, slots.default?.());
    };
  },
});

/** 判断对象是否为 Vue ref。 */
function isVueRef(value: unknown): value is import('vue').Ref<HTMLElement | null | undefined> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    '__v_isRef' in value
  );
}
