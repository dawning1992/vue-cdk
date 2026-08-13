/**
 * drag-drop 模块入口，对齐 Angular CDK 的 `@angular/cdk/drag-drop`。
 *
 * 覆盖能力：
 * - 命令式核心：createDragRef / createDropListRef、DragRef / DropListRef、
 *   DragDropRegistry（dragDropRegistry 单例）；
 * - 声明式组件：VDropList / VDrag / VDropListGroup + vDragHandle 指令；
 * - 工具函数：moveItemInArray / transferArrayItem / copyArrayItem；
 * - 全部事件载荷类型与配置类型。
 */

export {createDragRef, DragRef} from './drag-ref';
export type {
  DragConstrainPosition,
  DragHelperTemplate,
  DragMoveEvent,
  DragPreviewTemplate,
  DragRefConfig,
  Point,
  PreviewContainer,
} from './drag-ref';
export {createDropListRef, DropListRef} from './drop-list-ref';
export {dragDropRegistry, DragDropRegistry} from './drag-drop-registry';
export type {DragDropEventStream} from './drag-drop-registry';
export {VDropList, dropListRegistry, VCDK_DROP_LIST_CONTEXT} from './v-drop-list';
export type {VDropListContext, VDropListPublicApi} from './v-drop-list';
export {VDrag} from './v-drag';
export type {DragHandleRef, VDragPublicApi} from './v-drag';
export {VDropListGroup, VCDK_DROP_LIST_GROUP} from './v-drop-list-group';
export type {VDropListGroupContext} from './v-drop-list-group';
export {vDragHandle} from './v-drag-handle';
export type {
  VDragDrop,
  VDragEnd,
  VDragEnter,
  VDragExit,
  VDragMove,
  VDragRelease,
  VDragSortEvent,
  VDragStart,
} from './drag-events';
export type {DragAxis, DragDropConfig, DragStartDelay, DropListOrientation} from './config';
export {moveItemInArray, transferArrayItem, copyArrayItem} from './drag-utils';
export {injectDragDropStyles, removeInjectedDragDropStyles, vcdkDragDropStyles} from './style-inject';
export {deepCloneNode} from './dom/clone-node';
export {ParentPositionTracker} from './dom/parent-position-tracker';
export {SingleAxisSortStrategy} from './sorting/single-axis-sort-strategy';
export {MixedSortStrategy} from './sorting/mixed-sort-strategy';
export type {DropListSortStrategy, SortPredicate} from './sorting/drop-list-sort-strategy';
