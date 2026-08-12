/**
 * 虚拟列表渲染组件，对应 Angular CDK 的 *cdkVirtualFor。
 *
 * 用法（必须位于 VVirtualScrollViewport 内部，且通常作为其唯一子内容）：
 * ```vue
 * <VVirtualScrollViewport item-size="50">
 *   <VVirtualFor :of="items" v-slot="{item, index}">
 *     <div class="row">{{ index }}: {{ item }}</div>
 *   </VVirtualFor>
 * </VVirtualScrollViewport>
 * ```
 *
 * 插槽上下文与 Angular 一致：item/$implicit/of/index/count/first/last/even/odd。
 * 数据源支持数组、Ref/响应式数组与 DataSource 接口。
 */

import {
  cloneVNode,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  unref,
  watch,
  type PropType,
  type Ref,
} from 'vue';
import {Emitter} from '../emitter';
import {
  isDataSource,
  type CollectionViewer,
  type DataSource,
  type ListRange,
} from '../collections';
import {CDK_VIRTUAL_SCROLL_VIEWPORT} from './virtual-scroll-viewport';
import type {CdkVirtualScrollRepeater} from './virtual-scroll-repeater';

/** VVirtualFor 支持的数据源形态。 */
export type VirtualForSource<T> =
  | DataSource<T>
  | readonly T[]
  | Ref<readonly T[]>;

/** 单个渲染项的插槽上下文，字段语义与 Angular cdkVirtualFor 一致。 */
export interface VirtualForContext<T = unknown> {
  /** 当前条目（$implicit 的别名）。 */
  item: T;
  /** 与 Angular 一致的隐式值，等价于 item。 */
  $implicit: T;
  /** 传给 :of 的原始数据源。 */
  of: VirtualForSource<T>;
  /** 条目在完整数据中的索引。 */
  index: number;
  /** 数据总条数。 */
  count: number;
  /** 是否第一条。 */
  first: boolean;
  /** 是否最后一条。 */
  last: boolean;
  /** 索引是否为偶数。 */
  even: boolean;
  /** 索引是否为奇数。 */
  odd: boolean;
}

/** trackBy 函数签名：index 为完整数据中的索引。 */
export type VirtualForTrackBy<T> = (index: number, item: T) => unknown;

/** 提取 DOM 节点在指定方向上的起点/终点坐标。 */
function getOffset(
  orientation: 'horizontal' | 'vertical',
  direction: 'start' | 'end',
  node: Node,
): number {
  const el = node as Element;
  if (!el.getBoundingClientRect) {
    return 0;
  }
  const rect = el.getBoundingClientRect();
  return orientation === 'horizontal'
    ? direction === 'start'
      ? rect.left
      : rect.right
    : direction === 'start'
      ? rect.top
      : rect.bottom;
}

