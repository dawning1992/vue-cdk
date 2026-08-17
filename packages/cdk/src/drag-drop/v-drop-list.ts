/**
 * 拖放容器组件，对应 Angular CDK 的 CdkDropList。
 * 单根渲染（tag prop 可换标签），attrs 透传到根元素；
 * 通过 provide 向子 VDrag 提供注册上下文。
 */

import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type InjectionKey,
  type PropType,
  type Ref,
} from 'vue';
import {coerceArray, coerceNumberProperty} from '../coercion';
import {getDirection} from '../bidi';
import {scrollDispatcher} from '../scrolling/scroll-dispatcher';
import {createDropListRef, type DropListRef} from './drop-list-ref';
import type {DragRef} from './drag-ref';
import type {DragAxis, DropListOrientation} from './config';
import type {VDragDrop, VDragEnter, VDragExit, VDragSortEvent} from './drag-events';
import type {VDragPublicApi} from './v-drag';
import {VCDK_DROP_LIST_GROUP} from './v-drop-list-group';

/** 拖放列表对外暴露的公共 API（与 defineExpose 及事件载荷中的 container 一致）。 */
export interface VDropListPublicApi<T = any> {
  /** 列表唯一 id（connectedTo 可按 id 引用）。 */
  readonly id: string;
  /** 附加到列表的任意数据。 */
  readonly data: unknown;
  /** 底层 DropListRef。 */
  readonly dropListRef: DropListRef<VDropListPublicApi<T>>;
  /** 是否禁用（含所属 group 的禁用状态）。 */
  readonly disabled: Readonly<Ref<boolean>>;
  /** 按 DOM 顺序返回已注册条目。 */
  getSortedItems(): VDragPublicApi[];
  /** 注册条目（由子 VDrag 调用）。 */
  _addItem(item: VDragPublicApi): void;
  /** 注销条目（由子 VDrag 卸载时调用）。 */
  _removeItem(item: VDragPublicApi): void;
}

/** VDrag 获取所属容器的注入上下文。 */
export interface VDropListContext {
  dropListRef: DropListRef | null;
  disabled: Readonly<Ref<boolean>>;
  addItem(item: VDragPublicApi): void;
  removeItem(item: VDragPublicApi): void;
}

/** VDropList 上下文注入键。 */
export const VCDK_DROP_LIST_CONTEXT: InjectionKey<VDropListContext> = Symbol('vcdk-drop-list');

/** 页面上的拖放列表静态注册表：connectedTo 按 id 引用时使用。 */
export const dropListRegistry = new Set<VDropListPublicApi>();

let dropListId = 0;

/** 按 id 查找注册表里的列表。 */
function findDropListById(id: string): VDropListPublicApi | undefined {
  return Array.from(dropListRegistry).find(list => list.id === id);
}

/**
 * 拖放容器组件。
 * props 与 emits 对齐 Angular CdkDropList（去掉 cdkDropList 前缀），
 * 事件载荷字段与 Angular 完全一致。
 */
