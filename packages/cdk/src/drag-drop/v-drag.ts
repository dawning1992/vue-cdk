/**
 * 拖拽条目组件，对应 Angular CDK 的 CdkDrag。
 * 单根渲染（tag prop 可换标签），attrs 透传到根元素；
 * 支持 #preview / #placeholder 插槽自定义拖拽辅助元素。
 */

import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  Fragment,
  render,
  type PropType,
  type Ref,
  type Slot,
} from 'vue';
import {coerceElement, coerceNumberProperty} from '../coercion';
import {getDirection} from '../scrolling/directionality';
import {createDragRef, type DragConstrainPosition, type DragRef, type Point, type PreviewContainer} from './drag-ref';
import type {DragPreviewTemplate} from './drag-ref';
import type {DragStartDelay, DragAxis} from './config';
import type {VDragStart, VDragRelease, VDragEnd, VDragEnter, VDragExit, VDragDrop, VDragMove} from './drag-events';
import {dragDropRegistry} from './drag-drop-registry';
import {VCDK_DROP_LIST_CONTEXT, type VDropListPublicApi} from './v-drop-list';

/** 拖拽条目对外暴露的公共 API（与 defineExpose 及事件载荷中的 item/source 一致）。 */
export interface VDragPublicApi<T = any> {
  /** 附加到条目的任意数据。 */
  readonly data: unknown;
  /** 底层 DragRef。 */
  readonly dragRef: DragRef<VDragPublicApi<T>>;
  getPlaceholderElement(): HTMLElement;
  getRootElement(): HTMLElement;
  getFreeDragPosition(): Readonly<Point>;
  setFreeDragPosition(value: Point): void;
  reset(): void;
  resetToBoundary(): void;
  /** 注册 handle（由 vDragHandle 指令调用）。 */
  _addHandle(handle: DragHandleRef): void;
  /** 注销 handle。 */
  _removeHandle(handle: DragHandleRef): void;
}

/** vDragHandle 指令注册的 handle 引用。 */
export interface DragHandleRef {
  element: HTMLElement;
  disabled: boolean;
}

/**
 * 把插槽内容渲染为可插入 DOM 的辅助元素（预览/占位符）。
 * 单根时返回元素本身，多根时返回包裹容器（与 Angular getRootNode 语义一致）。
 */
function createSlotTemplate(
  slot: Slot | undefined,
  data: unknown,
  matchSize = false,
): DragPreviewTemplate | null {
  if (!slot) {
    return null;
  }

  let host: HTMLDivElement | null = null;
  return {
    matchSize,
    render: () => {
      host = document.createElement('div');
      const vnodes = slot({data});
      render(h(Fragment, null, vnodes), host);
      return host.childElementCount === 1 ? (host.firstElementChild as HTMLElement) : host;
    },
    destroy: () => {
      if (host) {
        render(null, host);
        host = null;
      }
    },
  };
}

/**
 * 拖拽条目组件。
 * props 与 emits 对齐 Angular CdkDrag（去掉 cdkDrag 前缀），
 * 事件载荷字段与 Angular 完全一致。
 */
