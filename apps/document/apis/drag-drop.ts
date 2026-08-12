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
