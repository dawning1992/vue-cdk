/**
 * 混合排序策略，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 支持可能换行的列表（如 flex-wrap 网格）：通过移动 DOM 节点重排，
 * 拖拽结束后按快照恢复容器内节点顺序。
 */

import {getShadowRoot} from '../../platform';
import {moveItemInArray} from '../drag-utils';
import {dragDropRegistry, type DragDropRegistry} from '../drag-drop-registry';
import type {DragRef} from '../drag-ref';
import {type DropListSortStrategy, type SortPredicate} from './drop-list-sort-strategy';

/**
 * 混合排序策略：排序通过 DOM 节点移动实现，适合 wrap 布局；
 * 同时记录节点与其 nextSibling 的关系，便于 reset 时恢复顺序。
 */
export class MixedSortStrategy implements DropListSortStrategy {
  private _element!: HTMLElement;
  private _sortPredicate!: SortPredicate<DragRef>;

  /** 懒解析的根节点（文档或 shadow root）。 */
  private _rootNode: DocumentOrShadowRoot | undefined;

  private _activeItems!: DragRef[];

  /** 上次交换记录，抑制指针未离开条目时的重复交换。 */
  private _previousSwap = {
    drag: null as DragRef | null,
    deltaX: 0,
    deltaY: 0,
    overlaps: false,
  };

  /** 拖拽开始时节点与其 nextSibling 的关系快照。 */
  private _relatedNodes: [node: Node, nextSibling: Node | null][] = [];

  constructor(
    private _document: Document,
    private _dragDropRegistry: DragDropRegistry = dragDropRegistry,
  ) {}

  /** 拖拽开始：记录容器节点关系并同步条目。 */
  start(items: readonly DragRef[]): void {
    const childNodes = this._element.childNodes;
    this._relatedNodes = [];

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      this._relatedNodes.push([node, node.nextSibling]);
    }