export const VDrag = defineComponent({
  name: 'VDrag',
  props: {
    /** 附加到条目的任意数据。 */
    data: {type: null, default: undefined},
    /** 锁定拖拽的轴。 */
    lockAxis: {type: String as PropType<DragAxis | null>, default: null},
    /** 从条目向上匹配根拖拽元素的选择器。 */
    rootElementSelector: {type: String, default: null},
    /** 位置约束边界：选择器 / 元素 / 元素 ref。 */
    boundaryElement: {
      type: [String, Object] as PropType<string | HTMLElement | Ref<HTMLElement | null | undefined>>,
      default: null,
    },
    /** 按下后等待多少毫秒才开启拖拽。 */
    dragStartDelay: {
      type: [Number, Object] as PropType<DragStartDelay | undefined>,
      default: undefined,
    },
    /** 容器外拖拽的初始位置。 */
    freeDragPosition: {type: Object as PropType<Point | undefined>, default: undefined},
    /** 是否禁用拖拽。 */
    disabled: {type: Boolean, default: false},
    /** 自定义位置约束函数。 */
    constrainPosition: {
      type: Function as PropType<DragConstrainPosition | undefined>,
      default: undefined,
    },
    /** 追加到预览的类名。 */
    previewClass: {type: [String, Array] as PropType<string | string[] | undefined>, default: undefined},
    /** 预览插入位置：global / parent / 指定元素。 */
    previewContainer: {
      type: [String, Object] as PropType<PreviewContainer | undefined>,
      default: undefined,
    },
    /** 父元素 scale 修正。 */
    scale: {type: Number, default: 1},
    /** 自定义预览是否对齐原条目尺寸。 */
    previewMatchSize: {type: Boolean, default: false},
    /** 根元素标签。 */
    tag: {type: String, default: 'div'},
  },
  emits: {
    started: (_payload: VDragStart) => true,
    released: (_payload: VDragRelease) => true,
    ended: (_payload: VDragEnd) => true,
    entered: (_payload: VDragEnter) => true,
    exited: (_payload: VDragExit) => true,
    dropped: (_payload: VDragDrop) => true,
    moved: (_payload: VDragMove) => true,
  },
  setup(props, {slots, attrs, expose, emit}) {
    const rootEl = ref<HTMLElement | null>(null);

    let dragRef: DragRef<VDragPublicApi> | null = null;
    const dragging = ref(false);
    const handles: DragHandleRef[] = [];
    const listContext = inject(VCDK_DROP_LIST_CONTEXT, null);
    const disabled = computed(
      () => props.disabled || !!listContext?.disabled.value,
    );
    let parentResolved = false;
    const unsubs: (() => void)[] = [];

    /** 解析根拖拽元素（rootElementSelector 从条目向上匹配）。 */
    function resolveRootElement(): HTMLElement {
      const element = rootEl.value!;
      return props.rootElementSelector
        ? (element.closest(props.rootElementSelector) as HTMLElement) || element
        : element;
    }

    /** 解析边界元素：选择器从条目向上匹配，元素/ref 直接归一。 */
    function resolveBoundaryElement(): HTMLElement | null {
      const boundary = props.boundaryElement;
      if (!boundary) {
        return null;
      }
      if (typeof boundary === 'string') {
        return rootEl.value!.closest<HTMLElement>(boundary);
      }
      return coerceElement(boundary);
    }

    /** 在 beforeStarted 同步全部输入（与 Angular CdkDrag 的同步时机一致）。 */
    function syncInputs() {
      const ref = dragRef;
      if (!ref) {
        return;
      }

      ref.disabled = disabled.value;
      ref.lockAxis = props.lockAxis;
      ref.scale = props.scale;
      ref.dragStartDelay =
        typeof props.dragStartDelay === 'object' && props.dragStartDelay
          ? props.dragStartDelay
          : coerceNumberProperty(props.dragStartDelay);
      ref.constrainPosition = props.constrainPosition;
      ref.previewClass = props.previewClass;
      ref
        .withBoundaryElement(resolveBoundaryElement())
        .withPlaceholderTemplate(createSlotTemplate(slots.placeholder, props.data))
        .withPreviewTemplate(createSlotTemplate(slots.preview, props.data, props.previewMatchSize))
        .withPreviewContainer(props.previewContainer || 'global');
      ref.withDirection(getDirection(rootEl.value));
      ref.withHandles(handles.map(handle => handle.element));
      handles.forEach(handle =>
        handle.disabled ? ref.disableHandle(handle.element) : ref.enableHandle(handle.element),
      );

      // 嵌套拖拽：首次拖拽前沿 DOM 向上查找父条目。
      if (!parentResolved) {
        parentResolved = true;
        let parent = rootEl.value!.parentElement;
        while (parent) {
          const parentDrag = dragDropRegistry.getDragDirectiveForNode(parent) as
            | VDragPublicApi
            | null;
          if (parentDrag) {
            ref.withParent(parentDrag.dragRef);
            break;
          }
          parent = parent.parentElement;
        }
      }
    }

    const publicApi: VDragPublicApi = {
      get data() {
        return props.data;
      },
      get dragRef() {
        return dragRef!;
      },
      getPlaceholderElement: () => dragRef!.getPlaceholderElement(),
      getRootElement: () => dragRef!.getRootElement(),
      getFreeDragPosition: () => dragRef!.getFreeDragPosition(),
      setFreeDragPosition: value => dragRef!.setFreeDragPosition(value),
      reset: () => dragRef!.reset(),
      resetToBoundary: () => dragRef!.resetToBoundary(),
      _addHandle: handle => {
        handles.push(handle);
      },
      _removeHandle: handle => {
        const index = handles.indexOf(handle);
        if (index > -1) {
          handles.splice(index, 1);
        }
      },
    };
    expose(publicApi);

    onMounted(async () => {
      dragRef = createDragRef<VDragPublicApi>(resolveRootElement());
      dragRef.data = publicApi;
      dragDropRegistry.registerDirectiveNode(rootEl.value!, publicApi);
      listContext?.addItem(publicApi);

      unsubs.push(
        dragRef.beforeStarted.subscribe(() => {
          if (!dragRef!.isDragging()) {
            syncInputs();
          }
        }),
      );
      unsubs.push(
        dragRef.started.subscribe(event => {
          dragging.value = true;
          emit('started', {source: publicApi, event: event.event});
        }),
      );
      unsubs.push(
        dragRef.released.subscribe(event => {
          emit('released', {source: publicApi, event: event.event});
        }),
      );
      unsubs.push(
        dragRef.ended.subscribe(event => {
          dragging.value = false;
          emit('ended', {
            source: publicApi,
            distance: event.distance,
            dropPoint: event.dropPoint,
            event: event.event,
          });
        }),
      );
      unsubs.push(
        dragRef.entered.subscribe(event => {
          emit('entered', {
            container: event.container.data as VDropListPublicApi,
            item: publicApi,
            currentIndex: event.currentIndex,
          });
        }),
      );
      unsubs.push(
        dragRef.exited.subscribe(event => {
          emit('exited', {
            container: event.container.data as VDropListPublicApi,
            item: publicApi,
          });
        }),
      );
      unsubs.push(
        dragRef.dropped.subscribe(event => {
          emit('dropped', {
            previousIndex: event.previousIndex,
            currentIndex: event.currentIndex,
            previousContainer: event.previousContainer.data as VDropListPublicApi,
            container: event.container.data as VDropListPublicApi,
            item: publicApi,
            isPointerOverContainer: event.isPointerOverContainer,
            distance: event.distance,
            dropPoint: event.dropPoint,
            event: event.event,
          });
        }),
      );
      unsubs.push(
        dragRef.moved.subscribe(event => {
          emit('moved', {
            source: publicApi,
            pointerPosition: event.pointerPosition,
            event: event.event,
            distance: event.distance,
            delta: event.delta,
          });
        }),
      );

      if (props.freeDragPosition) {
        dragRef.setFreeDragPosition(props.freeDragPosition);
      }
      syncInputs();
      await nextTick();
    });

    onBeforeUnmount(() => {
      unsubs.forEach(unsubscribe => unsubscribe());
      listContext?.removeItem(publicApi);
      if (rootEl.value) {
        dragDropRegistry.removeDirectiveNode(rootEl.value);
      }
      dragRef?.dispose();
      dragRef = null;
    });

    watch(
      () => [props.rootElementSelector, props.freeDragPosition, props.scale],
      () => {
        if (!dragRef) {
          return;
        }
        if (props.rootElementSelector) {
          dragRef.withRootElement(resolveRootElement());
        }
        dragRef.scale = props.scale;
        if (props.freeDragPosition) {
          dragRef.setFreeDragPosition(props.freeDragPosition);
        }
      },
    );

    return () => {
      const classes = [
        attrs.class,
        'vcdk-drag',
        {
          'vcdk-drag-dragging': dragging.value,
          'vcdk-drag-disabled': disabled.value,
        },
      ];
      return h(props.tag, {...attrs, class: classes, ref: rootEl}, slots.default?.());
    };
  },
});