/** 虚拟列表渲染组件。 */
export const VVirtualFor = defineComponent({
  name: 'VVirtualFor',
  props: {
    /** 数据源：数组、Ref/响应式数组或 DataSource。 */
    of: {
      // 泛型数据源无法在组件 prop 上表达（Vue 组件非泛型），
      // 运行时按结构处理，类型信息由插槽上下文透出。
      type: [Object, Array, Function] as PropType<unknown>,
      required: true,
    },
    /** trackBy：以数据索引与条目计算稳定身份，用于复用渲染实例。 */
    trackBy: {
      type: Function as PropType<VirtualForTrackBy<unknown> | undefined>,
      default: undefined,
    },
    /**
     * 模板缓存容量，仅用于保持与 Angular API 一致。
     * Vue 渲染器基于 key 自动复用/回收 vnode，无需手动管理缓存。
     */
    templateCacheSize: {type: Number, default: 20},
  },
  setup(props, {slots}) {
    const viewport = inject(CDK_VIRTUAL_SCROLL_VIEWPORT, null);
    if (!viewport) {
      throw new Error('Error: VVirtualFor must be used inside a VVirtualScrollViewport.');
    }
    // 窄化后的引用：闭包内保留非空类型。
    const viewportApi = viewport;

    /** 当前完整数据。 */
    const data = ref<readonly unknown[]>([]);
    /** 当前渲染区间（含 start、不含 end）。 */
    const renderedRange = ref<ListRange>({start: 0, end: 0});

    /** 供视口订阅的数据流；数据变化时派发。 */
    const dataEmitter = new Emitter<readonly unknown[]>();
    /** CollectionViewer 接口：查看区间变化流。 */
    const viewChange = new Emitter<ListRange>();

    /** 按渲染位置记录条目根元素，用于 measureRangeSize。 */
    const renderedElements: (HTMLElement | null)[] = [];

    let dataStreamCleanup: (() => void) | undefined;
    let rangeCleanup: (() => void) | undefined;
    let activeDataSource: DataSource<unknown> | null = null;

    const viewer: CollectionViewer = {viewChange};

    /**
     * 切换数据源：
     * - DataSource：connect 后订阅其事件流；
     * - 数组/Ref/响应式数组：深度 watch，原地增删改均会派发。
     */
    function setupDataStream(source: unknown): void {
      dataStreamCleanup?.();
      dataStreamCleanup = undefined;

      if (isDataSource(source)) {
        activeDataSource = source as DataSource<unknown>;
        const stream = source.connect(viewer);
        dataStreamCleanup = stream.subscribe(values => {
          data.value = values;
          dataEmitter.next(values);
        });
      } else {
        activeDataSource = null;
        const sourceRef = source as readonly unknown[] | Ref<readonly unknown[]>;
        dataStreamCleanup = watch(
          () => unref(sourceRef) ?? [],
          values => {
            data.value = values;
            dataEmitter.next(values);
          },
          {immediate: true, deep: true},
        );
      }
    }

    /** 数据源引用变化（整体替换）时重建数据流。 */
    watch(() => props.of, setupDataStream);
    // 首次进入即建立数据流（watch immediate 在 setup 阶段同步派发首帧数据）。
    setupDataStream(props.of);

    /** 测量指定渲染区间的组合尺寸；区间含未渲染项时抛错。 */
    function measureRangeSize(
      range: ListRange,
      orientation: 'horizontal' | 'vertical',
    ): number {
      if (range.start >= range.end) {
        return 0;
      }
      if (
        range.start < renderedRange.value.start ||
        range.end > renderedRange.value.end
      ) {
        throw new Error(`Error: attempted to measure an item that isn't rendered.`);
      }

      const startIndex = range.start - renderedRange.value.start;
      const rangeLen = range.end - range.start;
      let firstNode: HTMLElement | undefined;
      let lastNode: HTMLElement | undefined;

      for (let i = 0; i < rangeLen; i++) {
        const el = renderedElements[startIndex + i];
        if (el) {
          firstNode = el;
          break;
        }
      }
      for (let i = rangeLen - 1; i > -1; i--) {
        const el = renderedElements[startIndex + i];
        if (el) {
          lastNode = el;
          break;
        }
      }

      return firstNode && lastNode
        ? getOffset(orientation, 'end', lastNode) - getOffset(orientation, 'start', firstNode)
        : 0;
    }

    /** 注册到视口并订阅渲染区间变化。 */
    function attach(): void {
      rangeCleanup = viewportApi.renderedRangeStream.subscribe(range => {
        renderedRange.value = range;
        if (viewChange.hasListeners) {
          viewChange.next(range);
        }
      });

      viewportApi.attachRepeater(repeater);

      // 先完成注册再补发当前数据：视口在 setup 阶段已派发过首帧数据
      // （watch immediate），此时补发保证刚建立的 dataStream 订阅能收到。
      dataEmitter.next(data.value);
    }

    function detach(): void {
      rangeCleanup?.();
      rangeCleanup = undefined;
      viewportApi.detachRepeater();
      dataStreamCleanup?.();
      dataStreamCleanup = undefined;
      activeDataSource?.disconnect(viewer);
      activeDataSource = null;
      viewChange.complete();
      dataEmitter.complete();
    }

    const repeater: CdkVirtualScrollRepeater<unknown> = {
      dataStream: dataEmitter,
      measureRangeSize,
    };

    onMounted(attach);
    onBeforeUnmount(detach);

    return () => {
      const start = renderedRange.value.start;
      const end = renderedRange.value.end;
      const items = data.value.slice(start, end);
      const count = data.value.length;
      const slot = slots.default;

      // 收缩元素索引数组，保证 measureRangeSize 与渲染区间一致。
      renderedElements.length = items.length;

      return items.map((item, offset) => {
        const index = start + offset;
        const context: VirtualForContext = {
          item,
          $implicit: item,
          of: props.of as VirtualForSource<unknown>,
          index,
          count,
          first: index === 0,
          last: index === count - 1,
          even: index % 2 === 0,
          odd: index % 2 !== 0,
        };

        const slotResult = slot?.(context);
        if (!slotResult) {
          return null;
        }
        // 插槽可能返回数组，本组件按单根节点处理，取第一个 vnode。
        const child = Array.isArray(slotResult) ? slotResult[0] : slotResult;
        const key = props.trackBy ? props.trackBy(index, item) : item;

        return cloneVNode(child, {
          ref: (el: unknown) => {
            renderedElements[offset] = (el as HTMLElement | null) ?? null;
          },
          key: key as string | number | symbol,
        });
      });
    };
  },
});