    this.withItems(items);
  }

  /** 按指针命中元素排序：把占位符移动到目标条目前后。 */
  sort(
    item: DragRef,
    pointerX: number,
    pointerY: number,
    pointerDelta: {x: number; y: number},
  ): {previousIndex: number; currentIndex: number} | null {
    const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY);
    const previousSwap = this._previousSwap;

    if (newIndex === -1 || this._activeItems[newIndex] === item) {
      return null;
    }

    const toSwapWith = this._activeItems[newIndex];

    if (
      previousSwap.drag === toSwapWith &&
      previousSwap.overlaps &&
      previousSwap.deltaX === pointerDelta.x &&
      previousSwap.deltaY === pointerDelta.y
    ) {
      return null;
    }

    const previousIndex = this.getItemIndex(item);
    const current = item.getPlaceholderElement();
    const overlapElement = toSwapWith.getRootElement();

    if (newIndex > previousIndex) {
      overlapElement.after(current);
    } else {
      overlapElement.before(current);
    }

    moveItemInArray(this._activeItems, previousIndex, newIndex);

    const newOverlapElement = this._getRootNode().elementFromPoint(pointerX, pointerY);
    previousSwap.deltaX = pointerDelta.x;
    previousSwap.deltaY = pointerDelta.y;
    previousSwap.drag = toSwapWith;
    previousSwap.overlaps =
      overlapElement === newOverlapElement || overlapElement.contains(newOverlapElement);

    return {
      previousIndex,
      currentIndex: newIndex,
    };
  }

  /** 条目进入容器：按索引或最近元素插入。 */
  enter(item: DragRef, pointerX: number, pointerY: number, index?: number): void {
    const currentIndex = this._activeItems.indexOf(item);

    if (currentIndex > -1) {
      this._activeItems.splice(currentIndex, 1);
    }

    let enterIndex =
      index == null || index < 0
        ? this._getItemIndexFromPointerPosition(item, pointerX, pointerY)
        : index;

    if (enterIndex === -1) {
      enterIndex = this._getClosestItemIndexToPointer(item, pointerX, pointerY);
    }

    const targetItem = this._activeItems[enterIndex] as DragRef | undefined;

    if (targetItem && !this._dragDropRegistry.isDragging(targetItem)) {
      this._activeItems.splice(enterIndex, 0, item);
      targetItem.getRootElement().before(item.getPlaceholderElement());
    } else {
      this._activeItems.push(item);
      this._element.appendChild(item.getPlaceholderElement());
    }
  }

  /** 同步条目集合。 */
  withItems(items: readonly DragRef[]): void {
    this._activeItems = items.slice();
  }

  /** 设置排序判定函数。 */
  withSortPredicate(predicate: SortPredicate<DragRef>): void {
    this._sortPredicate = predicate;
  }

  /** 恢复容器节点原始顺序并清空状态。 */
  reset(): void {
    const root = this._element;
    const previousSwap = this._previousSwap;

    for (let i = this._relatedNodes.length - 1; i > -1; i--) {
      const [node, nextSibling] = this._relatedNodes[i];
      if (node.parentNode === root && node.nextSibling !== nextSibling) {
        if (nextSibling === null) {
          root.appendChild(node);
        } else if (nextSibling.parentNode === root) {
          root.insertBefore(node, nextSibling);
        }
      }
    }

    this._relatedNodes = [];
    this._activeItems = [];
    previousSwap.drag = null;
    previousSwap.deltaX = previousSwap.deltaY = 0;
    previousSwap.overlaps = false;
  }

  /** 当前活动条目快照。 */
  getActiveItemsSnapshot(): readonly DragRef[] {
    return this._activeItems;
  }

  /** 条目索引。 */
  getItemIndex(item: DragRef): number {
    return this._activeItems.indexOf(item);
  }

  /** 指定索引的条目。 */
  getItemAtIndex(index: number): DragRef | null {
    return this._activeItems[index] || null;
  }

  /** 滚动时让拖拽中的条目按最近指针位置重排。 */
  updateOnScroll(): void {
    this._activeItems.forEach(item => {
      if (this._dragDropRegistry.isDragging(item)) {
        item._sortFromLastPointerPosition();
      }
    });
  }

  /** 设置列表元素容器并失效根节点缓存。 */
  withElementContainer(container: HTMLElement): void {
    if (container !== this._element) {
      this._element = container;
      this._rootNode = undefined;
    }
  }

  /** 按指针命中的元素计算目标索引。 */
  private _getItemIndexFromPointerPosition(
    item: DragRef,
    pointerX: number,
    pointerY: number,
  ): number {
    const elementAtPoint = this._getRootNode().elementFromPoint(
      Math.floor(pointerX),
      Math.floor(pointerY),
    );
    const index = elementAtPoint
      ? this._activeItems.findIndex(item => {
          const root = item.getRootElement();
          return elementAtPoint === root || root.contains(elementAtPoint);
        })
      : -1;
    return index === -1 || !this._sortPredicate(index, item) ? -1 : index;
  }

  /** 懒解析列表根节点，确保元素已处于最终 DOM 位置。 */
  private _getRootNode(): DocumentOrShadowRoot {
    if (!this._rootNode) {
      this._rootNode = getShadowRoot(this._element) || this._document;
    }
    return this._rootNode;
  }

  /** 找出与指针欧氏距离最近的条目索引。 */
  private _getClosestItemIndexToPointer(item: DragRef, pointerX: number, pointerY: number): number {
    if (this._activeItems.length === 0) {
      return -1;
    }

    if (this._activeItems.length === 1) {
      return 0;
    }

    let minDistance = Infinity;
    let minIndex = -1;

    for (let i = 0; i < this._activeItems.length; i++) {
      const current = this._activeItems[i];
      if (current !== item) {
        const {x, y} = current.getRootElement().getBoundingClientRect();
        const distance = Math.hypot(pointerX - x, pointerY - y);

        if (distance < minDistance) {
          minDistance = distance;
          minIndex = i;
        }
      }
    }

    return minIndex;
  }
}
