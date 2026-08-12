/**
 * 虚拟滚动视口组件，对应 Angular CDK 的 CdkVirtualScrollViewport。
 * 结构、测量与渲染流程移植自 Angular CDK scrolling（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 模板结构（与 Angular 一致）：
 * - 根元素：滚动容器（自滚动时追加 .vcdk-virtual-scrollable）；
 * - content-wrapper：承载插槽内容，按渲染区间偏移进行 transform；
 * - spacer：高度/宽度等于全部内容总尺寸，撑出真实滚动条。
 *
 * 与 Angular 的差异：使用 Vue 响应式（ref）驱动渲染与 transform，
 * 无需显式 change detection；渲染区间、内容偏移等通过 Emitter 暴露。
 */

import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type InjectionKey,
  type PropType,
} from 'vue';
import type {ListRange} from '../collections';
import {Emitter} from '../emitter';
import {viewportRuler} from './viewport-ruler';
import {getDirection} from './directionality';
import {FixedSizeVirtualScrollStrategy} from './fixed-size-virtual-scroll';
import type {ExtendedScrollToOptions} from './scrollable';
import type {CdkVirtualScrollRepeater} from './virtual-scroll-repeater';
import {VirtualScrollable} from './virtual-scrollable';
import {findVirtualScrollableElement} from './virtual-scrollable-element';
import {VirtualScrollableWindow} from './virtual-scrollable-window';
import {
  VIRTUAL_SCROLL_STRATEGY,
  type VirtualScrollStrategy,
  type VirtualScrollViewportAdapter,
} from './virtual-scroll-strategy';

/** 视口对外暴露给 VVirtualFor 的 API。 */
export interface VirtualScrollViewportApi {
  /** 注册重复器；重复注册抛错。 */
  attachRepeater(forOf: CdkVirtualScrollRepeater<unknown>): void;

  /** 注销重复器。 */
  detachRepeater(): void;

  /** 渲染区间变化流。 */
  renderedRangeStream: Emitter<ListRange>;
}

/** 注入键：子组件（VVirtualFor）据此获取所属视口。 */
export const CDK_VIRTUAL_SCROLL_VIEWPORT: InjectionKey<VirtualScrollViewportApi> = Symbol(
  'vcdk-virtual-scroll-viewport',
);

/** 判断两个渲染区间是否相等。 */
function rangesEqual(r1: ListRange, r2: ListRange): boolean {
  return r1.start === r2.start && r1.end === r2.end;
}

/** 自滚动视口适配：文档坐标无需减去滚动偏移（即 Angular 视口自身的行为）。 */
class VirtualScrollableViewport extends VirtualScrollable {
  override measureBoundingClientRectWithScrollOffset(
    from: 'left' | 'top' | 'right' | 'bottom',
  ): number {
    return this.getElement().getBoundingClientRect()[from];
  }
}

/**
 * 把滚动事件流按动画帧合并：同一帧内的多次滚动只触发一次回调。
 * 无 requestAnimationFrame 环境退化为 setTimeout(16ms)。
 */
function rafAudit(emitter: Emitter<Event>, onEvent: () => void): () => void {
  let pending = false;
  let rafId: number | null = null;

  const schedule: (fn: () => void) => number =
    typeof requestAnimationFrame === 'function'
      ? fn => requestAnimationFrame(fn)
      : fn => setTimeout(fn, 16) as unknown as number;
  const cancel: (id: number) => void =
    typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : id => clearTimeout(id);

  const unsubscribe = emitter.subscribe(() => {
    if (!pending) {
      pending = true;
      rafId = schedule(() => {
        pending = false;
        rafId = null;
        onEvent();
      });
    }
  });

  return () => {
    if (rafId != null) {
      cancel(rafId);
    }
    unsubscribe();
  };
}