export const VDropList = defineComponent({
  name: 'VDropList',
  props: {
    /** 附加到容器的任意数据。 */
    data: {type: null, default: undefined},
    /** 列表朝向：vertical / horizontal / mixed。 */
    orientation: {type: String as PropType<DropListOrientation>, default: 'vertical'},
    /** 是否禁用从本列表发起拖拽。 */
    disabled: {type: Boolean, default: false},
    /** 是否禁用列表内排序。 */
    sortingDisabled: {type: Boolean, default: false},
    /** 锁定容器内条目移动的轴。 */
    lockAxis: {type: String as PropType<DragAxis | null>, default: null},
    /** 连接的兄弟容器：实例或 id 字符串（数组）。 */
    connectedTo: {
      type: [Object, Array, String] as PropType<
        VDropListPublicApi | string | (VDropListPublicApi | string)[]
      >,
      default: () => [],
    },
    /** 判定条目能否移入本容器。 */
    enterPredicate: {
      type: Function as PropType<(drag: VDragPublicApi, drop: VDropListPublicApi) => boolean>,
      default: () => () => true,
    },
    /** 判定条目能否被排入指定索引。 */
    sortPredicate: {
      type: Function as PropType<
        (index: number, drag: VDragPublicApi, drop: VDropListPublicApi) => boolean
      >,
      default: () => () => true,
    },
    /** 是否禁用边缘自动滚动。 */
    autoScrollDisabled: {type: Boolean, default: false},
    /** 自动滚动每帧像素数。 */
    autoScrollStep: {type: Number, default: 2},
    /** 条目元素替代容器的选择器（须为列表后代）。 */
    elementContainerSelector: {type: String, default: null},
    /** 条目离开初始容器后是否保留锚点节点。 */
    hasAnchor: {type: Boolean, default: false},
    /** 列表 id，缺省自动生成（供 connectedTo 引用）。 */
    id: {type: String, default: ''},
    /** 根元素标签。 */
    tag: {type: String, default: 'div'},
  },
  emits: {
    dropped: (_payload: VDragDrop) => true,
    entered: (_payload: VDragEnter) => true,
    exited: (_payload: VDragExit) => true,
    sorted: (_payload: VDragSortEvent) => true,
  },
  setup(props, {slots, attrs, expose, emit}) {
    const rootEl = ref<HTMLElement | null>(null);

    let dropListRef: DropListRef<VDropListPublicApi> | null = null;
    const dragging = ref(false);
    const receiving = ref(false);
    const ownDisabled = ref(props.disabled);
    const group = inject(VCDK_DROP_LIST_GROUP, null);
    const disabled = computed(() => ownDisabled.value || !!group?.disabled.value);
    const id = props.id || `vcdk-drop-list-${dropListId++}`;

    /** 已注册条目（按 DOM 顺序排序）。 */
    const unsortedItems = new Set<VDragPublicApi>();
    let scrollableParentsResolved = false;
    let latestSortedRefs: DragRef[] | undefined;
    const unsubs: (() => void)[] = [];

    const context: VDropListContext = {
      get dropListRef() {
        return dropListRef;
      },
      disabled,
      addItem: item => {
        unsortedItems.add(item);
        if (dropListRef) {
          _syncItemsWithRef(getSortedItems().map(candidate => candidate.dragRef));
        }
      },
      removeItem: item => {
        unsortedItems.delete(item);
        if (dropListRef) {
          if (latestSortedRefs) {
            const index = latestSortedRefs.indexOf(item.dragRef);
            if (index > -1) {
              latestSortedRefs.splice(index, 1);
              _syncItemsWithRef(latestSortedRefs);
            }
          } else {
            _syncItemsWithRef(getSortedItems().map(candidate => candidate.dragRef));
          }
        }
      },
    };
    provide(VCDK_DROP_LIST_CONTEXT, context);

    /** 按 DOM 顺序返回条目（与 Angular getSortedItems 语义一致）。 */
    function getSortedItems(): VDragPublicApi[] {
      return Array.from(unsortedItems).sort((a, b) => {
        const documentPosition = a.dragRef
          .getVisibleElement()
          .compareDocumentPosition(b.dragRef.getVisibleElement());
        return documentPosition & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    }

    /** 把条目同步到底层 DropListRef。 */
    function _syncItemsWithRef(items: DragRef[]) {
      latestSortedRefs = items;
      dropListRef?.withItems(items);
    }

    /** 同步 props 与解析后的连接关系到底层 ref。 */
    function sync() {
      if (!dropListRef || !rootEl.value) {
        return;
      }

      let siblings = coerceArray(props.connectedTo)
        .map(entry => (typeof entry === 'string' ? findDropListById(entry) : entry))
        .filter((entry): entry is VDropListPublicApi => !!entry);

      if (group) {
        group.items.forEach(item => {
          if (siblings.indexOf(item) === -1) {
            siblings.push(item);
          }
        });
      }

      siblings = siblings.filter(item => item !== publicApi);

      // 可滚动祖先只解析一次，避免每次拖拽遍历 DOM。
      if (!scrollableParentsResolved) {
        const scrollables = scrollDispatcher.getAncestorScrollContainers(rootEl.value);
        dropListRef.withScrollableParents(scrollables.map(scrollable => scrollable.getElementRef().nativeElement));
        scrollableParentsResolved = true;
      }

      if (props.elementContainerSelector) {
        const container = rootEl.value.querySelector(
          props.elementContainerSelector,
        ) as HTMLElement | null;
        if (!container) {
          throw new Error(
            `VDropList could not find an element container matching the selector "${props.elementContainerSelector}"`,
          );
        }
        dropListRef.withElementContainer(container);
      }

      dropListRef.disabled = disabled.value;
      dropListRef.lockAxis = props.lockAxis;
      dropListRef.sortingDisabled = props.sortingDisabled;
      dropListRef.autoScrollDisabled = props.autoScrollDisabled;
      dropListRef.autoScrollStep = coerceNumberProperty(props.autoScrollStep, 2);
      dropListRef.hasAnchor = props.hasAnchor;
      dropListRef
        .connectedTo(siblings.map(sibling => sibling.dropListRef))
        .withOrientation(props.orientation);
      dropListRef.withDirection(getDirection(rootEl.value));
      dropListRef.enterPredicate = (drag: DragRef, drop: DropListRef) =>
        props.enterPredicate(drag.data as VDragPublicApi, drop.data as VDropListPublicApi);
      dropListRef.sortPredicate = (index: number, drag: DragRef, drop: DropListRef) =>
        props.sortPredicate(index, drag.data as VDragPublicApi, drop.data as VDropListPublicApi);
    }

    const publicApi: VDropListPublicApi = {
      get id() {
        return id;
      },
      get data() {
        return props.data;
      },
      get dropListRef() {
        return dropListRef!;
      },
      get disabled() {
        return disabled;
      },
      getSortedItems,
      _addItem: context.addItem,
      _removeItem: context.removeItem,
    };
    expose(publicApi);

    onMounted(() => {
      dropListRef = createDropListRef<VDropListPublicApi>(rootEl.value!);
      dropListRef.data = publicApi;
      sync();
      _syncItemsWithRef(getSortedItems().map(item => item.dragRef));

      unsubs.push(
        dropListRef.beforeStarted.subscribe(() => {
          sync();
          _syncItemsWithRef(getSortedItems().map(item => item.dragRef));
          dragging.value = true;
        }),
      );
      unsubs.push(
        dropListRef.entered.subscribe(event => {
          emit('entered', {
            container: publicApi,
            item: event.item.data,
            currentIndex: event.currentIndex,
          });
        }),
      );
      unsubs.push(
        dropListRef.exited.subscribe(event => {
          dragging.value = false;
          emit('exited', {
            container: publicApi,
            item: event.item.data,
          });
        }),
      );
      unsubs.push(
        dropListRef.sorted.subscribe(event => {
          emit('sorted', {
            previousIndex: event.previousIndex,
            currentIndex: event.currentIndex,
            container: publicApi,
            item: event.item.data,
          });
        }),
      );
      unsubs.push(
        dropListRef.dropped.subscribe(event => {
          dragging.value = false;
          emit('dropped', {
            previousIndex: event.previousIndex,
            currentIndex: event.currentIndex,
            previousContainer: event.previousContainer.data,
            container: event.container.data,
            item: event.item.data,
            isPointerOverContainer: event.isPointerOverContainer,
            distance: event.distance,
            dropPoint: event.dropPoint,
            event: event.event,
          });
        }),
      );
      unsubs.push(
        dropListRef.receivingStarted.subscribe(() => {
          receiving.value = true;
        }),
      );
      unsubs.push(
        dropListRef.receivingStopped.subscribe(() => {
          receiving.value = false;
        }),
      );
      dropListRegistry.add(publicApi);
      group?.items.add(publicApi);
    });

    onBeforeUnmount(() => {
      unsubs.forEach(unsubscribe => unsubscribe());
      dropListRegistry.delete(publicApi);
      group?.items.delete(publicApi);
      latestSortedRefs = undefined;
      unsortedItems.clear();
      dropListRef?.dispose();
      dropListRef = null;
    });

    watch(
      () => [
        props.disabled,
        props.sortingDisabled,
        props.orientation,
        props.lockAxis,
        props.connectedTo,
        props.autoScrollDisabled,
        props.autoScrollStep,
        props.hasAnchor,
        props.elementContainerSelector,
      ],
      sync,
    );

    return () => {
      const classes = [
        attrs.class,
        'vcdk-drop-list',
        {
          'vcdk-drop-list-dragging': dragging.value,
          'vcdk-drop-list-receiving': receiving.value,
          'vcdk-drop-list-disabled': disabled.value,
        },
      ];
      return h(props.tag, {...attrs, class: classes, ref: rootEl}, slots.default?.());
    };
  },
});
