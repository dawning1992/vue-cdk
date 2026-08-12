/**
 * 拖放列表排序策略接口，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 */

import type {DragRef} from '../drag-ref';

/** 判定条目能否被排入指定索引。 */
export type SortPredicate<T> = (index: number, item: T) => boolean;

/**
 * 拖放列表排序策略契约。
 * 单轴策略用 CSS transform 做动画重排；混合策略直接移动 DOM 节点。
 */
export interface DropListSortStrategy {
  start(items: readonly DragRef[]): void;
  sort(
    item: DragRef,
    pointerX: number,
    pointerY: number,
    pointerDelta: {x: number; y: number},
  ): {previousIndex: number; currentIndex: number} | null;
  enter(item: DragRef, pointerX: number, pointerY: number, index?: number): void;
  withItems(items: readonly DragRef[]): void;
  withSortPredicate(predicate: SortPredicate<DragRef>): void;
  withElementContainer(container: HTMLElement): void;
  reset(): void;
  getActiveItemsSnapshot(): readonly DragRef[];
  getItemIndex(item: DragRef): number;
  getItemAtIndex(index: number): DragRef | null;
  updateOnScroll(topDifference: number, leftDifference: number): void;
}
