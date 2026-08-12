/**
 * 拖拽事件载荷类型，字段与 Angular CDK drag-drop 的 CdkDrag* 事件一一对应。
 * `item` / `container` / `source` 引用的是组件实例（defineExpose 暴露的公共 API）。
 */

import type {VDropListPublicApi} from './v-drop-list';
import type {VDragPublicApi} from './v-drag';

/** 用户开始拖拽条目时派发。 */
export interface VDragStart<T = any> {
  /** 发起拖拽的条目。 */
  source: VDragPublicApi<T>;
  /** 启动拖拽序列的原生事件。 */
  event: MouseEvent | TouchEvent;
}

/** 用户松开条目（动画开始前）派发。 */
export interface VDragRelease<T = any> {
  source: VDragPublicApi<T>;
  event: MouseEvent | TouchEvent;
}

/** 用户停止拖拽条目时派发。 */
export interface VDragEnd<T = any> {
  source: VDragPublicApi<T>;
  /** 自拖拽序列开始以来的位移（像素）。 */
  distance: {x: number; y: number};
  /** 松开指针时的页面坐标。 */
  dropPoint: {x: number; y: number};
  event: MouseEvent | TouchEvent;
}

/** 条目进入新容器时派发。 */
export interface VDragEnter<T = any, I = T> {
  container: VDropListPublicApi<T>;
  item: VDragPublicApi<I>;
  currentIndex: number;
}

/** 条目移出容器时派发。 */
export interface VDragExit<T = any, I = T> {
  container: VDropListPublicApi<T>;
  item: VDragPublicApi<I>;
}

/** 条目在容器内放下时派发。 */
export interface VDragDrop<T = any, O = T, I = any> {
  /** 条目被拿起时的索引。 */
  previousIndex: number;
  /** 条目放下时的索引。 */
  currentIndex: number;
  item: VDragPublicApi<I>;
  container: VDropListPublicApi<T>;
  /** 条目被拿起时所在的容器（可与 container 相同）。 */
  previousContainer: VDropListPublicApi<O>;
  /** 放下时指针是否位于容器内。 */
  isPointerOverContainer: boolean;
  distance: {x: number; y: number};
  dropPoint: {x: number; y: number};
  event: MouseEvent | TouchEvent;
}

/** 拖拽过程中逐像素派发。 */
export interface VDragMove<T = any> {
  source: VDragPublicApi<T>;
  pointerPosition: {x: number; y: number};
  event: MouseEvent | TouchEvent;
  distance: {x: number; y: number};
  /** 沿各轴的移动方向：1 增加、-1 减少、0 未变化。 */
  delta: {x: -1 | 0 | 1; y: -1 | 0 | 1};
}

/** 拖动中条目交换位置时派发。 */
export interface VDragSortEvent<T = any, I = T> {
  previousIndex: number;
  currentIndex: number;
  container: VDropListPublicApi<T>;
  item: VDragPublicApi<I>;
}
