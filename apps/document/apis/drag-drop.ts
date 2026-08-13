import type {ApiGroup} from '../api';

/** drag-drop 模块 API 分组：组件、事件、命令式核心、工具函数与配置类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '声明式组件',
    rows: [
      {
        name: 'VDropList',
        signature: 'component VDropList<T = any>',
        description:
          '拖放容器，对应 Angular cdkDropList。props：data、orientation（vertical/horizontal/mixed，默认 vertical）、disabled、sortingDisabled、lockAxis、connectedTo（实例或 id 字符串数组）、enterPredicate、sortPredicate、autoScrollDisabled、autoScrollStep（默认 2）、elementContainerSelector、hasAnchor、id（缺省自动生成）、tag（默认 div）。emits：dropped / entered / exited / sorted。expose：dropListRef、getSortedItems()、disabled。',
      },
      {
        name: 'VDrag',
        signature: 'component VDrag<T = any>',
        description:
          '拖拽条目，对应 Angular cdkDrag。props：data、lockAxis、rootElementSelector、boundaryElement（选择器/元素/ref）、dragStartDelay、freeDragPosition、disabled、constrainPosition、previewClass、previewContainer（global/parent/元素）、scale、previewMatchSize、tag。emits：started / released / ended / entered / exited / dropped / moved。插槽：默认、#preview="{data}"、#placeholder="{data}"。expose：dragRef、getPlaceholderElement()、getRootElement()、reset()、resetToBoundary()、getFreeDragPosition()、setFreeDragPosition()。',
      },
      {
        name: 'VDropListGroup',
        signature: 'component VDropListGroup',
        description:
          '连接兄弟列表的分组，对应 Angular cdkDropListGroup。只渲染默认插槽（无额外 DOM），组内列表自动互联；disabled prop 会传播到组内所有列表。',
      },
      {
        name: 'vDragHandle',
        signature: 'directive v-drag-handle="{disabled}"',
        description:
          '拖拽手柄，对应 Angular cdkDragHandle。只有手柄可以启动拖拽；绑定值支持布尔或 {disabled: boolean}，禁用后手柄会拦截拖拽。',
      },
    ],
  },
  {
    title: '事件载荷',
    rows: [
      {
        name: 'VDragStart / VDragRelease',
        signature: '{source: VDrag, event}',
        description: '开始/松开拖拽时派发：source 为发起拖拽的 VDrag 实例。',
      },
      {
        name: 'VDragEnd',
        signature: '{source, distance, dropPoint, event}',
        description: '停止拖拽时派发：distance 为自拖拽开始的总位移，dropPoint 为松开时的页面坐标。',
      },
      {
        name: 'VDragDrop',
        signature:
          '{previousIndex, currentIndex, item, container, previousContainer, isPointerOverContainer, distance, dropPoint, event}',
        description:
          '条目放下时派发：previousIndex/currentIndex 为拿起与放下时的索引；container/previousContainer 为放下/拿起时的列表实例。与 Angular CdkDragDrop 字段一致。',
      },
      {
        name: 'VDragMove',
        signature: '{source, pointerPosition, event, distance, delta}',
        description:
          '拖拽过程中逐像素派发（有订阅者才派发）：delta 为沿各轴的移动方向（1/-1/0），距离为相对起点的总位移。',
      },
      {
        name: 'VDragEnter / VDragExit / VDragSortEvent',
        signature: '{container, item, currentIndex?} / {container, item} / {previousIndex, currentIndex, container, item}',
        description: '条目进入/移出容器与拖动中交换位置时派发，字段与 Angular CdkDrag* 一致。',
      },
      {
        name: 'DragMoveEvent',
        signature: '{source: DragRef, pointerPosition: Point, event, distance: Point, delta: {x: -1|0|1; y: -1|0|1}}',
        description:
          '拖拽移动事件载荷（DragRef.moved）：source 为发起移动的 DragRef，pointerPosition 为指针当前位置，distance 为相对起点的总位移，delta 为沿各轴的移动方向。',
      },
      {
        name: 'DragDropEvent',
        signature:
          '{previousIndex, currentIndex, item: DragRef, container: DropListRef, previousContainer: DropListRef, distance, dropPoint, isPointerOverContainer, event}',
        description:
          '条目放下事件载荷（DropListRef.dropped）：previousIndex/currentIndex 为拿起与放下时的索引，container/previousContainer 为放下/拿起时的列表引用，与 Angular CdkDragDrop 字段一致。',
      },
      {
        name: 'DragDropEventStream',
        signature: 'interface DragDropEventStream<T> { subscribe(listener: (value: T) => void): () => void }',
        description: '拖拽事件流的最小订阅契约，DragRef/DropListRef 的事件流均满足该接口。',
      },
    ],
  },
  {
    title: '命令式 API',
    rows: [
      {
        name: 'createDragRef',
        signature: 'createDragRef<T>(element: HTMLElement | Ref, config?: DragRefConfig): DragRef<T>',
        description:
          '把元素变成可拖拽条目（对应 Angular 的 createDragRef，签名去掉 injector）。config 支持 dragStartThreshold（默认 5）、pointerDirectionChangeThreshold（默认 5）、zIndex、parentDragRef。',
      },
      {
        name: 'createDropListRef',
        signature: 'createDropListRef<T>(element: HTMLElement | Ref): DropListRef<T>',
        description: '把元素变成拖放容器（对应 Angular 的 createDropListRef）。',
      },
      {
        name: 'DragRef / DropListRef',
        signature: 'class DragRef<T> / class DropListRef<T>',
        description:
          '命令式拖拽/拖放引用：暴露 started/released/ended/entered/exited/dropped/moved（DragRef）与 entered/exited/dropped/sorted/receivingStarted/receivingStopped（DropListRef）事件流，以及 withHandles、withBoundaryElement、connectedTo、withOrientation 等链式配置。',
      },
      {
        name: 'DragDropRegistry / dragDropRegistry',
        signature: 'class DragDropRegistry / const dragDropRegistry',
        description:
          '全局注册表：维护拖拽条目/容器集合与 document 全局监听，提供 pointerMove / pointerUp 事件流、isDragging、scrolled(shadowRoot?) 与 DOM 节点到组件实例的映射。组件默认共享单例。',
      },
      {
        name: 'DragRefConfig',
        signature:
          'interface DragRefConfig { dragStartThreshold: number; pointerDirectionChangeThreshold: number; zIndex?: number; parentDragRef?: DragRef }',
        description:
          'createDragRef 的配置：dragStartThreshold 为开启拖拽序列所需的最小拖动像素；pointerDirectionChangeThreshold 为判定方向改变的最小像素；zIndex 为预览元素 z-index；parentDragRef 用于嵌套拖拽场景。',
      },
      {
        name: 'DragHandleRef',
        signature: 'interface DragHandleRef { element: HTMLElement; disabled: boolean }',
        description: 'vDragHandle 指令注册到条目上的手柄引用：element 为手柄元素，disabled 标记手柄是否禁用。',
      },
      {
        name: 'VDragPublicApi',
        signature:
          'interface VDragPublicApi<T = any> { data; dragRef; getPlaceholderElement(); getRootElement(); getFreeDragPosition(); setFreeDragPosition(); reset(); resetToBoundary(); _addHandle(); _removeHandle() }',
        description:
          'VDrag 模板 ref 与事件载荷 item/source 暴露的公共 API：data 为附加数据、dragRef 为底层引用、getPlaceholderElement/getRootElement 查询元素、getFreeDragPosition/setFreeDragPosition 读写自由拖拽位置、reset/resetToBoundary 复位。',
      },
      {
        name: 'VDropListPublicApi',
        signature:
          'interface VDropListPublicApi<T = any> { id; data; dropListRef; disabled: Ref<boolean>; getSortedItems(); _addItem(); _removeItem() }',
        description:
          'VDropList 模板 ref 与事件载荷 container 暴露的公共 API：id 为列表唯一标识（connectedTo 可引用）、data 为附加数据、dropListRef 为底层引用、disabled 为响应式禁用状态、getSortedItems 按 DOM 顺序返回已注册条目。',
      },
      {
        name: 'VDropListContext',
        signature:
          'interface VDropListContext { dropListRef: DropListRef | null; disabled: Readonly<Ref<boolean>>; addItem(item: VDragPublicApi): void; removeItem(item: VDragPublicApi): void }',
        description: 'VDrag 获取所属容器的注入上下文，由 VDropList 通过 VCDK_DROP_LIST_CONTEXT 提供。',
      },
      {
        name: 'VCDK_DROP_LIST_CONTEXT',
        signature: 'const VCDK_DROP_LIST_CONTEXT: InjectionKey<VDropListContext>',
        description: '拖放列表上下文注入键，子 VDrag 据此读取所属列表的 ref 与禁用状态。',
      },
      {
        name: 'VDropListGroupContext',
        signature: 'interface VDropListGroupContext { disabled: Ref<boolean>; items: Set<VDropListPublicApi> }',
        description: '拖放分组上下文：disabled 为组级禁用状态（传播到组内列表），items 为组内已注册列表集合。',
      },
      {
        name: 'VCDK_DROP_LIST_GROUP',
        signature: 'const VCDK_DROP_LIST_GROUP: InjectionKey<VDropListGroupContext>',
        description: '拖放分组上下文注入键，VDropList 据此读取所属分组。',
      },
      {
        name: 'dropListRegistry',
        signature: 'const dropListRegistry = new Set<VDropListPublicApi>()',
        description: '页面上的拖放列表静态注册表：connectedTo 按 id 字符串引用其他列表时使用。',
      },
    ],
  },
  {
    title: '排序策略与 DOM 工具',
    rows: [
      {
        name: 'DropListSortStrategy',
        signature:
          'interface DropListSortStrategy { start(items); sort(item, pointerX, pointerY, pointerDelta); enter(item, pointerX, pointerY, index?); withItems(items); withSortPredicate(predicate); withElementContainer(container); reset(); getActiveItemsSnapshot(); getItemIndex(item); getItemAtIndex(index); updateOnScroll(topDifference, leftDifference) }',
        description:
          '拖放列表排序策略契约：start/sort/enter 驱动拖入与交换，withItems/withSortPredicate/withElementContainer 注入配置，reset 恢复顺序，getItemIndex/getItemAtIndex/getActiveItemsSnapshot 查询条目。',
      },
      {
        name: 'SortPredicate',
        signature: 'type SortPredicate<T> = (index: number, item: T) => boolean',
        description: '判定条目能否被排入指定索引的谓词，用于 withSortPredicate。',
      },
      {
        name: 'SingleAxisSortStrategy',
        signature: 'class SingleAxisSortStrategy implements DropListSortStrategy',
        description:
          '单轴排序策略：条目沿主轴（纵向 top / 横向 left）排列，拖动时按指针位置计算目标索引，用 CSS transform 平移其余条目实现可动画重排。orientation 支持 vertical/horizontal。',
      },
      {
        name: 'MixedSortStrategy',
        signature: 'class MixedSortStrategy implements DropListSortStrategy',
        description:
          '混合排序策略：适合可能换行的列表（如 flex-wrap 网格），通过移动 DOM 节点重排，对被挤动条目施加 FLIP 反向位移配合 CSS transition 平滑让位，拖拽结束后按快照恢复容器内节点顺序。',
      },
      {
        name: 'ParentPositionTracker',
        signature: 'class ParentPositionTracker（constructor(document: Document)）',
        description:
          '可滚动祖先位置缓存：cache(elements) 缓存滚动位置与矩形，handleScroll(event) 在滚动时返回差值并平移缓存，clear() 清空，getViewportScrollPosition() 读取视口滚动位置。',
      },
      {
        name: 'deepCloneNode',
        signature: 'deepCloneNode(node: HTMLElement): HTMLElement',
        description:
          '深克隆元素：移除重复 id、转移 canvas 绘制内容与表单控件值（含单选按钮 name 去重），使克隆体可用作拖拽预览或占位符。',
      },
      {
        name: 'DragHelperTemplate',
        signature: 'interface DragHelperTemplate { render(): HTMLElement; destroy(): void }',
        description:
          '拖拽辅助元素（预览/占位符）模板契约：render 返回可插入 DOM 的根元素，destroy 释放模板渲染资源。',
      },
      {
        name: 'DragPreviewTemplate',
        signature: 'interface DragPreviewTemplate extends DragHelperTemplate { matchSize?: boolean }',
        description: '拖拽预览模板：额外支持 matchSize，按原条目尺寸对齐预览。',
      },
    ],
  },
  {
    title: '样式',
    rows: [
      {
        name: 'injectDragDropStyles',
        signature: 'injectDragDropStyles(): void',
        description: '注入拖拽结构样式（幂等，重复调用去重）。',
      },
      {
        name: 'removeInjectedDragDropStyles',
        signature: 'removeInjectedDragDropStyles(): void',
        description: '移除已注入的拖拽结构样式。',
      },
      {
        name: 'vcdkDragDropStyles',
        signature: 'const vcdkDragDropStyles: string',
        description: '拖拽结构样式源码，供需要手动控制的场景使用。',
      },
    ],
  },
  {
    title: '工具函数',
    rows: [
      {
        name: 'moveItemInArray',
        signature: 'moveItemInArray<T>(array: T[], fromIndex: number, toIndex: number): void',
        description: '把条目从 fromIndex 移动到 toIndex，其余条目按方向顺移；索引越界收敛到边界。',
      },
      {
        name: 'transferArrayItem',
        signature:
          'transferArrayItem<T>(currentArray: T[], targetArray: T[], currentIndex: number, targetIndex: number): void',
        description: '把条目从源数组转移到目标数组（源数组移除该条目），用于跨容器拖拽后的数据更新。',
      },
      {
        name: 'copyArrayItem',
        signature:
          'copyArrayItem<T>(currentArray: T[], targetArray: T[], currentIndex: number, targetIndex: number): void',
        description: '复制条目到目标数组，源数组保持不变。',
      },
    ],
  },
  {
    title: '配置与类型',
    rows: [
      {
        name: 'DragDropConfig',
        signature: 'interface DragDropConfig',
        description:
          '全局默认配置：lockAxis、dragStartDelay、constrainPosition、previewClass、boundaryElement、rootElementSelector、draggingDisabled、sortingDisabled、listAutoScrollDisabled、listOrientation、zIndex、previewContainer。',
      },
      {
        name: 'DragAxis / DropListOrientation',
        signature: "type DragAxis = 'x' | 'y'; type DropListOrientation = 'horizontal' | 'vertical' | 'mixed'",
        description: '锁定轴与列表朝向类型。',
      },
      {
        name: 'DragStartDelay / Point / PreviewContainer / DragConstrainPosition',
        signature:
          "type DragStartDelay = number | {touch: number; mouse: number}; type Point = {x: number; y: number}; type PreviewContainer = 'global' | 'parent' | HTMLElement | Ref; type DragConstrainPosition = (userPointerPosition, dragRef, dimensions, pickupPositionInElement) => Point",
        description: '拖拽启动延迟、坐标点、预览插入位置与自定义位置约束函数类型。',
      },
    ],
  },
];
