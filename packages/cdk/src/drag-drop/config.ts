/**
 * 拖拽配置类型，对齐 Angular CDK drag-drop 的 directives/config。
 */

import type {DragConstrainPosition} from './drag-ref';

/** 拖拽启动延迟：固定毫秒数或按输入类型区分。 */
export type DragStartDelay = number | {touch: number; mouse: number};

/** 可锁定拖拽的轴。 */
export type DragAxis = 'x' | 'y';

/** 拖放列表朝向。 */
export type DropListOrientation = 'horizontal' | 'vertical' | 'mixed';

/**
 * 拖拽组件的全局默认配置（对应 Angular CDK_DRAG_CONFIG）。
 * 组件 props 未显式提供时使用这些默认值。
 */
export interface DragDropConfig extends Partial<{
  lockAxis: DragAxis | null;
  dragStartDelay: DragStartDelay;
  constrainPosition: DragConstrainPosition;
  previewClass: string | string[];
  boundaryElement: string;
  rootElementSelector: string;
  draggingDisabled: boolean;
  sortingDisabled: boolean;
  listAutoScrollDisabled: boolean;
  listOrientation: DropListOrientation;
  zIndex: number;
  previewContainer: 'global' | 'parent';
}> {}