/** 虚拟滚动视口组件。 */
export const VVirtualScrollViewport = defineComponent({
  name: 'VVirtualScrollViewport',
  props: {
    /** 滚动方向：'vertical'（默认）或 'horizontal'。 */
    orientation: {
      type: String as PropType<'horizontal' | 'vertical'>,
      default: 'vertical',
    },
    /** 追加模式：已渲染项滚出视口后保留在 DOM 中。 */
    appendOnly: {type: Boolean, default: false},
    /** 使用窗口作为滚动容器（整页滚动）。 */
    scrollWindow: {type: Boolean, default: false},
    /** 条目固定尺寸（像素）；提供后自动创建固定尺寸策略。 */
    itemSize: {type: Number, default: undefined},
    /** 视口外至少保留的缓冲（像素），低于该值触发补渲染。 */
    minBufferPx: {type: Number, default: 100},
    /** 补渲染时恢复到该缓冲量（像素）。 */
    maxBufferPx: {type: Number, default: 200},
  },
  emits: {
    /** 首个可见项索引变化（与 Angular 的 scrolledIndexChange 对应）。 */
    scrolledIndexChange: (_index: number) => true,
  },
  setup(props, {slots, expose, emit}) {
    const rootEl = ref<HTMLElement | null>(null);
    const contentWrapper = ref<HTMLElement | null>(null);
    const isSelfScrollable = ref(false);

    /** 全部内容总尺寸（像素）。 */
    const totalContentSize = ref(0);
    /** 当前渲染区间。 */
    const renderedRange = ref<ListRange>({start: 0, end: 0});
    /** 渲染内容相对视口起点的 transform。 */
    const contentTransform = ref('');
    /** 视口可见尺寸（按当前方向，像素）。 */
    const viewportSize = ref(0);

    /** spacer 尺寸：横向撑宽、纵向撑高。 */
    const spacerWidth = computed(() =>
      props.orientation === 'horizontal' ? `${totalContentSize.value}px` : '',
    );
    const spacerHeight = computed(() =>
      props.orientation === 'horizontal' ? '' : `${totalContentSize.value}px`,
    );

    const renderedRangeStream = new Emitter<ListRange>();
    const renderedContentOffsetStream = new Emitter<number>();
    const detachedSubject = new Emitter<void>();
    const elementScrolledStream = new Emitter<Event>();

    let dataLength = 0;
    let renderedContentOffset = 0;
    let renderedContentOffsetNeedsRewrite = false;
    let destroyed = false;
    let scrollable: VirtualScrollable | null = null;
    let scrollCleanup: (() => void) | undefined;
    let resizeCleanup: (() => void) | undefined;
    let repeater: CdkVirtualScrollRepeater<unknown> | null = null;
    let repeaterDataCleanup: (() => void) | undefined;
    let strategyCleanup: (() => void) | undefined;
    let afterRenderQueue: (() => void)[] = [];
    let afterRenderScheduled = false;

    // 策略优先级与 Angular 一致：提供 itemSize 时使用固定尺寸策略，
    // 否则使用父级注入的自定义策略；两者皆无时抛错。
    const strategy: VirtualScrollStrategy = (() => {
      if (props.itemSize != null) {
        return new FixedSizeVirtualScrollStrategy(
          props.itemSize,
          props.minBufferPx,
          props.maxBufferPx,
        );
      }
      const injected = inject(VIRTUAL_SCROLL_STRATEGY, null);
      if (!injected) {
        throw new Error(
          'Error: VVirtualScrollViewport requires the "itemSize" property or an injected VirtualScrollStrategy.',
        );
      }
      return injected;
    })();

    /** itemSize/minBufferPx/maxBufferPx 变化时同步固定尺寸策略。 */
    watch(
      () => [props.itemSize, props.minBufferPx, props.maxBufferPx],
      () => {
        if (strategy instanceof FixedSizeVirtualScrollStrategy) {
          strategy.updateItemAndBufferSize(
            props.itemSize ?? 0,
            props.minBufferPx,
            props.maxBufferPx,
          );
        }
      },
    );

    /** 注册重复器并订阅其数据流，数据长度变化时通知策略。 */
    function attachRepeater(forOf: CdkVirtualScrollRepeater<unknown>): void {
      if (repeater) {
        throw new Error('VVirtualScrollViewport is already attached.');
      }
      repeater = forOf;
      repeaterDataCleanup = forOf.dataStream.subscribe(data => {
        const newLength = data.length;
        if (newLength !== dataLength) {
          dataLength = newLength;
          strategy.onDataLengthChanged();
        }
        scheduleAfterRender();
      });
    }

    /** 注销重复器并停止其数据订阅。 */
    function detachRepeater(): void {
      repeaterDataCleanup?.();
      repeaterDataCleanup = undefined;
      repeater = null;
      detachedSubject.next();
    }

    function getDataLength(): number {
      return dataLength;
    }

    function getViewportSize(): number {
      return viewportSize.value;
    }

    function getRenderedRange(): ListRange {
      return renderedRange.value;
    }

    /** 设置总内容尺寸并更新 spacer。 */
    function setTotalContentSize(size: number): void {
      if (totalContentSize.value !== size) {
        totalContentSize.value = size;
      }
    }

    /**
     * 设置渲染区间。appendOnly 模式只增不减，起点始终为 0。
     * 区间写入并派发后，在下一渲染周期回调策略的 onContentRendered。
     */
    function setRenderedRange(range: ListRange): void {
      if (!rangesEqual(renderedRange.value, range)) {
        if (props.appendOnly) {
          range = {start: 0, end: Math.max(renderedRange.value.end, range.end)};
        }
        renderedRange.value = range;
        renderedRangeStream.next(range);
        scheduleAfterRender(() => strategy.onContentRendered());
      }
    }

    /** 当前渲染内容相对视口起点的偏移；待重写时返回 null。 */
    function getOffsetToRenderedContentStart(): number | null {
      return renderedContentOffsetNeedsRewrite ? null : renderedContentOffset;
    }

    /**
     * 设置渲染内容偏移（transform 位移）。
     * to-end 表示相对内容末尾偏移，下一次渲染周期会重写为起点偏移。
     */
    function setRenderedContentOffset(offset: number, to: 'to-start' | 'to-end' = 'to-start') {
      // appendOnly 模式始终从顶部开始，起点偏移固定为 0。
      offset = props.appendOnly && to === 'to-start' ? 0 : offset;

      // RTL 横向滚动时 transform 沿 x 轴取负方向。
      const isRtl = getDirection(rootEl.value) === 'rtl';
      const axis = props.orientation === 'horizontal' ? 'X' : 'Y';
      const axisDirection = props.orientation === 'horizontal' && isRtl ? -1 : 1;
      let transform = `translate${axis}(${Number(axisDirection * offset)}px)`;
      renderedContentOffset = offset;
      if (to === 'to-end') {
        transform += ` translate${axis}(-100%)`;
        // 末尾偏移会在渲染后重写为起点偏移，否则内容会在错误方向上扩张。
        renderedContentOffsetNeedsRewrite = true;
      }
      if (contentTransform.value !== transform) {
        contentTransform.value = transform;
        scheduleAfterRender(() => {
          if (renderedContentOffsetNeedsRewrite) {
            renderedContentOffset -= measureRenderedContentSize();
            renderedContentOffsetNeedsRewrite = false;
            setRenderedContentOffset(renderedContentOffset);
          } else {
            strategy.onRenderedOffsetChanged();
          }
        });
      }
    }

    /** 从视口起点测量滚动偏移（默认按方向取 top/start）。 */
    function measureScrollOffset(
      from?: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end',
    ): number {
      if (!scrollable) {
        return 0;
      }
      const defaultFrom = props.orientation === 'horizontal' ? 'start' : 'top';
      return Math.max(
        0,
        scrollable.measureScrollOffset(from ?? defaultFrom) - measureViewportOffset(),
      );
    }

    /** 测量视口相对滚动容器的偏移（自滚动时为 0）。 */
    function measureViewportOffset(
      from?: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end',
    ): number {
      const root = rootEl.value;
      if (!root || !scrollable) {
        return 0;
      }
      let fromRect: 'left' | 'top' | 'right' | 'bottom';
      const isRtl = getDirection(root) === 'rtl';
      if (from === 'start') {
        fromRect = isRtl ? 'right' : 'left';
      } else if (from === 'end') {
        fromRect = isRtl ? 'left' : 'right';
      } else if (from) {
        fromRect = from;
      } else {
        fromRect = props.orientation === 'horizontal' ? 'left' : 'top';
      }

      const scrollerClientRect = scrollable.measureBoundingClientRectWithScrollOffset(fromRect);
      const viewportClientRect = root.getBoundingClientRect()[fromRect];
      return viewportClientRect - scrollerClientRect;
    }

    /** 测量 content-wrapper 当前实际尺寸（按方向）。 */
    function measureRenderedContentSize(): number {
      const contentEl = contentWrapper.value;
      if (!contentEl) {
        return 0;
      }
      return props.orientation === 'horizontal' ? contentEl.offsetWidth : contentEl.offsetHeight;
    }

    /** 测量指定渲染区间的组合尺寸；区间含未渲染项时抛错。 */
    function measureRangeSize(range: ListRange): number {
      if (!repeater) {
        return 0;
      }
      return repeater.measureRangeSize(range, props.orientation);
    }

    /** 滚动到视口起点偏移。 */
    function scrollToOffset(offset: number, behavior: ScrollBehavior = 'auto') {
      const options: Record<string, unknown> = {behavior};
      if (props.orientation === 'horizontal') {
        options.start = offset;
      } else {
        options.top = offset;
      }
      scrollable?.scrollTo(options as unknown as ExtendedScrollToOptions);
    }

    /** 滚动到指定索引（由策略换算偏移）。 */
    function scrollToIndex(index: number, behavior: ScrollBehavior = 'auto') {
      strategy.scrollToIndex(index, behavior);
    }

    /** 视口尺寸变化后重新测量并重算渲染。 */
    function checkViewportSize() {
      _measureViewportSize();
      strategy.onDataLengthChanged();
    }

    function _measureViewportSize() {
      viewportSize.value = scrollable?.measureViewportSize(props.orientation) ?? 0;
    }

    /** 排队到下次渲染周期执行的回调（对应 Angular 的 afterNextRender）。 */
    function scheduleAfterRender(fn?: () => void) {
      if (fn) {
        afterRenderQueue.push(fn);
      }
      if (afterRenderScheduled) {
        return;
      }
      afterRenderScheduled = true;
      void nextTick(() => {
        afterRenderScheduled = false;
        if (destroyed) {
          return;
        }
        const offset = getOffsetToRenderedContentStart();
        if (offset != null) {
          renderedContentOffsetStream.next(offset);
        }
        const fns = afterRenderQueue;
        afterRenderQueue = [];
        for (const fn of fns) {
          fn();
        }
      });
    }

    const api: VirtualScrollViewportAdapter = {
      getDataLength,
      getViewportSize,
      getRenderedRange,
      measureScrollOffset,
      setTotalContentSize,
      setRenderedRange,
      setRenderedContentOffset,
      scrollToOffset,
    };

    const viewportApi: VirtualScrollViewportApi = {
      attachRepeater,
      detachRepeater,
      renderedRangeStream,
    };

    provide(CDK_VIRTUAL_SCROLL_VIEWPORT, viewportApi);

    strategyCleanup = strategy.scrolledIndexChange.subscribe(index =>
      emit('scrolledIndexChange', index),
    );

    onMounted(() => {
      // 延迟到微任务初始化：保证子组件（VVirtualFor）先完成 attach，
      // 首次渲染区间计算时数据长度已经就绪。
      void Promise.resolve().then(() => {
        if (destroyed) {
          return;
        }
        const root = rootEl.value;
        if (!root) {
          return;
        }

        if (props.scrollWindow) {
          scrollable = new VirtualScrollableWindow();
        } else {
          const ancestorScrollable = findVirtualScrollableElement(root);
          if (ancestorScrollable) {
            scrollable = ancestorScrollable;
          } else {
            isSelfScrollable.value = true;
            root.classList.add('vcdk-virtual-scrollable');
            scrollable = new VirtualScrollableViewport(() => root);
          }
        }

        scrollable.attach();
        _measureViewportSize();
        strategy.attach(api);

        // 滚动事件：转发给公共流，并按帧合并后驱动策略重算。
        const elementScrolledUnsubscribe = scrollable
          .elementScrolled()
          .subscribe(event => elementScrolledStream.next(event));
        const rafCleanup = rafAudit(scrollable.elementScrolled(), () => {
          strategy.onContentScrolled();
        });
        scrollCleanup = () => {
          rafCleanup();
          elementScrolledUnsubscribe();
        };

        // 视口尺寸变化（resize/orientationchange）时重新测量。
        resizeCleanup = viewportRuler.change().subscribe(() => checkViewportSize());
      });
    });

    onBeforeUnmount(() => {
      destroyed = true;
      detachRepeater();
      strategy.detach();
      scrollCleanup?.();
      resizeCleanup?.();
      scrollable?.destroy();
      strategyCleanup?.();
      renderedRangeStream.complete();
      renderedContentOffsetStream.complete();
      detachedSubject.complete();
      elementScrolledStream.complete();
    });

    expose({
      getDataLength,
      getViewportSize,
      getRenderedRange,
      measureScrollOffset,
      measureViewportOffset,
      measureRenderedContentSize,
      measureRangeSize,
      scrollToOffset,
      scrollToIndex,
      checkViewportSize,
      setTotalContentSize,
      setRenderedRange,
      setRenderedContentOffset,
      getOffsetToRenderedContentStart,
      elementScrolled: () => elementScrolledStream,
    });

    return () => {
      const rootClass = [
        'vcdk-virtual-scroll-viewport',
        props.orientation === 'horizontal'
          ? 'vcdk-virtual-scroll-orientation-horizontal'
          : 'vcdk-virtual-scroll-orientation-vertical',
        {'vcdk-virtual-scrollable': isSelfScrollable.value},
      ];

      return h('div', {class: rootClass, ref: rootEl}, [
        h(
          'div',
          {
            class: 'vcdk-virtual-scroll-content-wrapper',
            ref: contentWrapper,
            style: {transform: contentTransform.value},
          },
          slots.default?.(),
        ),
        h('div', {
          class: 'vcdk-virtual-scroll-spacer',
          style: {width: spacerWidth.value, height: spacerHeight.value},
        }),
      ]);
    };
  },
});
